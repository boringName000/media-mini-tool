// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { articleIds } = event
    
    // 验证输入参数
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return {
        success: false,
        message: '参数错误：articleIds 必须是非空数组'
      }
    }
    
    // 限制批量删除数量，避免超时
    if (articleIds.length > 20) {
      return {
        success: false,
        message: '参数错误：单次删除最多支持20篇文章'
      }
    }
    
    // 验证文章ID格式
    for (let i = 0; i < articleIds.length; i++) {
      const articleId = articleIds[i]
      if (!articleId || typeof articleId !== 'string') {
        return {
          success: false,
          message: `第 ${i + 1} 个文章ID格式错误，必须是非空字符串`
        }
      }
    }
    
    console.log(`开始批量删除 ${articleIds.length} 篇文章...`)
    
    // 🚀 第一步：批量查询所有文章数据（一次数据库调用）
    console.log('第一步：批量查询文章数据...')
    const queryResult = await db.collection('article-mgr')
      .where({
        articleId: db.command.in(articleIds)
      })
      .get()
    
    const foundArticles = queryResult.data || []
    console.log(`查询到 ${foundArticles.length} 篇文章数据`)
    
    // 检查未找到的文章
    const foundArticleIds = foundArticles.map(article => article.articleId)
    const notFoundIds = articleIds.filter(id => !foundArticleIds.includes(id))
    
    if (notFoundIds.length > 0) {
      console.warn(`未找到的文章ID: ${notFoundIds.join(', ')}`)
    }
    
    if (foundArticles.length === 0) {
      return {
        success: false,
        message: '没有找到任何要删除的文章',
        data: {
          notFoundIds: notFoundIds
        }
      }
    }
    
    // 🚀 第二步：批量删除云存储文件
    console.log('第二步：批量删除云存储文件...')
    const cloudDeleteResult = await batchDeleteCloudFiles(foundArticles)
    
    // 🚀 第三步：只删除云存储文件成功删除的数据库记录（保证数据一致性）
    console.log('第三步：删除云存储成功的数据库记录...')
    const articlesToDeleteFromDB = foundArticles.filter(article => {
      // 如果文章没有云存储文件URL，也可以删除数据库记录
      if (!article.downloadUrl || article.downloadUrl.trim() === '') {
        return true
      }
      // 只有云存储文件删除成功的才删除数据库记录
      return cloudDeleteResult.successFiles.includes(article.downloadUrl)
    })
    
    console.log(`云存储删除成功 ${cloudDeleteResult.successCount} 个文件，准备删除对应的 ${articlesToDeleteFromDB.length} 条数据库记录`)
    
    const dbDeleteResult = await batchDeleteDatabaseRecords(articlesToDeleteFromDB)
    
    // 🚀 第四步：整理删除结果
    const results = foundArticles.map(article => {
      const cloudDeleteSuccess = !article.downloadUrl || article.downloadUrl.trim() === '' || 
                                 cloudDeleteResult.successFiles.includes(article.downloadUrl)
      const cloudDeleteError = cloudDeleteResult.failedFiles.find(f => f.fileID === article.downloadUrl)?.errMsg || null
      const shouldDeleteDB = articlesToDeleteFromDB.some(a => a._id === article._id)
      
      return {
        articleId: article.articleId,
        articleTitle: article.articleTitle || '未知标题',
        trackType: article.trackType,
        platformType: article.platformType,
        dbId: article._id,
        downloadUrl: article.downloadUrl,
        cloudDeleteSuccess: cloudDeleteSuccess,
        cloudDeleteError: cloudDeleteError,
        dbDeleteSuccess: shouldDeleteDB && dbDeleteResult.success,
        dbDeleteSkipped: !shouldDeleteDB && !cloudDeleteSuccess, // 因为云存储删除失败而跳过数据库删除
        fullyDeleted: cloudDeleteSuccess && shouldDeleteDB && dbDeleteResult.success
      }
    })
    
    // 统计完全删除成功的文章数量
    const fullyDeletedCount = results.filter(r => r.fullyDeleted).length
    const partiallyDeletedCount = results.filter(r => r.cloudDeleteSuccess && !r.dbDeleteSuccess).length
    const failedCount = results.filter(r => !r.cloudDeleteSuccess).length
    
    const finalMessage = `完全删除 ${fullyDeletedCount} 篇文章` + 
                        (partiallyDeletedCount > 0 ? `，部分删除 ${partiallyDeletedCount} 篇` : '') +
                        (failedCount > 0 ? `，删除失败 ${failedCount} 篇` : '') +
                        (notFoundIds.length > 0 ? `，未找到 ${notFoundIds.length} 篇` : '')
    
    console.log(`✅ 云函数执行完成: ${finalMessage}`)
    
    return {
      success: true,
      message: finalMessage,
      data: {
        fullyDeletedCount: fullyDeletedCount,
        partiallyDeletedCount: partiallyDeletedCount,
        failedCount: failedCount,
        notFoundCount: notFoundIds.length,
        results: results,
        notFoundIds: notFoundIds,
        cloudDeleteSummary: {
          totalFiles: cloudDeleteResult.totalFiles,
          successCount: cloudDeleteResult.successCount,
          failedCount: cloudDeleteResult.failedCount
        },
        dbDeleteSummary: {
          success: dbDeleteResult.success,
          deletedCount: dbDeleteResult.deletedCount,
          error: dbDeleteResult.error,
          candidateCount: articlesToDeleteFromDB.length
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 云函数执行出错:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      event: event
    })
    return {
      success: false,
      message: '服务器内部错误',
      error: error.message || '未知错误'
    }
  }
}

/**
 * 🚀 批量删除云存储文件
 * @param {Array} articles - 文章数据数组
 * @returns {Object} 删除结果
 */
async function batchDeleteCloudFiles(articles) {
  // 提取所有有效的云存储文件URL
  const fileList = articles
    .map(article => article.downloadUrl)
    .filter(url => url && url.trim() !== '')
  
  if (fileList.length === 0) {
    console.log('没有需要删除的云存储文件')
    return {
      totalFiles: 0,
      successCount: 0,
      failedCount: 0,
      successFiles: [],
      failedFiles: []
    }
  }
  
  console.log(`准备删除 ${fileList.length} 个云存储文件`)
  
  try {
    // 🚀 使用微信云开发的批量删除API
    const deleteResult = await cloud.deleteFile({
      fileList: fileList
    })
    
    const successFiles = []
    const failedFiles = []
    
    // 处理删除结果
    if (deleteResult.fileList && Array.isArray(deleteResult.fileList)) {
      deleteResult.fileList.forEach(result => {
        if (result.status === 0) {
          // 删除成功
          successFiles.push(result.fileID)
        } else {
          // 删除失败
          failedFiles.push({
            fileID: result.fileID,
            errCode: result.errCode,
            errMsg: result.errMsg
          })
        }
      })
    }
    
    console.log(`云存储文件删除完成: 成功 ${successFiles.length} 个，失败 ${failedFiles.length} 个`)
    
    if (failedFiles.length > 0) {
      console.warn('删除失败的文件:', failedFiles)
    }
    
    return {
      totalFiles: fileList.length,
      successCount: successFiles.length,
      failedCount: failedFiles.length,
      successFiles: successFiles,
      failedFiles: failedFiles
    }
    
  } catch (error) {
    console.error('批量删除云存储文件失败:', error)
    return {
      totalFiles: fileList.length,
      successCount: 0,
      failedCount: fileList.length,
      successFiles: [],
      failedFiles: fileList.map(fileID => ({
        fileID: fileID,
        errMsg: error.message || '删除失败'
      }))
    }
  }
}

/**
 * 🚀 批量删除数据库记录
 * @param {Array} articles - 文章数据数组
 * @returns {Object} 删除结果
 */
async function batchDeleteDatabaseRecords(articles) {
  if (articles.length === 0) {
    return {
      success: true,
      deletedCount: 0,
      error: null
    }
  }
  
  // 提取所有文章ID用于批量删除
  const articleIds = articles.map(article => article.articleId)
  
  console.log(`准备批量删除 ${articleIds.length} 条数据库记录`)
  
  try {
    // 🚀 使用微信云开发的批量删除功能
    const deleteResult = await db.collection('article-mgr')
      .where({
        articleId: db.command.in(articleIds)
      })
      .remove()
    
    const deletedCount = deleteResult.stats.removed || 0
    console.log(`数据库记录删除完成: 删除了 ${deletedCount} 条记录`)
    
    return {
      success: true,
      deletedCount: deletedCount,
      error: null
    }
    
  } catch (error) {
    console.error('批量删除数据库记录失败:', error)
    return {
      success: false,
      deletedCount: 0,
      error: error.message || '删除失败'
    }
  }
}