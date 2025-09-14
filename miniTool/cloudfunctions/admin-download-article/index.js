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
    
    // 限制批量下载数量，避免超时
    if (articleIds.length > 10) {
      return {
        success: false,
        message: '参数错误：单次下载最多支持10篇文章'
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
    
    console.log(`开始批量获取 ${articleIds.length} 篇文章的下载链接...`)
    
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
        message: '没有找到任何要下载的文章',
        data: {
          notFoundIds: notFoundIds
        }
      }
    }
    
    // 🚀 第二步：批量读取文件内容
    console.log('第二步：批量读取文件内容...')
    const downloadResult = await batchDownloadFileContents(foundArticles)
    
    // 🚀 第三步：整理下载结果
    const results = foundArticles.map(article => {
      const fileResult = downloadResult.successFiles.find(file => file.fileID === article.downloadUrl)
      const error = downloadResult.failedFiles.find(file => file.fileID === article.downloadUrl)?.error || null
      
      return {
        articleId: article.articleId,
        articleTitle: article.articleTitle || '未知标题',
        trackType: article.trackType,
        platformType: article.platformType,
        originalFileID: article.downloadUrl,
        fileContent: fileResult ? Array.from(new Uint8Array(fileResult.fileContent)) : null, // 转换为数组便于传输
        fileSize: fileResult ? fileResult.fileSize : 0,
        downloadSuccess: !!fileResult,
        downloadError: error,
        uploadTime: article.uploadTime
      }
    })
    
    const successCount = results.filter(r => r.downloadSuccess).length
    const failedCount = results.filter(r => !r.downloadSuccess).length
    
    const finalMessage = `成功读取 ${successCount} 篇文章内容${failedCount > 0 ? `，${failedCount} 篇文章读取失败` : ''}${notFoundIds.length > 0 ? `，${notFoundIds.length} 篇文章未找到` : ''}`
    console.log(`✅ 云函数执行完成: ${finalMessage}`)
    
    return {
      success: true,
      message: finalMessage,
      data: {
        successCount: successCount,
        failedCount: failedCount,
        notFoundCount: notFoundIds.length,
        results: results,
        notFoundIds: notFoundIds,
        downloadSummary: {
          totalFiles: downloadResult.totalFiles,
          successCount: downloadResult.successCount,
          failedCount: downloadResult.failedCount,
          totalSize: downloadResult.totalSize
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
 * 🚀 批量下载文件内容
 * @param {Array} articles - 文章数据数组
 * @returns {Object} 下载结果
 */
async function batchDownloadFileContents(articles) {
  // 提取所有有效的云存储文件ID
  const fileList = articles
    .map(article => article.downloadUrl)
    .filter(url => url && url.trim() !== '' && url.startsWith('cloud://'))
  
  if (fileList.length === 0) {
    console.log('没有需要下载的云存储文件')
    return {
      totalFiles: 0,
      successCount: 0,
      failedCount: 0,
      successFiles: [],
      failedFiles: [],
      totalSize: 0
    }
  }
  
  console.log(`准备下载 ${fileList.length} 个云存储文件的内容`)
  
  // 🚀 使用 Promise.allSettled 并发下载文件内容（最多10个并发）
  const downloadPromises = fileList.map(async (fileID) => {
    try {
      console.log(`开始下载文件: ${fileID}`)
      const downloadResult = await cloud.downloadFile({
        fileID: fileID
      })
      
      const fileContent = downloadResult.fileContent
      const fileSize = fileContent.length
      
      // 检查文件大小限制（1MB = 1024 * 1024 bytes）
      const maxFileSize = 1024 * 1024 // 1MB
      if (fileSize > maxFileSize) {
        throw new Error(`文件大小 ${Math.round(fileSize / 1024)}KB 超过限制 1MB`)
      }
      
      console.log(`文件下载成功: ${fileID}, 大小: ${Math.round(fileSize / 1024)}KB`)
      
      return {
        success: true,
        fileID: fileID,
        fileContent: fileContent,
        fileSize: fileSize
      }
    } catch (error) {
      console.error(`文件下载失败: ${fileID}`, error)
      return {
        success: false,
        fileID: fileID,
        error: error.message || '下载文件失败'
      }
    }
  })
  
  // 等待所有下载完成（使用 allSettled 确保容错性）
  const downloadResults = await Promise.allSettled(downloadPromises)
  
  const successFiles = []
  const failedFiles = []
  let totalSize = 0
  
  // 处理下载结果
  downloadResults.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      // 下载成功
      const fileResult = result.value
      successFiles.push({
        fileID: fileResult.fileID,
        fileContent: fileResult.fileContent,
        fileSize: fileResult.fileSize
      })
      totalSize += fileResult.fileSize
    } else {
      // 下载失败
      const fileID = fileList[index]
      const error = result.status === 'fulfilled' ? result.value.error : result.reason?.message || '未知错误'
      failedFiles.push({
        fileID: fileID,
        error: error
      })
    }
  })
  
  console.log(`文件内容下载完成: 成功 ${successFiles.length} 个，失败 ${failedFiles.length} 个`)
  console.log(`总下载大小: ${Math.round(totalSize / 1024)}KB`)
  
  if (failedFiles.length > 0) {
    console.warn('下载失败的文件:', failedFiles.map(f => ({ fileID: f.fileID, error: f.error })))
  }
  
  return {
    totalFiles: fileList.length,
    successCount: successFiles.length,
    failedCount: failedFiles.length,
    successFiles: successFiles,
    failedFiles: failedFiles,
    totalSize: totalSize
  }
}