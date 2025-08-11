// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const { invitationCode } = event;

    // 检查是否提供了邀请码
    if (!invitationCode || !invitationCode.trim()) {
      return {
        success: false,
        error: "请提供邀请码",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 查询邀请码是否存在
    const result = await db
      .collection("invitation-code-mgr")
      .where({
        invitationCode: invitationCode.trim(),
      })
      .get();

    // 如果邀请码不存在
    if (result.data.length === 0) {
      return {
        success: false,
        error: "邀请码不存在",
        invitationCode: invitationCode,
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    const invitationData = result.data[0];
    const currentTime = Date.now();
    // createTime 统一由 serverDate 写入，读取时应为服务器时间对象或时间戳
    let createTime = invitationData.createTime;
    if (createTime && typeof createTime !== "number") {
      try {
        createTime = new Date(createTime).getTime();
      } catch (_) {}
    }

    // 检查邀请码是否过期（默认30天有效期）
    const expirationDays = 30;
    const expirationTime = expirationDays * 24 * 60 * 60 * 1000; // 30天的毫秒数
    const isExpired = currentTime - createTime > expirationTime;

    if (isExpired) {
      return {
        success: false,
        error: `邀请码已过期（有效期${expirationDays}天）`,
        invitationCode: invitationCode,
        createTime: createTime,
        currentTime: currentTime,
        expirationDays: expirationDays,
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    return {
      success: true,
      invitationCode: invitationCode,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("验证邀请码失败：", error);
    return {
      success: false,
      error: error.message,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};
