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
    // 参数验证
    const { queryType } = event
    
    if (!queryType || ![1, 2, 3].includes(queryType)) {
      return {
        success: false,
        message: '参数错误：queryType 必须是 1、2 或 3',
        code: 400
      }
    }

    let result = []
    
    switch (queryType) {
      case 1:
        // 查询禁用用户（用户状态为0）
        result = await queryDisabledUsers()
        break
      case 2:
        // 查询禁用账号（账号状态为0）
        result = await queryDisabledAccounts()
        break
      case 3:
        // 查询待审核账号（审核状态为0）
        result = await queryPendingAuditAccounts()
        break
    }

    return {
      success: true,
      message: '查询成功',
      data: result,
      queryType: queryType,
      total: result.length,
      timestamp: new Date(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID
    }

  } catch (error) {
    console.error('admin-user-permissions-query 错误:', error)
    return {
      success: false,
      message: '服务器内部错误',
      error: error.message,
      code: 500
    }
  }
}

/**
 * 查询禁用用户（用户状态为0）
 * 返回用户基础信息和所有账号信息
 */
async function queryDisabledUsers() {
  try {
    const result = await db.collection('user-info')
      .aggregate()
      .match({
        status: 0  // 用户状态为禁用
      })
      .project({
        _id: 1,
        userId: 1,
        nickname: 1,
        phone: 1,
        status: 1,
        userLevel: 1,
        userType: 1,
        registerTimestamp: 1,
        lastLoginTimestamp: 1,
        lastUpdateTimestamp: 1,
        inviteCode: 1,
        accounts: 1,
        // 计算账号统计信息
        totalAccounts: { $size: { $ifNull: ['$accounts', []] } },
        activeAccounts: {
          $size: {
            $filter: {
              input: { $ifNull: ['$accounts', []] },
              cond: { $eq: ['$$this.status', 1] }
            }
          }
        },
        disabledAccounts: {
          $size: {
            $filter: {
              input: { $ifNull: ['$accounts', []] },
              cond: { $eq: ['$$this.status', 0] }
            }
          }
        },
        pendingAuditAccounts: {
          $size: {
            $filter: {
              input: { $ifNull: ['$accounts', []] },
              cond: { $eq: ['$$this.auditStatus', 0] }
            }
          }
        }
      })
      .sort({
        registerTimestamp: -1  // 按注册时间倒序
      })
      .end()

    return result.list || []
  } catch (error) {
    console.error('查询禁用用户错误:', error)
    throw error
  }
}

/**
 * 查询禁用账号（账号状态为0）
 * 使用聚合管道展开账号数组并筛选禁用账号
 */
async function queryDisabledAccounts() {
  try {
    const result = await db.collection('user-info')
      .aggregate()
      .match({
        'accounts.status': 0  // 至少有一个账号状态为禁用
      })
      .unwind('$accounts')  // 展开账号数组
      .match({
        'accounts.status': 0  // 筛选禁用账号
      })
      .project({
        _id: 1,
        userId: 1,
        nickname: 1,
        phone: 1,
        status: 1,
        userLevel: 1,
        userType: 1,
        registerTimestamp: 1,
        lastLoginTimestamp: 1,
        // 账号信息
        accountId: '$accounts.accountId',
        trackType: '$accounts.trackType',
        platform: '$accounts.platform',
        phoneNumber: '$accounts.phoneNumber',
        accountNickname: '$accounts.accountNickname',
        originalAccountId: '$accounts.originalAccountId',
        registerDate: '$accounts.registerDate',
        isViolation: '$accounts.isViolation',
        screenshotUrl: '$accounts.screenshotUrl',
        createTimestamp: '$accounts.createTimestamp',
        accountStatus: '$accounts.status',
        auditStatus: '$accounts.auditStatus',
        lastPostTime: '$accounts.lastPostTime',
        currentAccountEarnings: '$accounts.currentAccountEarnings',
        // 统计信息
        totalPosts: { $size: { $ifNull: ['$accounts.posts', []] } },
        totalRejectPosts: { $size: { $ifNull: ['$accounts.rejectPosts', []] } },
        totalDailyTasks: { $size: { $ifNull: ['$accounts.dailyTasks', []] } }
      })
      .sort({
        createTimestamp: -1  // 按账号创建时间倒序
      })
      .end()

    return result.list || []
  } catch (error) {
    console.error('查询禁用账号错误:', error)
    throw error
  }
}

/**
 * 查询待审核账号（审核状态为0）
 * 使用聚合管道展开账号数组并筛选待审核账号
 */
async function queryPendingAuditAccounts() {
  try {
    const result = await db.collection('user-info')
      .aggregate()
      .match({
        'accounts.auditStatus': 0  // 至少有一个账号审核状态为待审核
      })
      .unwind('$accounts')  // 展开账号数组
      .match({
        'accounts.auditStatus': 0  // 筛选待审核账号
      })
      .project({
        _id: 1,
        userId: 1,
        nickname: 1,
        phone: 1,
        status: 1,
        userLevel: 1,
        userType: 1,
        registerTimestamp: 1,
        lastLoginTimestamp: 1,
        // 账号信息
        accountId: '$accounts.accountId',
        trackType: '$accounts.trackType',
        platform: '$accounts.platform',
        phoneNumber: '$accounts.phoneNumber',
        accountNickname: '$accounts.accountNickname',
        originalAccountId: '$accounts.originalAccountId',
        registerDate: '$accounts.registerDate',
        isViolation: '$accounts.isViolation',
        screenshotUrl: '$accounts.screenshotUrl',
        createTimestamp: '$accounts.createTimestamp',
        accountStatus: '$accounts.status',
        auditStatus: '$accounts.auditStatus',
        lastPostTime: '$accounts.lastPostTime',
        currentAccountEarnings: '$accounts.currentAccountEarnings',
        // 统计信息
        totalPosts: { $size: { $ifNull: ['$accounts.posts', []] } },
        totalRejectPosts: { $size: { $ifNull: ['$accounts.rejectPosts', []] } },
        totalDailyTasks: { $size: { $ifNull: ['$accounts.dailyTasks', []] } },
        // 审核相关时间信息
        daysSinceCreation: {
          $divide: [
            { $subtract: [new Date(), '$accounts.createTimestamp'] },
            1000 * 60 * 60 * 24  // 转换为天数
          ]
        }
      })
      .sort({
        createTimestamp: 1  // 按账号创建时间正序，优先处理较早的申请
      })
      .end()

    return result.list || []
  } catch (error) {
    console.error('查询待审核账号错误:', error)
    throw error
  }
}