// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

const db = cloud.database();

// 批量操作常量配置
const BATCH_SIZE = 20; // 微信云数据库 in 查询限制为20个

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    console.log("开始执行管理员移除任务操作");

    // 获取参数
    const { tasks } = event;

    // 参数验证
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return {
        success: false,
        error: "参数错误：tasks 必须是非空数组",
        code: "INVALID_PARAMS",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证每个任务对象的必填字段
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!task.userId || !task.accountId || !task.articleId) {
        return {
          success: false,
          error: `参数错误：第 ${i + 1} 个任务缺少必填字段 (userId, accountId, articleId)`,
          code: "INVALID_TASK_PARAMS",
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        };
      }
    }

    console.log(`准备处理 ${tasks.length} 个任务移除请求`);

    // 执行移除任务操作
    const result = await removeTasksAndUpdateArticles(tasks);

    console.log("管理员移除任务操作完成:", result);

    return {
      success: true,
      message: "移除任务操作完成",
      data: result,
      timestamp: new Date().toISOString(),
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };

  } catch (error) {
    console.error("管理员移除任务操作失败：", error);
    return {
      success: false,
      error: "移除任务操作失败",
      code: "REMOVE_TASK_ERROR",
      details: error.message,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};

// 移除任务并更新文章状态 - 使用批量操作优化
async function removeTasksAndUpdateArticles(tasks) {
  const _ = db.command;
  
  // 提取所有唯一的用户ID和文章ID
  const userIds = [...new Set(tasks.map(task => task.userId))];
  const articleIds = [...new Set(tasks.map(task => task.articleId))];
  
  // 按用户和账号分组任务
  const userAccountTasksMap = new Map();
  tasks.forEach(task => {
    const key = `${task.userId}_${task.accountId}`;
    if (!userAccountTasksMap.has(key)) {
      userAccountTasksMap.set(key, {
        userId: task.userId,
        accountId: task.accountId,
        articleIds: []
      });
    }
    userAccountTasksMap.get(key).articleIds.push(task.articleId);
  });

  console.log(`需要处理 ${userIds.length} 个用户，${articleIds.length} 篇文章，${userAccountTasksMap.size} 个用户账号组合`);

  const results = {
    processedUsers: 0,
    processedAccounts: 0,
    clearedTasks: 0,
    addedRejectPosts: 0,
    updatedArticles: 0,
    successfulOperations: 0,
    failedOperations: 0,
    errors: []
  };

  try {
    // 1. 先批量更新文章状态
    console.log("开始批量更新文章状态...");
    await batchUpdateArticlesStatus(articleIds, results);
    
    // 2. 批量查询所有相关用户数据
    console.log("开始批量查询用户数据...");
    const allUsers = await batchQueryUsers(userIds);
    
    // 3. 批量处理用户账号数据（从每日任务中获取文章信息）
    console.log("开始批量处理用户账号数据...");
    await batchUpdateUserAccounts(allUsers, userAccountTasksMap, results);
    
  } catch (error) {
    console.error("批量操作失败:", error);
    results.errors.push({
      error: error.message,
      type: 'batch_operation'
    });
    results.failedOperations++;
  }

  return results;
}

// 批量查询用户数据
async function batchQueryUsers(userIds) {
  const _ = db.command;
  const allUsers = [];
  
  // 分批查询用户数据
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batchUserIds = userIds.slice(i, i + BATCH_SIZE);
    
    try {
      const batchResult = await db.collection('user-info')
        .where({
          userId: _.in(batchUserIds)
        })
        .field({ userId: true, accounts: true })
        .get();
      
      allUsers.push(...batchResult.data);
      console.log(`批量查询用户数据：批次 ${Math.floor(i / BATCH_SIZE) + 1}，查询到 ${batchResult.data.length} 个用户`);
      
    } catch (error) {
      console.error(`批量查询用户数据失败 (批次 ${Math.floor(i / BATCH_SIZE) + 1}):`, error);
      throw error;
    }
  }
  
  console.log(`批量查询完成，共查询到 ${allUsers.length} 个用户`);
  return allUsers;
}

// 批量更新用户账号数据
async function batchUpdateUserAccounts(allUsers, userAccountTasksMap, results) {

  // 准备批量更新操作
  const batchOperations = [];
  
  allUsers.forEach(user => {
    if (!user.accounts || !Array.isArray(user.accounts)) {
      return;
    }
    
    let hasUpdates = false;
    let totalClearedTasks = 0;
    let totalAddedRejectPosts = 0;
    let processedAccountsCount = 0;
    
    const updatedAccounts = user.accounts.map(account => {
      const key = `${user.userId}_${account.accountId}`;
      
      if (userAccountTasksMap.has(key)) {
        const taskInfo = userAccountTasksMap.get(key);
        
        // 初始化 rejectPosts 数组（如果不存在）
        if (!account.rejectPosts) {
          account.rejectPosts = [];
        }
        
        // 从每日任务中获取文章信息并添加到 rejectPosts 数组
        if (account.dailyTasks && Array.isArray(account.dailyTasks)) {
          taskInfo.articleIds.forEach(articleId => {
            // 从每日任务中查找对应的文章信息
            const taskData = account.dailyTasks.find(task => task.articleId === articleId);
            if (taskData) {
              // 检查是否已存在，避免重复添加
              const existingIndex = account.rejectPosts.findIndex(post => post.articleId === articleId);
              if (existingIndex === -1) {
                account.rejectPosts.push({
                  articleId: taskData.articleId,
                  title: taskData.articleTitle,
                  trackType: taskData.trackType,
                  rejectTime: db.serverDate()
                });
                totalAddedRejectPosts++;
              }
            }
          });
        }
        
        // 清空该账号的每日任务数组
        const originalTasksCount = account.dailyTasks ? account.dailyTasks.length : 0;
        account.dailyTasks = [];
        
        totalClearedTasks += originalTasksCount;
        processedAccountsCount++;
        hasUpdates = true;
        
        console.log(`准备处理账号 ${account.accountId}：添加 ${taskInfo.articleIds.length} 个拒绝文章，清空 ${originalTasksCount} 个每日任务`);
      }
      return account;
    });
    
    // 如果有更新，添加到批量操作中
    if (hasUpdates) {
      batchOperations.push({
        userId: user.userId,
        updatedAccounts: updatedAccounts,
        clearedTasks: totalClearedTasks,
        addedRejectPosts: totalAddedRejectPosts,
        processedAccounts: processedAccountsCount
      });
    }
  });
  
  console.log(`准备执行 ${batchOperations.length} 个用户账号更新操作`);
  
  // 使用 Promise.allSettled 执行批量更新操作，提供更好的错误处理
  const updatePromises = batchOperations.map(async (operation) => {
    try {
      await db.collection('user-info')
        .where({ userId: operation.userId })
        .update({
          data: {
            accounts: operation.updatedAccounts,
            lastUpdateTimestamp: db.serverDate()
          }
        });
      
      console.log(`用户 ${operation.userId} 更新成功：添加 ${operation.addedRejectPosts} 个拒绝文章，清空 ${operation.clearedTasks} 个任务`);
      
      return {
        status: 'fulfilled',
        userId: operation.userId,
        clearedTasks: operation.clearedTasks,
        addedRejectPosts: operation.addedRejectPosts,
        processedAccounts: operation.processedAccounts
      };
      
    } catch (error) {
      console.error(`更新用户 ${operation.userId} 失败:`, error);
      return {
        status: 'rejected',
        userId: operation.userId,
        error: error.message,
        type: 'user_update'
      };
    }
  });
  
  // 使用 Promise.allSettled 确保部分失败不影响其他操作
  const updateResults = await Promise.allSettled(updatePromises);
  
  // 统计结果
  updateResults.forEach(result => {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value.status === 'fulfilled') {
        results.processedUsers++;
        results.processedAccounts += value.processedAccounts;
        results.clearedTasks += value.clearedTasks;
        results.addedRejectPosts += value.addedRejectPosts;
        results.successfulOperations++;
      } else {
        results.errors.push(value);
        results.failedOperations++;
      }
    } else {
      results.errors.push({
        error: result.reason,
        type: 'promise_rejected'
      });
      results.failedOperations++;
    }
  });
  
  console.log(`批量用户账号更新完成：成功 ${results.successfulOperations} 个，失败 ${results.failedOperations} 个`);
}

// 批量更新文章状态
async function batchUpdateArticlesStatus(articleIds, results) {
  const _ = db.command;
  
  if (articleIds.length === 0) {
    return;
  }

  console.log(`开始批量更新 ${articleIds.length} 篇文章状态`);

  let processedCount = 0;
  const updatePromises = [];

  for (let i = 0; i < articleIds.length; i += BATCH_SIZE) {
    const batchArticleIds = articleIds.slice(i, i + BATCH_SIZE);
    
    // 创建批量更新Promise
    const updatePromise = db.collection('article-mgr')
      .where({
        articleId: _.in(batchArticleIds)
      })
      .update({
        data: {
          status: 3 // 待重新修改
        }
      })
      .then(updateResult => {
        const updated = updateResult.stats.updated;
        processedCount += updated;
        console.log(`文章批次更新完成，本批次更新 ${updated} 篇文章`);
        return { status: 'fulfilled', updated };
      })
      .catch(error => {
        console.error(`批量更新文章状态失败 (批次 ${Math.floor(i / BATCH_SIZE) + 1}):`, error);
        return {
          status: 'rejected',
          batchStart: i,
          batchEnd: Math.min(i + BATCH_SIZE, articleIds.length),
          error: error.message,
          type: 'article_batch_update'
        };
      });
    
    updatePromises.push(updatePromise);
  }
  
  // 使用 Promise.allSettled 并发执行所有文章更新操作
  const articleResults = await Promise.allSettled(updatePromises);
  
  // 统计文章更新结果
  let successfulArticleUpdates = 0;
  articleResults.forEach(result => {
    if (result.status === 'fulfilled') {
      const value = result.value;
      if (value.status === 'fulfilled') {
        successfulArticleUpdates += value.updated;
        results.successfulOperations++;
      } else {
        results.errors.push(value);
        results.failedOperations++;
      }
    } else {
      results.errors.push({
        error: result.reason,
        type: 'article_promise_rejected'
      });
      results.failedOperations++;
    }
  });
  
  results.updatedArticles = successfulArticleUpdates;
  console.log(`文章状态批量更新完成，共更新 ${successfulArticleUpdates} 篇文章`);
}