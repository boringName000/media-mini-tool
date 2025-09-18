// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const { nickname, phone, password, inviteCode } = event;

    // 检查必填字段
    if (!nickname || !phone || !password || !inviteCode) {
      return {
        success: false,
        error: "请填写完整的注册信息",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return {
        success: false,
        error: "请输入正确的手机号",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证密码长度
    if (password.length < 6) {
      return {
        success: false,
        error: "密码长度不能少于6位",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证昵称长度
    if (nickname.length < 2) {
      return {
        success: false,
        error: "昵称长度不能少于2位",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 检查手机号是否已注册
    const existingUser = await db
      .collection("user-info")
      .where({
        phone: phone,
      })
      .get();

    if (existingUser.data.length > 0) {
      return {
        success: false,
        error: "该手机号已注册",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 使用现有的云函数校验邀请码
    const verifyRes = await cloud.callFunction({
      name: "verify-invitation-code",
      data: { invitationCode: inviteCode },
    });

    if (!verifyRes.result || !verifyRes.result.success) {
      return {
        success: false,
        error: (verifyRes.result && verifyRes.result.error) || "邀请码校验失败",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 准备用户数据 - 初始化所有用户信息字段
    const userData = {
      // 主键字段
      userId: wxContext.OPENID,

      // 用户基础信息字段
      nickname: nickname,
      phone: phone,
      password: password, // 注意：实际项目中应该加密存储
      status: 1, // 用户状态：1-正常，0-禁用
      userLevel: 1, // 用户等级，默认1级
      userType: 1, // 用户类型：1-普通用户，999-管理员
      registerTimestamp: db.serverDate(), // 注册时间
      lastLoginTimestamp: null, // 最后登录时间
      lastUpdateTimestamp: db.serverDate(), // 最后更新时间
      inviteCode: inviteCode, // 邀请码

      // 账号信息字段
      accounts: [], // 用户账号数组，初始为空
    };

    // 向 user-info 集合添加用户数据
    const result = await db.collection("user-info").add({
      data: userData,
    });

    // 校验插入是否成功
    if (!result || !result._id) {
      console.error("用户数据写入失败：返回结果异常", result);
      return {
        success: false,
        error: "用户数据写入失败，请稍后重试",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 直接删除邀请码（注册成功后删除邀请码）
    let deleteInvitation = null;
    try {
      // 删除邀请码数据库记录
      const deleteResult = await db
        .collection("invitation-code-mgr")
        .where({
          invitationCode: inviteCode.trim(),
        })
        .remove();

      console.log("邀请码删除结果：", deleteResult);

      // 检查删除操作是否成功
      if (deleteResult.stats && deleteResult.stats.removed > 0) {
        deleteInvitation = {
          success: true,
          deletedCount: deleteResult.stats.removed,
        };
        console.log("邀请码删除成功：", inviteCode, "删除数量：", deleteResult.stats.removed);
      } else {
        deleteInvitation = {
          success: false,
          deletedCount: 0,
          error: "删除邀请码失败，未找到对应记录",
        };
        console.warn("邀请码删除失败：未找到对应记录", inviteCode);
      }
    } catch (e) {
      console.error("删除邀请码数据库操作失败：", e);
      deleteInvitation = { success: false, error: e.message };
    }

    return {
      success: true,
      userId: wxContext.OPENID,
      nickname: nickname,
      phone: phone,
      registerTimestamp: userData.registerTimestamp,
      userLevel: userData.userLevel,
      userType: userData.userType,
      lastLoginTimestamp: userData.lastLoginTimestamp,
      lastUpdateTimestamp: userData.lastUpdateTimestamp,
      inviteCode: userData.inviteCode,
      accounts: userData.accounts,
      deleteInvitation: deleteInvitation,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("用户注册失败：", error);
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
