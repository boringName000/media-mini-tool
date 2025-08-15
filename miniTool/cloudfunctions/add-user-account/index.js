// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const {
      trackType,
      platform,
      phoneNumber,
      accountNickname,
      accountId,
      registerDate,
      isViolation = false,
      screenshotUrl = "",
    } = event;

    // 验证必填字段
    if (
      !trackType ||
      !platform ||
      !phoneNumber ||
      !accountNickname ||
      !accountId
    ) {
      return {
        success: false,
        error: "请填写完整的账号信息",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return {
        success: false,
        error: "请输入正确的手机号格式",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 获取当前用户信息
    const userQuery = await db
      .collection("user-info")
      .where({ userId: wxContext.OPENID })
      .get();

    if (!userQuery.data || userQuery.data.length === 0) {
      return {
        success: false,
        error: "用户不存在，请先登录",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    const user = userQuery.data[0];

    // 检查用户状态
    if (user.status !== 1) {
      return {
        success: false,
        error: "用户账号已被禁用",
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 检查是否已存在相同的账号信息（防止重复添加）
    const existingAccounts = user.accounts || [];

    // 生成账号ID
    // 格式：AC + 账号索引（5位数字，从00001开始）
    const accountIndex = (existingAccounts.length + 1)
      .toString()
      .padStart(5, "0");
    const generatedAccountId = `AC${accountIndex}`;

    // 格式化注册日期
    let formattedRegisterDate = null;
    if (registerDate) {
      // 如果已经是 ISO 格式，直接使用
      if (registerDate.includes("T")) {
        formattedRegisterDate = registerDate;
      } else {
        // 如果是 YYYY-MM-DD 格式，转换为 ISO 格式
        const date = new Date(registerDate + "T00:00:00.000Z");
        formattedRegisterDate = date.toISOString();
      }
    } else {
      // 如果没有提供日期，使用当前日期
      formattedRegisterDate = new Date().toISOString();
    }

    // 准备账号数据
    const accountData = {
      accountId: generatedAccountId, // 使用生成的唯一ID
      trackType: trackType,
      platform: platform,
      phoneNumber: phoneNumber,
      accountNickname: accountNickname,
      originalAccountId: accountId, // 保存用户输入的原始账号ID
      registerDate: formattedRegisterDate,
      isViolation: isViolation,
      screenshotUrl: screenshotUrl,
      createTimestamp: db.serverDate(),
      status: 1, // 账号状态：0-禁用，1-启用
      auditStatus: 0, // 审核状态：0-待审核，1-已通过，2-未通过
      dailyPostCount: 0, // 每日发文数量
      posts: [], // 已发布的文章数据数组
      lastPostTime: null, // 最后发文时间
    };
    const isDuplicate = existingAccounts.some(
      (account) =>
        account.platform === platform && account.originalAccountId === accountId
    );

    if (isDuplicate) {
      return {
        success: false,
        error: "该平台下已存在相同的账号ID",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 检查用户绑定的注册时间registerDate是否大于当前时间,是否非法
    if (registerDate) {
      const registerDateTime = new Date(registerDate);
      const currentDateTime = new Date();

      // 检查注册时间是否大于当前时间
      if (registerDateTime > currentDateTime) {
        return {
          success: false,
          error: "注册时间不能大于当前时间",
          event,
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        };
      }

      // 检查注册时间是否过于久远（比如超过10年）
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      if (registerDateTime < tenYearsAgo) {
        return {
          success: false,
          error: "注册时间过于久远，请检查日期是否正确",
          event,
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        };
      }
    }

    // 将新账号添加到用户的账号数组中
    const updatedAccounts = [...existingAccounts, accountData];

    // 更新用户信息
    const updateResult = await db
      .collection("user-info")
      .doc(user._id)
      .update({
        data: {
          accounts: updatedAccounts,
          lastUpdateTimestamp: db.serverDate(),
        },
      });

    if (!updateResult.stats.updated) {
      return {
        success: false,
        error: "账号信息添加失败，请稍后重试",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    return {
      success: true,
      message: "账号信息添加成功",
      accountData: {
        ...accountData,
        accountId: generatedAccountId, // 返回生成的账号ID
      },
      totalAccounts: updatedAccounts.length,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("添加账号信息失败：", error);
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
