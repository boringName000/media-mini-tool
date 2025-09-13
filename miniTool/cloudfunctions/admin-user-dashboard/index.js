// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    console.log("开始获取用户仪表盘数据");

    // 获取当前时间和7天前的时间
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    console.log("时间范围:", {
      now: now.toISOString(),
      sevenDaysAgo: sevenDaysAgo.toISOString(),
      todayStart: todayStart.toISOString()
    });

    const userCollection = db.collection('user-info');
    
    // 首先获取用户总数来判断数据规模
    const totalUsersCountResult = await userCollection.count();
    const totalUsers = totalUsersCountResult.total;
    
    console.log("用户总数:", totalUsers);
    
    // 根据数据规模选择不同的查询策略
    const USE_AGGREGATION_THRESHOLD = 5000; // 超过5000用户使用聚合查询
    
    let dashboardData;
    
    if (totalUsers > USE_AGGREGATION_THRESHOLD) {
      console.log("数据量较大，使用聚合查询策略");
      dashboardData = await getStatsByAggregation(userCollection, now, sevenDaysAgo, todayStart, totalUsers);
    } else {
      console.log("数据量较小，使用内存计算策略");
      dashboardData = await getStatsByMemoryCalculation(userCollection, now, sevenDaysAgo, todayStart, totalUsers);
    }

    console.log("仪表盘数据统计完成:", {
      totalUsers: dashboardData.totalUsers,
      todayCompletedTasksCount: dashboardData.todayCompletedTasksCount,
      usersWithoutAccounts: dashboardData.usersWithoutAccounts,
      usersWithMultipleAccounts: dashboardData.usersWithMultipleAccounts
    });

    return {
      success: true,
      message: "获取用户仪表盘数据成功",
      data: dashboardData,
      timestamp: now.toISOString(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };

  } catch (error) {
    console.error("获取用户仪表盘数据失败：", error);
    return {
      success: false,
      error: "获取用户仪表盘数据失败",
      code: "DASHBOARD_ERROR",
      details: error.message,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};

// 内存计算策略：适用于小规模数据（< 5000用户）
async function getStatsByMemoryCalculation(userCollection, now, sevenDaysAgo, todayStart, totalUsers) {
  console.log("使用内存计算策略进行统计");
  
  // 获取所有用户数据
  const allUsersResult = await userCollection.get();
  const allUsers = allUsersResult.data;
  
  // 2. 最近7天每日活跃用户数（根据 lastUpdateTimestamp）
  const activeUsersLast7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const activeCount = allUsers.filter(user => {
      if (!user.lastUpdateTimestamp) return false;
      
      // 处理不同的时间格式
      let updateTime;
      if (user.lastUpdateTimestamp._seconds) {
        // db.serverDate() 格式
        updateTime = new Date(user.lastUpdateTimestamp._seconds * 1000);
      } else if (user.lastUpdateTimestamp.toDate) {
        // Firestore Timestamp 格式
        updateTime = user.lastUpdateTimestamp.toDate();
      } else {
        // 普通 Date 格式或字符串
        updateTime = new Date(user.lastUpdateTimestamp);
      }
      
      return updateTime >= dayStart && updateTime <= dayEnd;
    }).length;
    
    activeUsersLast7Days.push({
      date: dayStart.toISOString().split('T')[0],
      count: activeCount
    });
  }

  // 3. 今日完成任务和未完成任务的账号数（根据每个账号的 dailyTasks 中的 isCompleted）
  let todayCompletedTasksCount = 0;
  let todayUncompletedTasksCount = 0;
  
  allUsers.forEach(user => {
    if (user.accounts && Array.isArray(user.accounts)) {
      user.accounts.forEach(account => {
        if (account.dailyTasks && Array.isArray(account.dailyTasks)) {
          // 检查今日任务
          let hasCompletedTask = false;
          let hasUncompletedTask = false;
          
          account.dailyTasks.forEach(task => {
            if (!task.taskTime) return;
            
            // 处理不同的时间格式
            let taskTime;
            if (task.taskTime._seconds) {
              // db.serverDate() 格式：{ _seconds: xxx, _nanoseconds: xxx }
              taskTime = new Date(task.taskTime._seconds * 1000);
            } else if (task.taskTime.toDate) {
              // Firestore Timestamp 格式
              taskTime = task.taskTime.toDate();
            } else {
              // 普通 Date 格式或字符串
              taskTime = new Date(task.taskTime);
            }
            
            // 检查是否是今天的任务
            if (taskTime >= todayStart && taskTime < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)) {
              if (task.isCompleted === true) {
                hasCompletedTask = true;
              } else {
                hasUncompletedTask = true;
              }
            }
          });
          
          if (hasCompletedTask) {
            todayCompletedTasksCount++;
          }
          if (hasUncompletedTask) {
            todayUncompletedTasksCount++;
          }
        }
      });
    }
  });

  // 4. 未绑定公众号账号的用户数（accounts 字段为空或长度为0）
  const usersWithoutAccounts = allUsers.filter(user => {
    return !user.accounts || !Array.isArray(user.accounts) || user.accounts.length === 0;
  }).length;

  // 5. 最近7天每日用户注册数量（根据 registerTimestamp）
  const userRegistrationsLast7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    const registrationCount = allUsers.filter(user => {
      if (!user.registerTimestamp) return false;
      
      // 处理不同的时间格式
      let registerTime;
      if (user.registerTimestamp._seconds) {
        // db.serverDate() 格式
        registerTime = new Date(user.registerTimestamp._seconds * 1000);
      } else if (user.registerTimestamp.toDate) {
        // Firestore Timestamp 格式
        registerTime = user.registerTimestamp.toDate();
      } else {
        // 普通 Date 格式或字符串
        registerTime = new Date(user.registerTimestamp);
      }
      
      return registerTime >= dayStart && registerTime <= dayEnd;
    }).length;
    
    userRegistrationsLast7Days.push({
      date: dayStart.toISOString().split('T')[0],
      count: registrationCount
    });
  }

  // 6. 最近7天每日用户发布文章数量（根据用户账号的 posts 数据）
  const articlePublishLast7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    let articleCount = 0;
    allUsers.forEach(user => {
      if (user.accounts && Array.isArray(user.accounts)) {
        user.accounts.forEach(account => {
          if (account.posts && Array.isArray(account.posts)) {
            const dayPosts = account.posts.filter(post => {
              if (!post.publishTime) return false;
              
              // 处理不同的时间格式
              let publishTime;
              if (post.publishTime._seconds) {
                // db.serverDate() 格式
                publishTime = new Date(post.publishTime._seconds * 1000);
              } else if (post.publishTime.toDate) {
                // Firestore Timestamp 格式
                publishTime = post.publishTime.toDate();
              } else {
                // 普通 Date 格式或字符串
                publishTime = new Date(post.publishTime);
              }
              
              return publishTime >= dayStart && publishTime <= dayEnd;
            });
            articleCount += dayPosts.length;
          }
        });
      }
    });
    
    articlePublishLast7Days.push({
      date: dayStart.toISOString().split('T')[0],
      count: articleCount
    });
  }

  // 7. 绑定多个公众号账号的用户数（accounts 字段长度大于1）
  const usersWithMultipleAccounts = allUsers.filter(user => {
    return user.accounts && Array.isArray(user.accounts) && user.accounts.length > 1;
  }).length;

  // 计算总账号数
  const totalAccounts = allUsers.reduce((sum, user) => {
    return sum + (user.accounts ? user.accounts.length : 0);
  }, 0);

  // 构建返回数据
  return {
    totalUsers,
    totalAccounts,
    activeUsersLast7Days,
    todayCompletedTasksCount,
    todayUncompletedTasksCount,
    usersWithoutAccounts,
    userRegistrationsLast7Days,
    articlePublishLast7Days,
    usersWithMultipleAccounts
  };
}

// 聚合查询策略：适用于大规模数据（>= 5000用户）
async function getStatsByAggregation(userCollection, now, sevenDaysAgo, todayStart, totalUsers) {
  console.log("使用聚合查询策略进行统计");
  
  const _ = db.command;
  
  // 并行执行多个查询以提高性能
  const [
    activeUsersResult,
    registrationResult,
    accountStatsResult,
    articleStatsResult
  ] = await Promise.all([
    // 查询活跃用户统计
    getActiveUsersStats(userCollection, now, _),
    // 查询注册用户统计
    getRegistrationStats(userCollection, now, _),
    // 查询账号相关统计
    getAccountStats(userCollection, _),
    // 查询文章发布统计
    getArticleStats(userCollection, now, todayStart, _)
  ]);

  // 处理活跃用户数据
  const activeUsersLast7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dateStr = dayStart.toISOString().split('T')[0];
    
    const dayData = activeUsersResult.find(item => item._id === dateStr);
    activeUsersLast7Days.push({
      date: dateStr,
      count: dayData ? dayData.count : 0
    });
  }

  // 处理注册用户数据
  const userRegistrationsLast7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dateStr = dayStart.toISOString().split('T')[0];
    
    const dayData = registrationResult.find(item => item._id === dateStr);
    userRegistrationsLast7Days.push({
      date: dateStr,
      count: dayData ? dayData.count : 0
    });
  }

  // 处理文章发布数据
  const articlePublishLast7Days = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dateStr = dayStart.toISOString().split('T')[0];
    
    const dayData = articleStatsResult.dailyArticles.find(item => item._id === dateStr);
    articlePublishLast7Days.push({
      date: dateStr,
      count: dayData ? dayData.count : 0
    });
  }

  return {
    totalUsers,
    totalAccounts: accountStatsResult.totalAccounts,
    activeUsersLast7Days,
    todayCompletedTasksCount: articleStatsResult.todayCompletedTasks,
    todayUncompletedTasksCount: articleStatsResult.todayUncompletedTasks,
    usersWithoutAccounts: accountStatsResult.usersWithoutAccounts,
    userRegistrationsLast7Days,
    articlePublishLast7Days,
    usersWithMultipleAccounts: accountStatsResult.usersWithMultipleAccounts
  };
}

// 获取活跃用户统计 - 修复为微信云开发支持的语法
async function getActiveUsersStats(userCollection, now, _) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // 微信云开发不支持 dateToString，改用简单的查询然后在内存中处理
  const result = await userCollection
    .where({
      lastUpdateTimestamp: _.gte(sevenDaysAgo)
    })
    .get();
  
  // 在内存中按日期分组统计
  const dailyStats = {};
  result.data.forEach(user => {
    if (user.lastUpdateTimestamp) {
      let updateTime;
      if (user.lastUpdateTimestamp._seconds) {
        updateTime = new Date(user.lastUpdateTimestamp._seconds * 1000);
      } else if (user.lastUpdateTimestamp.toDate) {
        updateTime = user.lastUpdateTimestamp.toDate();
      } else {
        updateTime = new Date(user.lastUpdateTimestamp);
      }
      
      const dateStr = updateTime.toISOString().split('T')[0];
      dailyStats[dateStr] = (dailyStats[dateStr] || 0) + 1;
    }
  });
  
  // 转换为数组格式
  return Object.keys(dailyStats).map(date => ({
    _id: date,
    count: dailyStats[date]
  }));
}

// 获取注册用户统计 - 修复为微信云开发支持的语法
async function getRegistrationStats(userCollection, now, _) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // 微信云开发不支持 dateToString，改用简单的查询然后在内存中处理
  const result = await userCollection
    .where({
      registerTimestamp: _.gte(sevenDaysAgo)
    })
    .get();
  
  // 在内存中按日期分组统计
  const dailyStats = {};
  result.data.forEach(user => {
    if (user.registerTimestamp) {
      let registerTime;
      if (user.registerTimestamp._seconds) {
        registerTime = new Date(user.registerTimestamp._seconds * 1000);
      } else if (user.registerTimestamp.toDate) {
        registerTime = user.registerTimestamp.toDate();
      } else {
        registerTime = new Date(user.registerTimestamp);
      }
      
      const dateStr = registerTime.toISOString().split('T')[0];
      dailyStats[dateStr] = (dailyStats[dateStr] || 0) + 1;
    }
  });
  
  // 转换为数组格式
  return Object.keys(dailyStats).map(date => ({
    _id: date,
    count: dailyStats[date]
  }));
}

// 获取账号相关统计 - 使用微信云开发支持的基础聚合查询
async function getAccountStats(userCollection, _) {
  // 并行执行多个简单的查询，避免复杂的聚合操作符
  const [
    usersWithoutAccountsResult,
    usersWithAccountsResult,
    allUsersWithAccountsData
  ] = await Promise.all([
    // 1. 统计没有账号的用户数（accounts字段不存在或为空数组）
    userCollection.where({
      $or: [
        { accounts: _.exists(false) },
        { accounts: _.eq([]) }
      ]
    }).count(),
    
    // 2. 统计有账号的用户数
    userCollection.where({
      accounts: _.exists(true),
      accounts: _.ne([])
    }).count(),
    
    // 3. 获取所有有账号的用户数据，用于计算总账号数和多账号用户数
    userCollection.where({
      accounts: _.exists(true),
      accounts: _.ne([])
    }).field({
      accounts: true
    }).get()
  ]);
  
  // 计算总账号数和多账号用户数
  let totalAccounts = 0;
  let usersWithMultipleAccounts = 0;
  
  allUsersWithAccountsData.data.forEach(user => {
    if (user.accounts && Array.isArray(user.accounts)) {
      totalAccounts += user.accounts.length;
      if (user.accounts.length > 1) {
        usersWithMultipleAccounts++;
      }
    }
  });
  
  return {
    totalAccounts,
    usersWithAccounts: usersWithAccountsResult.total,
    usersWithMultipleAccounts,
    usersWithoutAccounts: usersWithoutAccountsResult.total
  };
}

// 获取文章统计（这个比较复杂，可能需要简化或使用内存计算）
async function getArticleStats(userCollection, now, todayStart, _) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // 由于聚合查询处理嵌套数组比较复杂，这里使用简化的查询
  // 实际项目中可能需要根据具体情况优化
  const usersWithAccountsResult = await userCollection
    .where({
      accounts: _.exists(true)
    })
    .get();
  
  const users = usersWithAccountsResult.data;
  
  // 统计今日完成任务和未完成任务的账号数
  let todayCompletedTasks = 0;
  let todayUncompletedTasks = 0;
  const dailyArticles = {};
  
  users.forEach(user => {
    if (user.accounts && Array.isArray(user.accounts)) {
      user.accounts.forEach(account => {
        // 统计今日任务
        if (account.dailyTasks && Array.isArray(account.dailyTasks)) {
          let hasCompletedTask = false;
          let hasUncompletedTask = false;
          
          account.dailyTasks.forEach(task => {
            if (!task.taskTime) return;
            
            // 处理不同的时间格式
            let taskTime;
            if (task.taskTime._seconds) {
              taskTime = new Date(task.taskTime._seconds * 1000);
            } else if (task.taskTime.toDate) {
              taskTime = task.taskTime.toDate();
            } else {
              taskTime = new Date(task.taskTime);
            }
            
            // 检查是否是今天的任务
            if (taskTime >= todayStart && taskTime < new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)) {
              if (task.isCompleted === true) {
                hasCompletedTask = true;
              } else {
                hasUncompletedTask = true;
              }
            }
          });
          
          if (hasCompletedTask) {
            todayCompletedTasks++;
          }
          if (hasUncompletedTask) {
            todayUncompletedTasks++;
          }
        }
        
        // 统计文章发布
        if (account.posts && Array.isArray(account.posts)) {
          account.posts.forEach(post => {
            if (post.publishTime) {
              // 处理不同的时间格式
              let publishTime;
              if (post.publishTime._seconds) {
                publishTime = new Date(post.publishTime._seconds * 1000);
              } else if (post.publishTime.toDate) {
                publishTime = post.publishTime.toDate();
              } else {
                publishTime = new Date(post.publishTime);
              }
              
              if (publishTime >= sevenDaysAgo) {
                const dateStr = publishTime.toISOString().split('T')[0];
                dailyArticles[dateStr] = (dailyArticles[dateStr] || 0) + 1;
              }
            }
          });
        }
      });
    }
  });
  
  // 转换为数组格式
  const dailyArticlesArray = Object.keys(dailyArticles).map(date => ({
    _id: date,
    count: dailyArticles[date]
  }));
  
  return {
    todayCompletedTasks,
    todayUncompletedTasks,
    dailyArticles: dailyArticlesArray
  };
}