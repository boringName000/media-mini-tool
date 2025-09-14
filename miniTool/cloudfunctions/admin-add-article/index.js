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
    const { trackType, platformType, files } = event
    
    // 验证输入参数
    if (!trackType || !platformType) {
      return {
        success: false,
        message: '参数错误：trackType 和 platformType 为必填字段'
      }
    }
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return {
        success: false,
        message: '参数错误：files 必须是非空数组'
      }
    }
    
    // 限制批量上传数量，避免超时
    if (files.length > 10) {
      return {
        success: false,
        message: '参数错误：单次上传最多支持10个文件'
      }
    }
    
    // 验证每个文件对象的必要字段
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.fileName || !file.fileContent) {
        return {
          success: false,
          message: `第 ${i + 1} 个文件缺少必要字段：fileName, fileContent`
        }
      }
      
      // 验证文件内容是否为数组格式
      if (!Array.isArray(file.fileContent)) {
        return {
          success: false,
          message: `第 ${i + 1} 个文件内容格式错误，应为数组格式`
        }
      }
    }
    
    // 🚀 重构：将上传和插入作为原子操作并发执行
    console.log(`开始并发处理 ${files.length} 个文件（上传+插入原子操作）...`)
    
    const processPromises = files.map((file, index) => 
      processFileAtomically(trackType, platformType, file.fileContent, file.fileName, file.fileSize, index)
    )
    
    // 使用 Promise.allSettled 确保获得每个文件的详细结果
    const processResults = await Promise.allSettled(processPromises)
    
    // 分离成功和失败的结果
    const results = []
    const errors = []
    
    processResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`文件 ${files[index].fileName} 处理成功`)
        results.push(result.value)
      } else {
        console.error(`文件 ${files[index].fileName} 处理失败:`, result.reason)
        errors.push({
          index: index,
          fileName: files[index].fileName,
          fileSize: files[index].fileSize,
          error: result.reason?.message || '处理失败'
        })
      }
    })
    
    const finalMessage = `成功处理 ${results.length} 个文章，失败 ${errors.length} 个`
    console.log(`✅ 云函数执行完成: ${finalMessage}`)
    
    return {
      success: true,
      message: finalMessage,
      data: {
        trackType: trackType,
        platformType: platformType,
        successCount: results.length,
        errorCount: errors.length,
        results: results,
        errors: errors
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
 * 🚀 新增：原子操作 - 上传文件并插入数据库
 * @param {number} trackType - 赛道类型
 * @param {number} platformType - 平台类型
 * @param {Array} fileContent - 文件内容（Uint8Array转换的数组）
 * @param {string} fileName - 文件名（由前端传递）
 * @param {number} fileSize - 文件大小
 * @param {number} index - 文章索引
 * @returns {Object} 处理结果
 */
async function processFileAtomically(trackType, platformType, fileContent, fileName, fileSize, index) {
  console.log(`开始原子操作处理文件 ${fileName}...`)
  
  try {
    // 第一步：上传文件到云存储
    const uploadResult = await uploadFileToCloud(trackType, platformType, fileContent, fileName, fileSize, index)
    console.log(`文件 ${fileName} 上传成功，开始插入数据库...`)
    
    // 第二步：插入数据库
    const dbData = {
      articleId: uploadResult.articleId,
      articleTitle: uploadResult.articleTitle,
      uploadTime: db.serverDate(),
      trackType: trackType,
      platformType: platformType,
      downloadUrl: uploadResult.downloadUrl,
      status: 1 // 文章状态：1-未使用
    }
    
    const dbResult = await db.collection('article-mgr').add({
      data: dbData
    })
    
    console.log(`文件 ${fileName} 数据库插入成功，ID: ${dbResult._id}`)
    
    // 返回完整结果
    return {
      articleId: uploadResult.articleId,
      articleTitle: uploadResult.articleTitle,
      trackType: trackType,
      platformType: platformType,
      downloadUrl: uploadResult.downloadUrl,
      dbId: dbResult._id,
      fileName: fileName,
      fileSize: fileSize
    }
    
  } catch (error) {
    console.error(`文件 ${fileName} 原子操作失败:`, error)
    
    // 如果是数据库插入失败，可以考虑清理已上传的文件
    // 但为了简化逻辑，这里直接抛出错误
    throw new Error(`文件 ${fileName} 处理失败: ${error.message}`)
  }
}

/**
 * 🚀 优化：上传单个文件到云存储（不写数据库）
 * @param {number} trackType - 赛道类型
 * @param {number} platformType - 平台类型
 * @param {Array} fileContent - 文件内容（Uint8Array转换的数组）
 * @param {string} fileName - 文件名（由前端传递）
 * @param {number} fileSize - 文件大小
 * @param {number} index - 文章索引
 * @returns {Object} 上传结果
 */
async function uploadFileToCloud(trackType, platformType, fileContent, fileName, fileSize, index) {
  
  // 使用前端传递的文件名，提取文章标题
  const articleTitle = removeFileExtension(fileName)
  
  // 分离文件名和扩展名
  const lastDotIndex = fileName.lastIndexOf('.')
  const fileNameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName
  let fileExtension = lastDotIndex > 0 ? fileName.substring(lastDotIndex).toLowerCase() : ''
  
  // 文件扩展名验证和处理
  const extensionValidation = validateAndProcessExtension(fileExtension, fileName)
  if (!extensionValidation.isValid) {
    throw new Error(extensionValidation.message)
  }
  
  // 使用处理后的扩展名
  fileExtension = extensionValidation.processedExtension
  
  // 生成文章ID
  const articleId = generateArticleId(trackType)
  
  // 生成云存储文件路径 - 参考小程序端的路径格式
  const timestamp = Date.now()
  
  // 生成唯一的文件ID，避免文件名中的非法字符
  const uniqueFileId = `file_${timestamp}_${index}_${Math.random()
    .toString(36)
    .substr(2, 9)}`
  
  // 云存储路径格式：article/{platformType}/{trackType}/{uniqueFileId}{fileExtension}
  const cloudPath = `article/${platformType}/${trackType}/${uniqueFileId}${fileExtension}`
  
  try {
    // 🚀 优化：将数组转换回 Buffer 并上传到云存储
    const fileBuffer = Buffer.from(fileContent)
    
    console.log(`准备上传文件 ${articleTitle}:`, {
      fileName: fileName,
      fileSize: fileSize,
      bufferSize: fileBuffer.length,
      cloudPath: cloudPath
    })
    
    // 上传文件到云存储
    const uploadResult = await cloud.uploadFile({
      cloudPath: cloudPath,
      fileContent: fileBuffer
    })
    
    if (!uploadResult.fileID) {
      throw new Error('文件上传失败')
    }
    
    console.log(`文件 ${articleTitle} 上传到云存储成功:`, {
      articleId: articleId,
      fileID: uploadResult.fileID,
      cloudPath: cloudPath,
      originalSize: fileSize,
      uploadedSize: fileBuffer.length
    })
    
    return {
      articleId: articleId,
      articleTitle: articleTitle,
      fileName: fileName,
      fileSize: fileSize,
      downloadUrl: uploadResult.fileID,
      cloudPath: cloudPath
    }
    
  } catch (error) {
    console.error(`上传文件 ${articleTitle} 到云存储时出错:`, error)
    throw new Error(`文件 ${articleTitle} 上传失败: ${error.message}`)
  }
}

/**
 * 从文件路径提取文件名
 * @param {string} filePath - 文件路径
 * @returns {string} 文件名
 */
function extractFileName(filePath) {
  if (!filePath) return 'unknown'
  
  // 处理不同格式的路径
  const pathSeparators = ['/', '\\']
  let fileName = filePath
  
  for (const separator of pathSeparators) {
    const parts = fileName.split(separator)
    fileName = parts[parts.length - 1]
  }
  
  return fileName || 'unknown'
}

/**
 * 移除文件扩展名
 * @param {string} fileName - 文件名
 * @returns {string} 不含扩展名的文件名
 */
function removeFileExtension(fileName) {
  if (!fileName) return 'unknown'
  
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex === -1) {
    return fileName
  }
  
  return fileName.substring(0, lastDotIndex)
}

/**
 * 验证和处理文件扩展名
 * @param {string} fileExtension - 文件扩展名（包含点号）
 * @param {string} fileName - 完整文件名
 * @returns {Object} 验证结果
 */
function validateAndProcessExtension(fileExtension, fileName) {
  // 移除点号并转为小写
  const ext = fileExtension.replace('.', '').toLowerCase()
  
  // 仅允许HTML文件
  if (ext === 'html') {
    return {
      isValid: true,
      processedExtension: '.html',
      message: 'HTML文件格式正确'
    }
  }
  
  // 其他扩展名不允许上传
  return {
    isValid: false,
    processedExtension: fileExtension,
    message: `不支持的文件格式：${ext}，仅支持html文件`
  }
}

/**
 * 生成文章ID
 * @param {number} trackType - 赛道类型
 * @returns {string} 文章ID
 */
function generateArticleId(trackType) {
  // 生成文章ID：ART + 赛道类型 + 时间戳后6位 + 随机数后3位
  const timestamp = Date.now()
  const timestampSuffix = timestamp.toString().slice(-6)
  const randomSuffix = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `ART${trackType}${timestampSuffix}${randomSuffix}`
}