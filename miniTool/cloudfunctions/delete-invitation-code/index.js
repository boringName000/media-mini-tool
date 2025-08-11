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

    // 先查询邀请码是否存在
    const queryResult = await db
      .collection("invitation-code-mgr")
      .where({
        invitationCode: invitationCode.trim(),
      })
      .get();

    // 如果邀请码不存在
    if (queryResult.data.length === 0) {
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

    const invitationData = queryResult.data[0];

    // 删除邀请码
    const deleteResult = await db
      .collection("invitation-code-mgr")
      .where({
        invitationCode: invitationCode.trim(),
      })
      .remove();

    console.log("删除结果：", deleteResult);

    // 检查删除操作是否成功
    if (!deleteResult.stats || deleteResult.stats.removed === 0) {
      return {
        success: false,
        error: "删除邀请码失败，请重试",
        invitationCode: invitationCode,
        deleteResult: deleteResult,
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    console.log("邀请码删除成功：", invitationCode);
    console.log("删除数量：", deleteResult.stats.removed);

    return {
      success: true,
      invitationCode: invitationCode,
      deletedCount: deleteResult.stats.removed,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("删除邀请码失败：", error);
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
