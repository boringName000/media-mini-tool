// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    // 获取入参
    const { fileIds } = event
    
    // 参数验证
    if (!fileIds || !Array.isArray(fileIds)) {
      return {
        success: false,
        message: '参数错误：fileIds 必须是数组',
        data: null
      }
    }
    
    if (fileIds.length === 0) {
      return {
        success: true,
        message: '成功',
        data: []
      }
    }
    
    // 批量获取文件下载链接
    const results = []
    
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i]
      
      try {
        // 调用云存储API获取文件下载链接
        const result = await cloud.getTempFileURL({
          fileList: [fileId]
        })
        
        if (result.fileList && result.fileList.length > 0) {
          const fileInfo = result.fileList[0]
          results.push({
            fileId: fileId,
            success: fileInfo.status === 0,
            tempFileURL: fileInfo.status === 0 ? fileInfo.tempFileURL : null,
            message: fileInfo.status === 0 ? '成功' : '获取失败'
          })
        } else {
          results.push({
            fileId: fileId,
            success: false,
            tempFileURL: null,
            message: '文件不存在'
          })
        }
      } catch (error) {
        console.error(`获取文件 ${fileId} 的下载链接失败:`, error)
        results.push({
          fileId: fileId,
          success: false,
          tempFileURL: null,
          message: error.message || '获取失败'
        })
      }
    }
    
    return {
      success: true,
      message: '批量获取完成',
      data: results
    }
    
  } catch (error) {
    console.error('admin-get-file-urls 云函数执行失败:', error)
    return {
      success: false,
      message: error.message || '服务器内部错误',
      data: null
    }
  }
}