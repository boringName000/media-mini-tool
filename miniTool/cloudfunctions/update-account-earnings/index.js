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
    const { userId, accountId, startTime, endTime, updateFields } = event;

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

    if (!startTime || !endTime) {
      return {
        success: false,
        message: "结算开始时间和结束时间不能为空",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    if (!updateFields || typeof updateFields !== "object") {
      return {
        success: false,
        message: "更新字段不能为空且必须是对象",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 验证时间格式
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        success: false,
        message: "时间格式不正确",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    if (startDate >= endDate) {
      return {
        success: false,
        message: "开始时间必须早于结束时间",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 定义允许更新的字段
    const allowedFields = [
      "monthlyPostCount",
      "settlementStatus",
      "settlementMethod",
      "transferOrderNo",
      "accountEarnings",
      "settlementEarnings",
      "settlementImageUrl",
      "transferImageUrl",
    ];

    // 验证更新字段
    const invalidFields = Object.keys(updateFields).filter(
      (field) => !allowedFields.includes(field)
    );
    if (invalidFields.length > 0) {
      return {
        success: false,
        message: `不允许更新的字段: ${invalidFields.join(", ")}`,
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 查询用户信息
    const userResult = await db
      .collection("user-info")
      .where({
        userId: userId,
      })
      .get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: "用户不存在",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    const user = userResult.data[0];
    const accounts = user.accounts || [];

    // 查找指定账号
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
    let earnings = account.earnings || [];

    // 查找匹配时间范围的收益记录
    let earningIndex = -1;
    for (let i = 0; i < earnings.length; i++) {
      const earning = earnings[i];
      const earningStartTime = new Date(earning.startTime);
      const earningEndTime = new Date(earning.endTime);

      // 严格匹配时间范围
      if (
        earningStartTime.getTime() === startDate.getTime() &&
        earningEndTime.getTime() === endDate.getTime()
      ) {
        earningIndex = i;
        break;
      }
    }

    // 如果没有找到匹配的收益记录，创建新的
    if (earningIndex === -1) {
      const newEarning = createNewEarning(startDate, endDate);
      earnings.push(newEarning);
      earningIndex = earnings.length - 1;
    }

    // 更新收益记录
    const updatedEarning = {
      ...earnings[earningIndex],
      ...updateFields,
      // 确保时间字段不被覆盖
      startTime: earnings[earningIndex].startTime,
      endTime: earnings[earningIndex].endTime,
      // 强制设置为已结算状态
      settlementStatus: 2,
      // 使用数据库服务时间
      settlementTime: db.serverDate(),
    };

    // 验证字段值
    const validationResult = validateEarningFields(updatedEarning);
    if (!validationResult.valid) {
      return {
        success: false,
        message: validationResult.message,
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    // 更新账号的earnings数组
    earnings[earningIndex] = updatedEarning; // 使用更新后的收益记录
    accounts[accountIndex] = {
      ...account,
      earnings: earnings,
    };

    // 更新数据库
    const updateResult = await db
      .collection("user-info")
      .where({
        userId: userId,
      })
      .update({
        data: {
          accounts: accounts,
          lastUpdateTimestamp: db.serverDate(),
        },
      });

    if (updateResult.stats.updated === 0) {
      return {
        success: false,
        message: "更新失败",
        event: event,
        openid: wxContext.OPENID,
        appid: wxContext.APPID,
        unionid: wxContext.UNIONID,
      };
    }

    return {
      success: true,
      message: "更新账号收益信息成功",
      updatedEarning: updatedEarning,
      queryParams: {
        userId: userId,
        accountId: accountId,
        startTime: startDate,
        endTime: endDate,
        updateFields: updateFields,
      },
      event: event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("更新账号收益信息失败:", error);
    return {
      success: false,
      message: "更新账号收益信息失败: " + error.message,
      error: error,
      event: event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};

/**
 * 创建新的收益记录
 * @param {Date} startTime - 开始时间
 * @param {Date} endTime - 结束时间
 * @returns {Object} 新的收益记录对象
 */
function createNewEarning(startTime, endTime) {
  const currentTime = new Date();
  let initialStatus = 0; // 默认未结算

  // 根据当前时间与时间区间的关系确定初始状态
  if (currentTime > endTime) {
    initialStatus = 1; // 待结算
  }

  return {
    startTime: startTime,
    endTime: endTime,
    monthlyPostCount: 0,
    settlementTime: null,
    settlementStatus: initialStatus,
    settlementMethod: null,
    transferOrderNo: null,
    accountEarnings: 0,
    settlementEarnings: 0,
    settlementImageUrl: null,
    transferImageUrl: null,
  };
}

/**
 * 验证收益记录字段值
 * @param {Object} earning - 收益记录对象
 * @returns {Object} 验证结果 {valid: boolean, message: string}
 */
function validateEarningFields(earning) {
  // 验证 monthlyPostCount
  if (
    earning.monthlyPostCount !== undefined &&
    (typeof earning.monthlyPostCount !== "number" ||
      earning.monthlyPostCount < 0)
  ) {
    return {
      valid: false,
      message: "月发布文章数必须是大于等于0的数字",
    };
  }

  // 验证 settlementStatus
  if (
    earning.settlementStatus !== undefined &&
    ![0, 1, 2].includes(earning.settlementStatus)
  ) {
    return {
      valid: false,
      message: "结算状态必须是0(未结算)、1(待结算)或2(已结算)",
    };
  }

  // 验证 settlementMethod
  if (
    earning.settlementMethod !== undefined &&
    earning.settlementMethod !== null &&
    typeof earning.settlementMethod !== "number"
  ) {
    return {
      valid: false,
      message: "结算方式必须是数字类型",
    };
  }

  // 验证 transferOrderNo
  if (
    earning.transferOrderNo !== undefined &&
    earning.transferOrderNo !== null &&
    typeof earning.transferOrderNo !== "string"
  ) {
    return {
      valid: false,
      message: "转账订单号必须是字符串类型",
    };
  }

  // 验证 accountEarnings
  if (
    earning.accountEarnings !== undefined &&
    (typeof earning.accountEarnings !== "number" || earning.accountEarnings < 0)
  ) {
    return {
      valid: false,
      message: "账号收益必须是大于等于0的数字",
    };
  }

  // 验证 settlementEarnings
  if (
    earning.settlementEarnings !== undefined &&
    (typeof earning.settlementEarnings !== "number" ||
      earning.settlementEarnings < 0)
  ) {
    return {
      valid: false,
      message: "结算收益必须是大于等于0的数字",
    };
  }

  // 验证 settlementImageUrl
  if (
    earning.settlementImageUrl !== undefined &&
    earning.settlementImageUrl !== null &&
    typeof earning.settlementImageUrl !== "string"
  ) {
    return {
      valid: false,
      message: "结算单图片URL必须是字符串类型",
    };
  }

  // 验证 transferImageUrl
  if (
    earning.transferImageUrl !== undefined &&
    earning.transferImageUrl !== null &&
    typeof earning.transferImageUrl !== "string"
  ) {
    return {
      valid: false,
      message: "转账截图URL必须是字符串类型",
    };
  }

  return {
    valid: true,
    message: "验证通过",
  };
}
