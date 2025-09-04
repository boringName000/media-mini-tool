// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    const {
      userId,
      accountId,
      articleId,
      title,
      trackType,
      callbackUrl,
      viewCount,
      dailyEarnings,
    } = event;

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

    if (!title) {
      return {
        success: false,
        message: "文章标题不能为空",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    if (trackType === undefined || trackType === null) {
      return {
        success: false,
        message: "赛道类型不能为空",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    if (!callbackUrl) {
      return {
        success: false,
        message: "回传地址不能为空",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证赛道类型
    if (!Number.isInteger(trackType) || trackType < 0) {
      return {
        success: false,
        message: "赛道类型必须是有效的数字",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证回传地址格式
    try {
      new URL(callbackUrl);
    } catch (error) {
      return {
        success: false,
        message: "回传地址格式不正确",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证浏览量
    if (!Number.isInteger(viewCount) || viewCount < 0) {
      return {
        success: false,
        message: "浏览量必须是有效的非负整数",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证当日收益
    if (typeof dailyEarnings !== "number" || dailyEarnings < 0) {
      return {
        success: false,
        message: "当日收益必须是有效的非负数",
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

    // 构建文章数据
    const postData = {
      articleId: articleId,
      title: title,
      trackType: trackType,
      publishTime: db.serverDate(), // 使用服务器时间
      callbackUrl: callbackUrl,
      viewCount: viewCount, // 浏览量
      dailyEarnings: dailyEarnings, // 当日收益
    };

    // 检查是否已存在相同articleId的文章
    const posts = account.posts || [];
    const existingPostIndex = posts.findIndex(
      (post) => post.articleId === articleId
    );

    let updateResult;
    let operationType;

    if (existingPostIndex !== -1) {
      // 更新现有文章
      posts[existingPostIndex] = {
        ...posts[existingPostIndex],
        ...postData,
      };
      operationType = "update";
    } else {
      // 添加新文章
      posts.push(postData);
      operationType = "add";
    }

    // 检查是否需要更新每日任务状态
    let dailyTasks = account.dailyTasks || [];
    let dailyTasksUpdated = false;

    // 遍历每日任务，检查是否有匹配的文章ID
    dailyTasks = dailyTasks.map((task) => {
      if (task.articleId === articleId && !task.isCompleted) {
        console.log(`找到匹配的每日任务，文章ID: ${articleId}，更新为已完成`);
        dailyTasksUpdated = true;
        return {
          ...task,
          isCompleted: true,
        };
      }
      return task;
    });

    // 更新账号的posts数组和dailyTasks数组
    accounts[accountIndex] = {
      ...account,
      posts: posts,
      lastPostTime: postData.publishTime,
      dailyTasks: dailyTasks,
      currentAccountEarnings: dailyEarnings, // 更新当前账号收益
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
      message: `文章${operationType === "add" ? "添加" : "更新"}成功${
        dailyTasksUpdated ? "，每日任务状态已更新" : ""
      }`,
      data: {
        operationType: operationType,
        postData: postData,
        accountId: accountId,
        totalPosts: posts.length,
        dailyTasksUpdated: dailyTasksUpdated,
        updatedTaskCount: dailyTasksUpdated ? 1 : 0,
      },
      event: event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("更新用户账号文章失败：", error);
    return {
      success: false,
      message: error.message || "更新用户账号文章失败",
      error: error,
      event: event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};
