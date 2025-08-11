// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const inputOpenId = (event && event.openid) || null;
    const phone = event && event.phone;
    const password = event && event.password;

    let user = null;

    if (inputOpenId) {
      // 优先使用入参 openid 登录
      const queryRes = await db
        .collection("user-info")
        .where({ userId: inputOpenId })
        .get();
      if (!queryRes.data || queryRes.data.length === 0) {
        return {
          success: false,
          error: "用户不存在，请先注册",
          userId: inputOpenId,
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        };
      }
      user = queryRes.data[0];
    } else if (phone && password) {
      // 使用手机号+密码登录
      const queryRes = await db
        .collection("user-info")
        .where({ phone: String(phone), password: String(password) })
        .get();
      if (!queryRes.data || queryRes.data.length === 0) {
        return {
          success: false,
          error: "手机号或密码不正确",
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        };
      }
      user = queryRes.data[0];
    } else {
      // 默认使用云函数上下文 openid 登录
      const userId = wxContext.OPENID;
      const queryRes = await db.collection("user-info").where({ userId }).get();
      if (!queryRes.data || queryRes.data.length === 0) {
        return {
          success: false,
          error: "用户不存在，请先注册",
          userId,
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        };
      }
      user = queryRes.data[0];
    }

    // 检查用户状态（1=启用）
    if (user.status !== 1) {
      return {
        success: false,
        error: "账号不可用，请联系管理员",
        userId: user.userId,
        status: user.status,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 更新最后登录时间（服务器时间）
    const serverNow = db.serverDate();
    await db
      .collection("user-info")
      .doc(user._id)
      .update({
        data: { lastLoginTimestamp: serverNow },
      });

    return {
      success: true,
      message: "登录成功",
      userId: user.userId,
      nickname: user.nickname,
      phone: user.phone,
      userLevel: user.userLevel,
      userType: user.userType,
      status: user.status,
      registerTimestamp: user.registerTimestamp,
      lastLoginTimestamp: serverNow,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("用户登录失败：", error);
    return {
      success: false,
      error: error.message,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};
