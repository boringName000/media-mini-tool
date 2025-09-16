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
    const { operationType, userId, accountId, statusValue } = event
    
    // 验证必填参数
    if (!operationType || ![1, 2, 3].includes(operationType)) {
      return {
        success: false,
        message: '参数错误：operationType 必须是 1、2 或 3',
        code: 400
      }
    }

    if (!userId) {
      return {
        success: false,
        message: '参数错误：userId 不能为空',
        code: 400
      }
    }

    if (statusValue === undefined || statusValue === null) {
      return {
        success: false,
        message: '参数错误：statusValue 不能为空',
        code: 400
      }
    }

    // 操作类型2和3需要accountId
    if ((operationType === 2 || operationType === 3) && !accountId) {
      return {
        success: false,
        message: '参数错误：操作类型2和3需要提供accountId',
        code: 400
      }
    }

    let result = {}
    
    switch (operationType) {
      case 1:
        // 更新用户状态
        result = await updateUserStatus(userId, statusValue)
        break
      case 2:
        // 更新账号状态
        result = await updateAccountStatus(userId, accountId, statusValue)
        break
      case 3:
        // 更新账号审核状态
        result = await updateAccountAuditStatus(userId, accountId, statusValue)
        break
    }

    return {
      success: true,
      message: '操作成功',
      data: result,
      operationType: operationType,
      userId: userId,
      accountId: accountId || null,
      statusValue: statusValue,
      timestamp: db.serverDate(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID
    }

  } catch (error) {
    console.error('admin-user-permissions-mgr 错误:', error)
    return {
      success: false,
      message: '服务器内部错误',
      error: error.message,
      code: 500
    }
  }
}

/**
 * 更新用户状态
 * @param {string} userId - 用户ID
 * @param {number} statusValue - 状态值：1-正常，0-禁用
 */
async function updateUserStatus(userId, statusValue) {
  try {
    // 验证状态值
    if (![0, 1].includes(statusValue)) {
      throw new Error('用户状态值只能是 0（禁用）或 1（正常）')
    }

    // 查询用户是否存在
    const userQuery = await db.collection('user-info')
      .where({
        userId: userId
      })
      .get()

    if (userQuery.data.length === 0) {
      throw new Error('用户不存在')
    }

    const userData = userQuery.data[0]

    // 更新用户状态
    const updateResult = await db.collection('user-info')
      .where({
        userId: userId
      })
      .update({
        data: {
          status: statusValue,
          lastUpdateTimestamp: db.serverDate()
        }
      })

    return {
      operationType: 'updateUserStatus',
      userId: userId,
      oldStatus: userData.status,
      newStatus: statusValue,
      updateCount: updateResult.stats.updated,
      userInfo: {
        userId: userData.userId,
        nickname: userData.nickname,
        phone: userData.phone,
        userLevel: userData.userLevel,
        userType: userData.userType,
        registerTimestamp: userData.registerTimestamp,
        totalAccounts: userData.accounts ? userData.accounts.length : 0
      }
    }

  } catch (error) {
    console.error('更新用户状态错误:', error)
    throw error
  }
}

/**
 * 更新账号状态
 * @param {string} userId - 用户ID
 * @param {string} accountId - 账号ID
 * @param {number} statusValue - 状态值：1-正常，0-禁用
 */
async function updateAccountStatus(userId, accountId, statusValue) {
  try {
    // 验证状态值
    if (![0, 1].includes(statusValue)) {
      throw new Error('账号状态值只能是 0（禁用）或 1（正常）')
    }

    // 使用聚合管道查询用户和指定账号
    const userQuery = await db.collection('user-info')
      .aggregate()
      .match({
        userId: userId,
        'accounts.accountId': accountId
      })
      .project({
        _id: 1,
        userId: 1,
        nickname: 1,
        phone: 1,
        userLevel: 1,
        userType: 1,
        registerTimestamp: 1,
        accounts: {
          $filter: {
            input: '$accounts',
            cond: { $eq: ['$$this.accountId', accountId] }
          }
        }
      })
      .end()

    if (userQuery.list.length === 0 || userQuery.list[0].accounts.length === 0) {
      throw new Error('用户或账号不存在')
    }

    const userData = userQuery.list[0]
    const accountData = userData.accounts[0]

    // 更新账号状态
    const updateResult = await db.collection('user-info')
      .where({
        userId: userId,
        'accounts.accountId': accountId
      })
      .update({
        data: {
          'accounts.$.status': statusValue,
          lastUpdateTimestamp: db.serverDate()
        }
      })

    return {
      operationType: 'updateAccountStatus',
      userId: userId,
      accountId: accountId,
      oldStatus: accountData.status,
      newStatus: statusValue,
      updateCount: updateResult.stats.updated,
      userInfo: {
        userId: userData.userId,
        nickname: userData.nickname,
        phone: userData.phone,
        userLevel: userData.userLevel,
        userType: userData.userType,
        registerTimestamp: userData.registerTimestamp
      },
      accountInfo: {
        accountId: accountData.accountId,
        trackType: accountData.trackType,
        platform: accountData.platform,
        accountNickname: accountData.accountNickname,
        phoneNumber: accountData.phoneNumber,
        auditStatus: accountData.auditStatus,
        createTimestamp: accountData.createTimestamp
      }
    }

  } catch (error) {
    console.error('更新账号状态错误:', error)
    throw error
  }
}

/**
 * 更新账号审核状态
 * @param {string} userId - 用户ID
 * @param {string} accountId - 账号ID
 * @param {number} statusValue - 审核状态值：0-待审核，1-已通过，2-未通过
 */
async function updateAccountAuditStatus(userId, accountId, statusValue) {
  try {
    // 验证审核状态值
    if (![0, 1, 2].includes(statusValue)) {
      throw new Error('账号审核状态值只能是 0（待审核）、1（已通过）或 2（未通过）')
    }

    // 使用聚合管道查询用户和指定账号
    const userQuery = await db.collection('user-info')
      .aggregate()
      .match({
        userId: userId,
        'accounts.accountId': accountId
      })
      .project({
        _id: 1,
        userId: 1,
        nickname: 1,
        phone: 1,
        userLevel: 1,
        userType: 1,
        registerTimestamp: 1,
        accounts: {
          $filter: {
            input: '$accounts',
            cond: { $eq: ['$$this.accountId', accountId] }
          }
        }
      })
      .end()

    if (userQuery.list.length === 0 || userQuery.list[0].accounts.length === 0) {
      throw new Error('用户或账号不存在')
    }

    const userData = userQuery.list[0]
    const accountData = userData.accounts[0]

    // 准备更新数据
    const updateData = {
      'accounts.$.auditStatus': statusValue,
      lastUpdateTimestamp: db.serverDate()
    }

    // 如果审核状态是未通过(2)，同时更新账号状态为禁用(0)
    if (statusValue === 2) {
      updateData['accounts.$.status'] = 0
    }

    // 更新账号审核状态
    const updateResult = await db.collection('user-info')
      .where({
        userId: userId,
        'accounts.accountId': accountId
      })
      .update({
        data: updateData
      })

    return {
      operationType: 'updateAccountAuditStatus',
      userId: userId,
      accountId: accountId,
      oldAuditStatus: accountData.auditStatus,
      newAuditStatus: statusValue,
      oldAccountStatus: accountData.status,
      newAccountStatus: statusValue === 2 ? 0 : accountData.status, // 未通过时禁用账号
      updateCount: updateResult.stats.updated,
      autoDisabled: statusValue === 2, // 是否自动禁用了账号
      userInfo: {
        userId: userData.userId,
        nickname: userData.nickname,
        phone: userData.phone,
        userLevel: userData.userLevel,
        userType: userData.userType,
        registerTimestamp: userData.registerTimestamp
      },
      accountInfo: {
        accountId: accountData.accountId,
        trackType: accountData.trackType,
        platform: accountData.platform,
        accountNickname: accountData.accountNickname,
        phoneNumber: accountData.phoneNumber,
        status: accountData.status,
        createTimestamp: accountData.createTimestamp
      }
    }

  } catch (error) {
    console.error('更新账号审核状态错误:', error)
    throw error
  }
}