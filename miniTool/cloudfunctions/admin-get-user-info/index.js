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
    const { userId, phone, nickname } = event
    
    // 至少需要提供一个查询参数
    if (!userId && !phone && !nickname) {
      return {
        success: false,
        message: '参数错误：至少需要提供 userId、phone 或 nickname 中的一个参数',
        code: 400
      }
    }

    // 构建查询条件
    const queryConditions = buildQueryConditions(userId, phone, nickname)
    
    // 执行查询
    const result = await queryUserInfo(queryConditions)

    return {
      success: true,
      message: '查询成功',
      data: result.users,
      queryParams: {
        userId: userId || null,
        phone: phone || null,
        nickname: nickname || null
      },
      total: result.total,
      queryType: result.queryType,
      timestamp: db.serverDate(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID
    }

  } catch (error) {
    console.error('admin-get-user-info 错误:', error)
    return {
      success: false,
      message: '服务器内部错误',
      error: error.message,
      code: 500
    }
  }
}

/**
 * 构建查询条件
 * @param {string} userId - 用户ID
 * @param {string} phone - 手机号
 * @param {string} nickname - 用户昵称
 * @returns {object} 查询条件对象
 */
function buildQueryConditions(userId, phone, nickname) {
  const conditions = {}
  let queryType = ''

  if (userId) {
    // 精确匹配用户ID
    conditions.userId = userId
    queryType = 'userId'
  } else if (phone) {
    // 精确匹配手机号
    conditions.phone = phone
    queryType = 'phone'
  } else if (nickname) {
    // 模糊匹配昵称（支持部分匹配）
    conditions.nickname = db.RegExp({
      regexp: nickname,
      options: 'i' // 不区分大小写
    })
    queryType = 'nickname'
  }

  return {
    conditions,
    queryType
  }
}

/**
 * 查询用户信息
 * @param {object} queryConditions - 查询条件
 * @returns {object} 查询结果
 */
async function queryUserInfo(queryConditions) {
  try {
    const { conditions, queryType } = queryConditions

    // 使用聚合管道进行高效查询
    const result = await db.collection('user-info')
      .aggregate()
      .match(conditions)
      .project({
        // 用户基础信息
        _id: 1,
        userId: 1,
        nickname: 1,
        phone: 1,
        password: 0, // 不返回密码字段
        status: 1,
        userLevel: 1,
        userType: 1,
        registerTimestamp: 1,
        lastLoginTimestamp: 1,
        lastUpdateTimestamp: 1,
        inviteCode: 1,
        
        // 账号信息（完整返回）
        accounts: 1,
        
        // 计算统计信息
        totalAccounts: { $size: { $ifNull: ['$accounts', []] } },
        
        // 按状态统计账号数量
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
        
        // 按审核状态统计账号数量
        pendingAuditAccounts: {
          $size: {
            $filter: {
              input: { $ifNull: ['$accounts', []] },
              cond: { $eq: ['$$this.auditStatus', 0] }
            }
          }
        },
        approvedAccounts: {
          $size: {
            $filter: {
              input: { $ifNull: ['$accounts', []] },
              cond: { $eq: ['$$this.auditStatus', 1] }
            }
          }
        },
        rejectedAccounts: {
          $size: {
            $filter: {
              input: { $ifNull: ['$accounts', []] },
              cond: { $eq: ['$$this.auditStatus', 2] }
            }
          }
        },
        
        // 计算总发文数
        totalPosts: {
          $sum: {
            $map: {
              input: { $ifNull: ['$accounts', []] },
              as: 'account',
              in: { $size: { $ifNull: ['$$account.posts', []] } }
            }
          }
        },
        
        // 计算总拒绝文章数
        totalRejectPosts: {
          $sum: {
            $map: {
              input: { $ifNull: ['$accounts', []] },
              as: 'account',
              in: { $size: { $ifNull: ['$$account.rejectPosts', []] } }
            }
          }
        }
      })
      .sort({
        registerTimestamp: -1 // 按注册时间倒序
      })
      .end()

    // 处理账号数据，为每个账号添加统计信息
    const processedUsers = result.list.map(user => {
      if (user.accounts && user.accounts.length > 0) {
        user.accounts = user.accounts.map(account => ({
          ...account,
          // 为每个账号添加统计信息
          totalPosts: account.posts ? account.posts.length : 0,
          totalRejectPosts: account.rejectPosts ? account.rejectPosts.length : 0,
          totalDailyTasks: account.dailyTasks ? account.dailyTasks.length : 0,
          totalEarnings: account.earnings ? account.earnings.length : 0,
          
          // 计算完成的任务数
          completedTasks: account.dailyTasks ? 
            account.dailyTasks.filter(task => task.isCompleted).length : 0,
          
          // 计算已领取的任务数
          claimedTasks: account.dailyTasks ? 
            account.dailyTasks.filter(task => task.isClaimed).length : 0,
          
          // 计算最近发文时间
          lastPostTime: account.posts && account.posts.length > 0 ? 
            Math.max(...account.posts.map(post => new Date(post.publishTime).getTime())) : null
        }))
      }
      return user
    })

    return {
      users: processedUsers,
      total: processedUsers.length,
      queryType: queryType
    }

  } catch (error) {
    console.error('查询用户信息错误:', error)
    throw error
  }
}