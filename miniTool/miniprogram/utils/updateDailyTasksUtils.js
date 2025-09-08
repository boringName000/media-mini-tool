// 更新每日任务工具函数

/**
 * 检查是否需要更新每日任务
 * @param {Array} accounts - 用户账号列表
 * @returns {boolean} 是否需要更新每日任务
 */
function needUpdateDailyTasks(accounts) {
  if (!accounts || accounts.length === 0) {
    // 没有账号，不需要更新每日任务
    console.log("用户没有账号，跳过每日任务更新");
    return false;
  }

  // 检查每个账号的每日任务状态
  for (const account of accounts) {
    const dailyTasks = account.dailyTasks || [];

    if (dailyTasks.length === 0) {
      // 账号没有每日任务，需要初始化
      console.log(`账号 ${account.accountId} 没有每日任务，需要初始化`);
      return true;
    }

    // 检查是否没有任何一个已领取的任务
    const hasClaimedTasks = dailyTasks.some((task) => task.isClaimed);
    if (!hasClaimedTasks) {
      console.log(
        `账号 ${account.accountId} 没有任何已领取的任务，需要检查更新`
      );
      return true;
    }

    // 检查是否有过期的任务
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    for (const task of dailyTasks) {
      if (!task.taskTime) continue;

      const taskDate = new Date(task.taskTime);
      const taskDay = new Date(
        taskDate.getFullYear(),
        taskDate.getMonth(),
        taskDate.getDate()
      );

      if (taskDay < today) {
        // 发现过期任务，需要更新
        console.log(`账号 ${account.accountId} 有过期任务，需要更新`);
        return true;
      }
    }
  }

  return false;
}

/**
 * 更新每日任务
 * @param {string} userId - 用户ID（可选）
 * @param {Object} globalUserData - 全局用户数据（可选）
 * @returns {Promise<Object>} 更新结果
 */
async function updateDailyTasks(userId, globalUserData) {
  try {
    // 如果传入了参数，直接使用参数调用云函数
    if (userId && globalUserData) {
      console.log("使用传入参数调用云函数更新每日任务");
      const result = await callCreateDailyTasksCloudFunction(userId);

      if (result.success && result.data && result.data.accounts) {
        // 使用云函数返回的账号数据，更新传入的全局用户数据里面的账号数据
        globalUserData.accounts = result.data.accounts;
        console.log("已更新传入的全局用户数据中的账号数据");
      }

      return result;
    }

    // 如果没有传参数，使用全局用户数据
    const app = getApp();
    if (!app) {
      console.log("无法获取 app 实例，无法更新每日任务");
      return {
        success: false,
        error: "无法获取应用实例",
      };
    }

    const currentUserData = app.globalData.loginResult;
    const targetUserId = currentUserData && currentUserData.userId;

    if (!currentUserData || !currentUserData.accounts || !targetUserId) {
      console.log("没有全局用户数据，无法更新每日任务");
      return {
        success: false,
        error: "缺少用户数据",
      };
    }

    // 前置判断：检查是否需要更新每日任务
    const needUpdate = needUpdateDailyTasks(currentUserData.accounts);

    if (!needUpdate) {
      console.log("每日任务无需更新，跳过云函数调用");
      return {
        success: true,
        message: "每日任务无需更新",
        needUpdate: false,
      };
    }

    // 调用云函数更新每日任务
    const result = await callCreateDailyTasksCloudFunction(targetUserId);

    if (result.success && result.data && result.data.accounts) {
      // 使用返回数据更新全局用户数据里面的账号数据
      if (app && app.globalData && app.globalData.loginResult) {
        app.globalData.loginResult.accounts = result.data.accounts;
        console.log("已更新全局用户数据中的账号数据");
      } else {
        console.log("无法更新全局用户数据，app 实例或数据不存在");
      }
    }

    return result;
  } catch (error) {
    console.error("更新每日任务失败:", error);
    return {
      success: false,
      error: error.message || "更新每日任务失败",
    };
  }
}

/**
 * 调用创建每日任务云函数
 * @param {string} userId - 用户ID
 * @returns {Promise<Object>} 云函数调用结果
 */
async function callCreateDailyTasksCloudFunction(userId) {
  try {
    const result = await wx.cloud.callFunction({
      name: "create-daily-tasks",
      data: {
        userId: userId,
      },
    });

    if (result.result && result.result.success) {
      console.log("每日任务更新成功:", result.result);
      return result.result;
    } else {
      console.error("每日任务更新失败:", result.result?.error);
      return {
        success: false,
        error: result.result?.error || "云函数调用失败",
      };
    }
  } catch (error) {
    console.error("调用 create-daily-tasks 云函数失败:", error);
    return {
      success: false,
      error: error.message || "云函数调用失败",
    };
  }
}

module.exports = {
  needUpdateDailyTasks,
  updateDailyTasks,
  callCreateDailyTasksCloudFunction,
};
