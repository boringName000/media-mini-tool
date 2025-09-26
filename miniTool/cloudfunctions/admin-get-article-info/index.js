// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { articleId, articleTitle } = event
    
    // 参数验证
    if (!articleId && !articleTitle) {
      return {
        success: false,
        message: '请提供文章ID或文章标题参数',
        data: null
      }
    }
    
    let query = {}
    let queryType = ''
    
    // 根据参数类型构建查询条件
    if (articleId) {
      // 精确查询文章ID
      query.articleId = articleId
      queryType = 'articleId'
    } else if (articleTitle) {
      // 模糊查询文章标题
      query.articleTitle = db.RegExp({
        regexp: articleTitle,
        options: 'i' // 不区分大小写
      })
      queryType = 'articleTitle'
    }
    
    console.log('查询条件:', query)
    console.log('查询类型:', queryType)
    
    // 执行数据库查询
    const result = await db.collection('article-mgr')
      .where(query)
      .orderBy('uploadTime', 'desc') // 按上传时间倒序排列
      .get()
    
    console.log('查询结果:', result)
    
    if (result.data && result.data.length > 0) {
      return {
        success: true,
        message: `成功查询到 ${result.data.length} 条文章信息`,
        data: {
          queryType: queryType,
          queryValue: articleId || articleTitle,
          count: result.data.length,
          articles: result.data
        }
      }
    } else {
      return {
        success: true,
        message: '未找到匹配的文章信息',
        data: {
          queryType: queryType,
          queryValue: articleId || articleTitle,
          count: 0,
          articles: []
        }
      }
    }
    
  } catch (error) {
    console.error('查询文章信息失败:', error)
    return {
      success: false,
      message: '查询文章信息失败: ' + error.message,
      data: null
    }
  }
}

