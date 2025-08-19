// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }); // 使用当前云环境

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const db = cloud.database();

  try {
    const { userId, accountId, updateFields } = event;

    // 验证必填字段
    if (!userId || !accountId || !updateFields) {
      return {
        success: false,
        error: "缺少必要参数：userId、accountId、updateFields",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证updateFields是否为对象且不为空
    if (
      typeof updateFields !== "object" ||
      Object.keys(updateFields).length === 0
    ) {
      return {
        success: false,
        error: "updateFields必须是非空对象",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证可更新的字段（防止更新敏感字段）
    const allowedFields = [
      "trackType",
      "platform",
      "phoneNumber",
      "accountNickname",
      "originalAccountId",
      "registerDate",
      "isViolation",
      "screenshotUrl",
      "status",
      "auditStatus",
      "dailyPostCount",
      "lastPostTime",
    ];

    const invalidFields = Object.keys(updateFields).filter(
      (field) => !allowedFields.includes(field)
    );
    if (invalidFields.length > 0) {
      return {
        success: false,
        error: `不允许更新的字段：${invalidFields.join(", ")}`,
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 获取用户信息
    const userQuery = await db
      .collection("user-info")
      .where({ userId: userId })
      .get();

    if (!userQuery.data || userQuery.data.length === 0) {
      return {
        success: false,
        error: "用户不存在",
        userId: userId,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    const user = userQuery.data[0];

    // 注意：不检查用户状态，因为可能需要更新账号状态来重新启用账号

    // 查找要更新的账号
    const accounts = user.accounts || [];
    const accountIndex = accounts.findIndex(
      (account) => account.accountId === accountId
    );

    if (accountIndex === -1) {
      return {
        success: false,
        error: "账号不存在",
        accountId: accountId,
        userId: userId,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证特定字段的格式
    if (updateFields.phoneNumber) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(updateFields.phoneNumber)) {
        return {
          success: false,
          error: "请输入正确的手机号格式",
          event,
          openid: wxContext.OPENID,
          appid: wxContext.APPID,
          unionid: wxContext.UNIONID,
        };
      }
    }

    if (updateFields.registerDate) {
      const registerDateTime = new Date(updateFields.registerDate);
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

      // 格式化注册日期
      if (updateFields.registerDate.includes("T")) {
        // 如果已经是 ISO 格式，直接使用
        updateFields.registerDate = updateFields.registerDate;
      } else {
        // 如果是 YYYY-MM-DD 格式，转换为 ISO 格式
        const date = new Date(updateFields.registerDate + "T00:00:00.000Z");
        updateFields.registerDate = date.toISOString();
      }
    }

    // 检查是否与其他账号重复（如果更新了platform或originalAccountId）
    if (updateFields.platform || updateFields.originalAccountId) {
      const newPlatform =
        updateFields.platform || accounts[accountIndex].platform;
      const newOriginalAccountId =
        updateFields.originalAccountId ||
        accounts[accountIndex].originalAccountId;

      const isDuplicate = accounts.some(
        (account, index) =>
          index !== accountIndex &&
          account.platform === newPlatform &&
          account.originalAccountId === newOriginalAccountId
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
    }

    // 更新账号数据
    const updatedAccounts = [...accounts];
    updatedAccounts[accountIndex] = {
      ...updatedAccounts[accountIndex],
      ...updateFields,
      lastUpdateTimestamp: db.serverDate(),
    };

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
        error: "账号信息更新失败，请稍后重试",
        event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 构建更新后的用户信息（避免重复查询数据库）
    const updatedUser = {
      ...user,
      accounts: updatedAccounts,
      lastUpdateTimestamp: db.serverDate(),
    };

    // 获取更新后的账号数据
    const updatedAccount = updatedAccounts[accountIndex];

    return {
      success: true,
      message: "账号信息更新成功",
      userInfo: {
        userId: updatedUser.userId,
        nickname: updatedUser.nickname,
        phone: updatedUser.phone,
        userLevel: updatedUser.userLevel,
        userType: updatedUser.userType,
        status: updatedUser.status,
        registerTimestamp: updatedUser.registerTimestamp,
        lastLoginTimestamp: updatedUser.lastLoginTimestamp,
        inviteCode: updatedUser.inviteCode,
        accounts: updatedUser.accounts || [],
      },
      accountData: updatedAccount,
      updatedFields: updateFields,
      event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("更新账号信息失败：", error);
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
