// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    // 获取传入的 openid，如果没有传入则使用当前用户的 openid
    const targetOpenId = (event && event.openid) || wxContext.OPENID;

    // 验证 openid 是否存在
    if (!targetOpenId) {
      return {
        success: false,
        error: "缺少用户标识",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 根据 openid 查询用户信息
    const queryRes = await db
      .collection("user-info")
      .where({ userId: targetOpenId })
      .get();

    // 检查用户是否存在
    if (!queryRes.data || queryRes.data.length === 0) {
      return {
        success: false,
        error: "用户不存在",
        userId: targetOpenId,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    const user = queryRes.data[0];

    // 检查用户状态
    if (user.status !== 1) {
      return {
        success: false,
        error: "用户账号已被禁用",
        userId: user.userId,
        status: user.status,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 调用 create-daily-tasks 云函数更新每日任务数据
    let dailyTasksResult = null;
    try {
      dailyTasksResult = await cloud.callFunction({
        name: "create-daily-tasks",
        data: {
          userId: user.userId,
        },
      });

      console.log("每日任务更新结果:", dailyTasksResult);
    } catch (dailyTasksError) {
      console.error("调用 create-daily-tasks 云函数失败:", dailyTasksError);
      // 不阻止主流程，继续返回用户信息
    }

    // 返回用户信息（不包含敏感信息如密码）
    return {
      success: true,
      message: "获取用户信息成功",
      userInfo: {
        userId: user.userId,
        nickname: user.nickname,
        phone: user.phone,
        userLevel: user.userLevel,
        userType: user.userType,
        status: user.status,
        registerTimestamp: user.registerTimestamp,
        lastLoginTimestamp: user.lastLoginTimestamp,
        lastUpdateTimestamp: user.lastUpdateTimestamp,
        inviteCode: user.inviteCode,
        accounts: user.accounts || [], // 添加账号信息
      },
      // 返回查询相关的上下文信息
      queryContext: {
        targetOpenId: targetOpenId,
        currentOpenId: wxContext.OPENID,
        isSelfQuery: targetOpenId === wxContext.OPENID, // 是否是查询自己的信息
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      },
      // 返回每日任务更新结果
      dailyTasksUpdate: dailyTasksResult
        ? {
            success: dailyTasksResult.result.success,
            message: dailyTasksResult.result.message,
            data: dailyTasksResult.result.data,
          }
        : null,
    };
  } catch (error) {
    console.error("获取用户信息失败：", error);
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};
