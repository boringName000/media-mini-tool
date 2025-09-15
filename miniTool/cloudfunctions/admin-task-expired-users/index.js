// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    console.log("开始查询过期任务用户数据");

    // 获取参数
    const { includeUserInfo = false } = event;

    // 获取当前日期（只保留年月日，用于判断是否为当日任务）
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    console.log("当日时间范围:", {
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString()
    });

    const userCollection = db.collection('user-info');
    
    // 使用统一的数据库条件查询策略
    console.log("使用数据库条件查询策略");
    const result = await getExpiredTaskUsers(
      userCollection, 
      todayStart, 
      todayEnd, 
      includeUserInfo
    );

    console.log("过期任务用户查询完成:", {
      totalExpiredUsers: result.totalCount,
      usersCount: result.users.length
    });

    return {
      success: true,
      message: "查询过期任务用户成功",
      data: {
        users: result.users,
        totalCount: result.totalCount,
        queryInfo: {
          todayStart: todayStart.toISOString(),
          todayEnd: todayEnd.toISOString(),
          includeUserInfo: includeUserInfo,
          strategy: 'database_query'
        }
      },
      timestamp: new Date().toISOString(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };

  } catch (error) {
    console.error("查询过期任务用户失败：", error);
    return {
      success: false,
      error: "查询过期任务用户失败",
      code: "EXPIRED_TASK_QUERY_ERROR",
      details: error.message,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};

// 使用基于过期任务用户的分页查询策略
async function getExpiredTaskUsers(
  userCollection, 
  todayStart, 
  todayEnd, 
  includeUserInfo
) {
  console.log("使用基于过期任务用户的分页查询策略");
  
  const _ = db.command;
  const queryFields = includeUserInfo 
    ? { accounts: true, userId: true, nickname: true, phone: true }
    : { accounts: true, userId: true };
  
  // 分批查询所有有账号的用户，筛选出有过期任务的用户
  const BATCH_SIZE = 100; // 减小批次大小以减少内存压力
  let allUsersWithExpiredTasks = [];
  let skip = 0;
  let hasMore = true;
  let processedCount = 0;
  
  console.log("开始分批查询用户数据");
  
  while (hasMore) {
    const batchResult = await userCollection
      .where({
        accounts: _.exists(true),
        accounts: _.neq([])
      })
      .field(queryFields)
      .skip(skip)
      .limit(BATCH_SIZE)
      .get();
    
    if (batchResult.data.length === 0) {
      hasMore = false;
      break;
    }
    
    processedCount += batchResult.data.length;
    console.log(`已处理 ${processedCount} 个用户`);
    
    // 处理当前批次的数据，筛选有过期任务的用户
    const batchUsersWithExpiredTasks = processBatchForExpiredTasks(
      batchResult.data, 
      todayStart, 
      todayEnd, 
      includeUserInfo
    );
    
    if (batchUsersWithExpiredTasks.length > 0) {
      allUsersWithExpiredTasks = allUsersWithExpiredTasks.concat(batchUsersWithExpiredTasks);
    }
    
    skip += BATCH_SIZE;
    
    // 如果返回的数据少于批次大小，说明已经是最后一批
    if (batchResult.data.length < BATCH_SIZE) {
      hasMore = false;
    }
  }
  
  // 按过期任务数量降序排序
  allUsersWithExpiredTasks.sort((a, b) => b.totalExpiredTasksCount - a.totalExpiredTasksCount);
  
  return {
    users: allUsersWithExpiredTasks,
    totalCount: allUsersWithExpiredTasks.length
  };
}

// 处理批次数据，筛选有过期任务的用户
function processBatchForExpiredTasks(users, todayStart, todayEnd, includeUserInfo) {
  const usersWithExpiredTasks = [];
  
  users.forEach(user => {
    if (!user.accounts || !Array.isArray(user.accounts)) {
      return;
    }
    
    const accountsWithExpiredTasks = [];
    
    user.accounts.forEach(account => {
      if (!account.dailyTasks || !Array.isArray(account.dailyTasks) || account.dailyTasks.length === 0) {
        return;
      }
      
      const expiredTasks = [];
      
      account.dailyTasks.forEach(task => {
        if (!task.taskTime) {
          return;
        }
        
        // 过期任务判断条件：已领取 + 未完成 + 不是当日日期
        if (task.isClaimed !== true || task.isCompleted === true) {
          return; // 不符合过期任务条件
        }
        
        // 处理不同的时间格式
        let taskTime;
        if (task.taskTime._seconds) {
          // db.serverDate() 格式
          taskTime = new Date(task.taskTime._seconds * 1000);
        } else if (task.taskTime.toDate) {
          // Firestore Timestamp 格式
          taskTime = task.taskTime.toDate();
        } else {
          // 普通 Date 格式或字符串
          taskTime = new Date(task.taskTime);
        }
        
        // 判断任务时间是否不是当日（过期条件）
        if (taskTime < todayStart || taskTime > todayEnd) {
          expiredTasks.push({
            articleId: task.articleId,
            articleTitle: task.articleTitle,
            trackType: task.trackType,
            platformType: task.platformType,
            taskTime: task.taskTime,
            isCompleted: task.isCompleted,
            isClaimed: task.isClaimed,
            isExpired: true,
            expiredDays: Math.floor((todayStart.getTime() - taskTime.getTime()) / (24 * 60 * 60 * 1000))
          });
        }
      });
      
      // 如果该账号有过期任务，添加到结果中
      if (expiredTasks.length > 0) {
        accountsWithExpiredTasks.push({
          accountId: account.accountId,
          accountNickname: account.accountNickname,
          platform: account.platform,
          trackType: account.trackType,
          phoneNumber: account.phoneNumber,
          status: account.status,
          auditStatus: account.auditStatus,
          expiredTasks: expiredTasks,
          expiredTasksCount: expiredTasks.length,
          totalTasksCount: account.dailyTasks.length
        });
      }
    });
    
    // 如果该用户有账号存在过期任务，添加到结果中
    if (accountsWithExpiredTasks.length > 0) {
      const userResult = {
        userId: user.userId,
        accounts: accountsWithExpiredTasks,
        totalExpiredTasksCount: accountsWithExpiredTasks.reduce((sum, acc) => sum + acc.expiredTasksCount, 0),
        accountsWithExpiredTasksCount: accountsWithExpiredTasks.length,
        totalAccountsCount: user.accounts.length
      };
      
      // 如果需要包含用户信息
      if (includeUserInfo) {
        userResult.nickname = user.nickname;
        userResult.phone = user.phone;
      }
      
      usersWithExpiredTasks.push(userResult);
    }
  });
  
  return usersWithExpiredTasks;
}