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
    // 获取请求参数
    const { userId, accountId } = event
    
    // 参数验证
    if (!userId || !accountId) {
      return {
        success: false,
        message: '用户ID和账号ID不能为空',
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID
      }
    }

    // 查询用户信息
    const userQuery = await db.collection('user-info').where({
      userId: userId
    }).get()

    if (userQuery.data.length === 0) {
      return {
        success: false,
        message: '用户不存在',
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID
      }
    }

    const userInfo = userQuery.data[0]
    
    // 检查用户是否有accounts数组
    if (!userInfo.accounts || !Array.isArray(userInfo.accounts)) {
      return {
        success: false,
        message: '用户没有账号数据',
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID
      }
    }

    // 查找要删除的账号
    const accountIndex = userInfo.accounts.findIndex(account => account.accountId === accountId)
    
    if (accountIndex === -1) {
      return {
        success: false,
        message: '指定的账号不存在',
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID
      }
    }

    // 获取要删除的账号信息（用于返回）
    const deletedAccount = userInfo.accounts[accountIndex]
    
    // 获取该账号的所有文章ID
    const articleIds = deletedAccount.posts ? deletedAccount.posts.map(post => post.articleId) : []
    
    // 从数组中删除指定账号
    userInfo.accounts.splice(accountIndex, 1)

    // 更新用户信息数据库
    const updateResult = await db.collection('user-info').doc(userInfo._id).update({
      data: {
        accounts: userInfo.accounts,
        lastUpdateTimestamp: db.serverDate()
      }
    })

    if (updateResult.stats.updated === 0) {
      return {
        success: false,
        message: '删除账号失败，数据库更新失败',
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID
      }
    }

    // 如果该账号有文章，批量更新文章状态为待重新修改
    let articleUpdateResult = null
    if (articleIds.length > 0) {
      try {
        // 使用 db.command.in() 进行批量更新，一次操作更新所有相关文章
        articleUpdateResult = await db.collection('article-mgr').where({
          articleId: db.command.in(articleIds)
        }).update({
          data: {
            status: 3, // 3-待重新修改
            lastUpdateTimestamp: db.serverDate()
          }
        })
        
        console.log(`批量更新文章状态成功，共更新 ${articleUpdateResult.stats.updated} 篇文章`)
      } catch (articleError) {
        console.error('批量更新文章状态失败:', articleError)
        // 即使文章状态更新失败，账号删除仍然成功，只记录错误
      }
    }

    // 返回成功结果
    return {
      success: true,
      message: '账号删除成功',
      data: {
        userId: userId,
        deletedAccount: {
          accountId: deletedAccount.accountId,
          accountNickname: deletedAccount.accountNickname,
          platform: deletedAccount.platform,
          trackType: deletedAccount.trackType,
          phoneNumber: deletedAccount.phoneNumber,
          originalAccountId: deletedAccount.originalAccountId
        },
        remainingAccountsCount: userInfo.accounts.length,
        articleUpdates: {
          totalArticles: articleIds.length,
          updatedCount: articleUpdateResult ? articleUpdateResult.stats.updated : 0,
          articleIds: articleIds
        }
      },
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID
    }

  } catch (error) {
    console.error('删除账号失败:', error)
    return {
      success: false,
      message: '删除账号失败: ' + error.message,
      error: error.toString(),
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID
    }
  }
}