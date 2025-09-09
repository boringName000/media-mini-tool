// 账号管理工具函数
const accountUtils = {
  // 添加用户账号信息
  addUserAccount: async function (accountData) {
    try {
      const res = await wx.cloud.callFunction({
        name: "add-user-account",
        data: accountData,
      });

      if (res && res.result && res.result.success) {
        return {
          success: true,
          message: res.result.message,
          accountData: res.result.accountData,
          totalAccounts: res.result.totalAccounts,
        };
      } else {
        return {
          success: false,
          error: res.result.error || "添加账号失败",
        };
      }
    } catch (error) {
      console.error("调用添加账号云函数失败：", error);
      return {
        success: false,
        error: error.message || "网络错误",
      };
    }
  },

  // 验证账号数据
  validateAccountData: function (accountData) {
    const errors = {};
    let isValid = true;

    // 验证赛道选择
    if (!accountData.trackType) {
      errors.trackType = "请选择赛道";
      isValid = false;
    }

    // 验证平台选择
    if (!accountData.platform) {
      errors.platform = "请选择平台";
      isValid = false;
    }

    // 验证手机号
    if (!accountData.phoneNumber) {
      errors.phoneNumber = "请输入注册手机号";
      isValid = false;
    } else if (!/^1[3-9]\d{9}$/.test(accountData.phoneNumber)) {
      errors.phoneNumber = "请输入正确的手机号格式";
      isValid = false;
    }

    // 验证账号昵称
    if (!accountData.accountNickname) {
      errors.accountNickname = "请输入账号昵称";
      isValid = false;
    }

    // 验证账号ID
    if (!accountData.accountId) {
      errors.accountId = "请输入账号ID";
      isValid = false;
    }

    // 验证注册时间
    if (accountData.registerDate) {
      const registerDateTime = new Date(accountData.registerDate);
      const currentDateTime = new Date();

      // 检查注册时间是否大于当前时间
      if (registerDateTime > currentDateTime) {
        errors.registerDate = "注册时间不能大于当前时间";
        isValid = false;
      }

      // 检查注册时间是否过于久远（比如超过10年）
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

      if (registerDateTime < tenYearsAgo) {
        errors.registerDate = "注册时间过于久远，请检查日期是否正确";
        isValid = false;
      }
    }

    // 验证资料页截图（必填）
    if (!accountData.screenshotUrl) {
      errors.screenshotUrl = "请上传资料页截图";
      isValid = false;
    }

    return {
      isValid,
      errors,
    };
  },

  // 格式化账号数据
  formatAccountData: function (formData) {
    // 格式化注册日期为 ISO 8601 格式
    let formattedRegisterDate = null;
    if (formData.registerDate) {
      // 如果已经是 ISO 格式，直接使用
      if (formData.registerDate.includes("T")) {
        formattedRegisterDate = formData.registerDate;
      } else {
        // 如果是 YYYY-MM-DD 格式，转换为 ISO 格式
        const date = new Date(formData.registerDate + "T00:00:00.000Z");
        formattedRegisterDate = date.toISOString();
      }
    }

    return {
      trackType: formData.selectedTrackType?.type || 1,
      platform: formData.selectedPlatform?.type || 1,
      phoneNumber: formData.phoneNumber,
      accountNickname: formData.accountNickname,
      accountId: formData.accountId,
      registerDate: formattedRegisterDate,
      isViolation: formData.isViolation || false,
      screenshotUrl: formData.screenshotUrl || "",
    };
  },

  // 获取账号状态文本
  getAccountStatusText: function (status) {
    const statusMap = {
      0: "禁用",
      1: "启用",
    };
    return statusMap[status] || "未知";
  },

  // 获取审核状态文本
  getAuditStatusText: function (auditStatus) {
    const auditStatusMap = {
      0: "待审核",
      1: "已通过",
      2: "未通过",
    };
    return auditStatusMap[auditStatus] || "未知";
  },

  // 获取审核状态颜色
  getAuditStatusColor: function (auditStatus) {
    const colorMap = {
      0: "#f39c12", // 橙色 - 待审核
      1: "#27ae60", // 绿色 - 已通过
      2: "#e74c3c", // 红色 - 未通过
    };
    return colorMap[auditStatus] || "#999999";
  },

  // 格式化账号信息显示
  formatAccountForDisplay: function (account) {
    if (!account) return null;

    return {
      accountId: account.accountId,
      trackType: account.trackType,
      platform: account.platform,
      phoneNumber: account.phoneNumber,
      accountNickname: account.accountNickname,
      originalAccountId: account.originalAccountId,
      registerDate: account.registerDate,
      isViolation: account.isViolation,
      screenshotUrl: account.screenshotUrl,
      status: account.status,
      statusText: this.getAccountStatusText(account.status),
      auditStatus: account.auditStatus,
      auditStatusText: this.getAuditStatusText(account.auditStatus),
      auditStatusColor: this.getAuditStatusColor(account.auditStatus),
      currentAccountEarnings: account.currentAccountEarnings || 0,
      totalPosts: account.totalPosts || 0,
      lastPostTime: account.lastPostTime,
      createTime: account.createTimestamp
        ? new Date(account.createTimestamp).toLocaleString()
        : "未知",
    };
  },
};

module.exports = accountUtils;
