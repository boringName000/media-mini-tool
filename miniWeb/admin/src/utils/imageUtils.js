// 图片查看工具函数
import { ElMessage } from 'element-plus'
import { adminCloudFunctions } from './cloudbase'

/**
 * 查看图片 - 支持云存储文件ID和普通URL
 * @param {string|string[]} imageUrls - 图片URL或云存储文件ID，支持单个或数组
 * @param {Object} options - 配置选项
 * @param {string} options.emptyMessage - 无图片时的提示信息
 * @param {string} options.errorMessage - 错误时的提示信息
 * @param {boolean} options.openInNewTab - 是否在新标签页打开，默认true
 * @returns {Promise<boolean>} - 是否成功打开图片
 */
export const viewImages = async (imageUrls, options = {}) => {
  const {
    emptyMessage = '暂无图片',
    errorMessage = '获取图片访问链接失败',
    openInNewTab = true
  } = options

  try {
    // 处理输入参数
    if (!imageUrls) {
      ElMessage.warning(emptyMessage)
      return false
    }

    // 统一转换为数组处理
    const urlArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls]
    
    // 过滤空值
    const validUrls = urlArray.filter(url => url && url.trim())
    
    if (validUrls.length === 0) {
      ElMessage.warning(emptyMessage)
      return false
    }

    // 分离云存储文件ID和普通URL
    const cloudFileIds = []
    const directUrls = []
    
    validUrls.forEach(url => {
      if (url.startsWith('cloud://')) {
        cloudFileIds.push(url)
      } else {
        directUrls.push(url)
      }
    })

    // 处理云存储文件ID
    if (cloudFileIds.length > 0) {
      const result = await adminCloudFunctions.getFileUrls(cloudFileIds)
      
      if (result?.result?.success && result.result.data) {
        const urlResults = result.result.data
        
        // 处理每个文件的结果
        let successCount = 0
        urlResults.forEach(urlResult => {
          if (urlResult.success && urlResult.tempFileURL) {
            if (openInNewTab) {
              window.open(urlResult.tempFileURL, '_blank')
            } else {
              window.location.href = urlResult.tempFileURL
            }
            successCount++
          } else {
            console.warn('获取文件URL失败:', urlResult.fileId, urlResult.message)
          }
        })
        
        if (successCount === 0) {
          ElMessage.error(errorMessage)
          return false
        }
      } else {
        ElMessage.error(errorMessage)
        return false
      }
    }

    // 处理普通URL
    directUrls.forEach(url => {
      if (openInNewTab) {
        window.open(url, '_blank')
      } else {
        window.location.href = url
      }
    })

    return true
  } catch (error) {
    console.error('查看图片失败:', error)
    ElMessage.error(errorMessage)
    return false
  }
}

/**
 * 查看单张图片
 * @param {string} imageUrl - 图片URL或云存储文件ID
 * @param {Object} options - 配置选项
 * @returns {Promise<boolean>} - 是否成功打开图片
 */
export const viewImage = async (imageUrl, options = {}) => {
  return viewImages(imageUrl, options)
}



/**
 * 批量获取云存储文件的访问URL（不打开图片）
 * @param {string[]} fileIds - 云存储文件ID数组
 * @returns {Promise<Object[]>} - 返回URL结果数组
 */
export const getCloudFileUrls = async (fileIds) => {
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return []
  }

  try {
    const result = await adminCloudFunctions.getFileUrls(fileIds)
    
    if (result?.result?.success && result.result.data) {
      return result.result.data
    } else {
      console.error('获取云存储文件URL失败:', result)
      return []
    }
  } catch (error) {
    console.error('获取云存储文件URL异常:', error)
    return []
  }
}

/**
 * 检查URL是否为云存储文件ID
 * @param {string} url - 要检查的URL
 * @returns {boolean} - 是否为云存储文件ID
 */
export const isCloudFileId = (url) => {
  return typeof url === 'string' && url.startsWith('cloud://')
}
