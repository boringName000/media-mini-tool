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
    const { userId, startTime, endTime } = event;

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

    // 处理每个账号的结算信息
    const settlementInfo = [];

    for (const account of accounts) {
      const accountSettlement = {
        accountId: account.accountId,
        accountNickname: account.accountNickname,
        platform: account.platform,
        trackType: account.trackType,
        earnings: [],
      };

      // 检查账号是否有earnings数组
      if (account.earnings && Array.isArray(account.earnings)) {
        // 查找符合时间范围的收益记录
        const matchingEarnings = account.earnings.filter((earning) => {
          const earningStartTime = new Date(earning.startTime);
          const earningEndTime = new Date(earning.endTime);

          // 只返回完全匹配的记录
          return (
            earningStartTime.getTime() === startDate.getTime() &&
            earningEndTime.getTime() === endDate.getTime()
          );
        });

        if (matchingEarnings.length > 0) {
          // 找到匹配的收益记录，更新结算状态后返回
          const updatedEarnings = matchingEarnings.map((earning) =>
            updateSettlementStatus(earning)
          );
          accountSettlement.earnings = updatedEarnings;
        } else {
          // 没有找到匹配的记录，创建新的收益记录
          const newEarning = createNewEarning(startDate, endDate);
          accountSettlement.earnings = [newEarning];
        }
      } else {
        // 账号没有earnings数组，创建新的收益记录
        const newEarning = createNewEarning(startDate, endDate);
        accountSettlement.earnings = [newEarning];
      }

      settlementInfo.push(accountSettlement);
    }

    return {
      success: true,
      message: "获取账号结算信息成功",
      settlementInfo: settlementInfo,
      queryParams: {
        userId: userId,
        startTime: startDate,
        endTime: endDate,
      },
      event: event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  } catch (error) {
    console.error("获取账号结算信息失败:", error);
    return {
      success: false,
      message: "获取账号结算信息失败: " + error.message,
      error: error,
      event: event,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    };
  }
};

/**
 * 更新收益记录的结算状态
 * @param {Object} earning - 收益记录对象
 * @returns {Object} 更新后的收益记录对象
 */
function updateSettlementStatus(earning) {
  // 如果已经是已结算状态，不进行处理
  if (earning.settlementStatus === 2) {
    return earning;
  }

  const currentTime = new Date();
  const startTime = new Date(earning.startTime);
  const endTime = new Date(earning.endTime);

  let newStatus = earning.settlementStatus;

  // 判断当前时间与时间区间的关系
  if (currentTime >= startTime && currentTime <= endTime) {
    // 当前时间在时间区间内，设置为未结算状态
    newStatus = 0;
  } else if (currentTime > endTime) {
    // 当前时间超过时间范围，设置为待结算状态
    newStatus = 1;
  }
  // 如果当前时间早于开始时间，保持原有状态

  // 只有当状态发生变化时才更新
  if (newStatus !== earning.settlementStatus) {
    return {
      ...earning,
      settlementStatus: newStatus,
    };
  }

  return earning;
}

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
