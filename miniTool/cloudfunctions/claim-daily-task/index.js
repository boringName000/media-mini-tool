// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 文章状态枚举
const ArticleStatusEnum = {
  UNUSED: 1, // 未使用
  USED: 2, // 已经使用
  NEED_REVISION: 3, // 待重新修改
};

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    const { userId, accountId, articleId } = event;

    // 参数验证
    if (!userId) {
      return {
        success: false,
        message: "用户ID不能为空",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    if (!accountId) {
      return {
        success: false,
        message: "账号ID不能为空",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    if (!articleId) {
      return {
        success: false,
        message: "文章ID不能为空",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 查询用户信息
    const userQueryRes = await db
      .collection("user-info")
      .where({ userId: userId })
      .get();

    if (!userQueryRes.data || userQueryRes.data.length === 0) {
      return {
        success: false,
        message: "用户不存在",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    const user = userQueryRes.data[0];

    // 检查用户状态
    if (user.status !== 1) {
      return {
        success: false,
        message: "用户账号已被禁用",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 查找指定账号
    const accounts = user.accounts || [];
    const accountIndex = accounts.findIndex(
      (account) => account.accountId === accountId
    );

    if (accountIndex === -1) {
      return {
        success: false,
        message: "账号不存在",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    const account = accounts[accountIndex];

    // 检查账号状态
    if (account.status !== 1) {
      return {
        success: false,
        message: "账号已被禁用",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 查找指定任务
    const dailyTasks = account.dailyTasks || [];
    const taskIndex = dailyTasks.findIndex(
      (task) => task.articleId === articleId
    );

    if (taskIndex === -1) {
      return {
        success: false,
        message: "文章任务不存在",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    const task = dailyTasks[taskIndex];

    // 更新任务的已领取字段
    dailyTasks[taskIndex] = {
      ...task,
      isClaimed: true,
    };

    // 更新文章状态为已使用
    try {
      await db
        .collection("article-mgr")
        .where({ articleId: articleId })
        .update({
          data: {
            status: ArticleStatusEnum.USED, // 更新为已使用状态
          },
        });

      console.log(`文章 ${articleId} 状态已更新为已使用`);
    } catch (articleError) {
      console.error(`更新文章状态失败:`, articleError);
      // 文章状态更新失败不影响任务领取，继续执行
    }

    // 更新账号的每日任务
    accounts[accountIndex] = {
      ...account,
      dailyTasks: dailyTasks,
    };

    // 更新用户数据
    const updateRes = await db
      .collection("user-info")
      .where({ userId: userId })
      .update({
        data: {
          accounts: accounts,
          lastUpdateTimestamp: db.serverDate(),
        },
      });

    if (updateRes.stats.updated === 0) {
      return {
        success: false,
        message: "更新失败，请重试",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 返回成功结果
    return {
      success: true,
      message: "任务领取成功",
      data: {
        claimedTask: dailyTasks[taskIndex],
        allDailyTasks: dailyTasks,
        accountId: accountId,
        totalTasks: dailyTasks.length,
      },
      event: event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("领取每日任务失败：", error);
    return {
      success: false,
      message: error.message || "领取每日任务失败",
      error: error,
      event: event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};
