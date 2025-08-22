// 引入赛道类型工具
const {
  TrackTypeEnum,
  getTrackTypeName,
  getTrackTypeIcon,
} = require("../../utils/trackTypeUtils");

// 引入平台工具
const {
  PlatformEnum,
  getPlatformName,
  getPlatformIcon,
} = require("../../utils/platformUtils");

// 引入结算状态工具
const {
  SettlementStatusEnum,
  getSettlementStatusName,
  isPending,
  isSettled,
} = require("../../utils/settlementStatusUtils");

Page({
  data: {
    // 本期结算账号列表
    settlementAccountList: [],

    // 结算统计
    settlementStats: {
      totalAccounts: 0,
      pendingAccounts: 0,
      settledAccounts: 0,
      settledEarnings: 0,
      totalAccountEarnings: 0,
    },

    // 当前结算期
    currentSettlementPeriod: "",

    // 时间范围信息
    settlementTimeRange: null,
  },

  onLoad: function (options) {
    console.log("结算页面接收到的参数:", options);

    // 处理从earnings-settlement页面传递过来的参数
    if (options.period) {
      const period = decodeURIComponent(options.period);
      const startTime = options.startTime
        ? decodeURIComponent(options.startTime)
        : null;
      const endTime = options.endTime
        ? decodeURIComponent(options.endTime)
        : null;
      const year = options.year ? parseInt(options.year) : null;
      const month = options.month ? parseInt(options.month) : null;
      const periodType = options.periodType || null;

      console.log("处理传递的参数:", {
        period,
        startTime,
        endTime,
        year,
        month,
        periodType,
      });

      this.setData({
        currentSettlementPeriod: period,
        settlementTimeRange: {
          startTime: startTime,
          endTime: endTime,
          year: year,
          month: month,
          periodType: periodType,
        },
      });
    } else {
      this.setCurrentSettlementPeriod();
    }
  },

  onShow: function () {
    // 页面显示时，如果有时间参数则重新加载数据
    if (
      this.data.settlementTimeRange &&
      this.data.settlementTimeRange.startTime &&
      this.data.settlementTimeRange.endTime
    ) {
      this.loadSettlementData(
        this.data.settlementTimeRange.startTime,
        this.data.settlementTimeRange.endTime
      );
    }
  },

  // 计算结算统计数据
  calculateSettlementStats: function () {
    const accountList = this.data.settlementAccountList;

    const totalAccounts = accountList.length;
    const pendingAccounts = accountList.filter((item) =>
      isPending(item.status)
    ).length;
    const settledAccounts = accountList.filter((item) =>
      isSettled(item.status)
    ).length;

    // 计算已结算账号的结算收益
    const settledEarnings = accountList
      .filter((item) => isSettled(item.status))
      .reduce((total, item) => total + (item.settlementEarnings || 0), 0);

    // 计算已结算账号的总收益
    const totalAccountEarnings = accountList
      .filter((item) => isSettled(item.status))
      .reduce((total, item) => total + (item.accountEarnings || 0), 0);

    this.setData({
      settlementStats: {
        totalAccounts,
        pendingAccounts,
        settledAccounts,
        settledEarnings,
        totalAccountEarnings,
      },
    });
  },

  // 设置当前结算期
  setCurrentSettlementPeriod: function () {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    let period = "";
    if (day <= 15) {
      period = `${year}年${month}月上半月`;
    } else {
      period = `${year}年${month}月下半月`;
    }

    this.setData({
      currentSettlementPeriod: period,
    });
  },

  // 加载结算数据
  loadSettlementData: function (startTime, endTime) {
    const app = getApp();
    const userId = app.globalData.loginResult?.userId;

    if (!userId) {
      console.error("用户未登录");
      wx.showToast({
        title: "请先登录",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "加载结算数据...",
    });

    // 调用云函数获取账号结算信息
    wx.cloud.callFunction({
      name: "get-account-settlement-info",
      data: {
        userId: userId,
        startTime: startTime,
        endTime: endTime,
      },
      success: (res) => {
        wx.hideLoading();
        console.log("获取结算数据成功:", res);

        if (res.result.success) {
          this.processSettlementData(res.result.settlementInfo);
        } else {
          console.error("获取结算数据失败:", res.result.message);
          wx.showToast({
            title: res.result.message || "获取数据失败",
            icon: "none",
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error("调用云函数失败:", err);
        wx.showToast({
          title: "网络错误，请重试",
          icon: "none",
        });
      },
    });
  },

  // 处理结算数据
  processSettlementData: function (settlementInfo) {
    if (!settlementInfo || !Array.isArray(settlementInfo)) {
      console.warn("结算数据格式不正确");
      return;
    }

    // 转换云函数返回的数据格式为页面需要的格式
    const accountList = settlementInfo.map((account) => {
      const earnings =
        account.earnings && account.earnings.length > 0
          ? account.earnings[0]
          : null;

      return {
        accountId: account.accountId,
        platformEnum: account.platform,
        platform: getPlatformName(account.platform),
        platformIcon: getPlatformIcon(account.platform),
        accountName: account.accountNickname,
        trackTypeEnum: account.trackType,
        trackType: getTrackTypeName(account.trackType),
        trackIcon: getTrackTypeIcon(account.trackType),
        status:
          earnings !== null && earnings !== undefined
            ? earnings.settlementStatus
            : SettlementStatusEnum.PENDING,
        settlementPeriod: this.data.currentSettlementPeriod,
        lastSettlementTime:
          earnings && earnings.settlementTime
            ? new Date(earnings.settlementTime).toLocaleDateString()
            : "未结算",
        articlesCount: earnings ? earnings.monthlyPostCount : 0,
        accountEarnings: earnings ? earnings.accountEarnings : 0,
        settlementEarnings: earnings ? earnings.settlementEarnings : 0,
      };
    });

    this.setData({
      settlementAccountList: accountList,
    });

    this.calculateSettlementStats();
  },

  // 点击结算按钮
  onSettlementTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const account = this.data.settlementAccountList[index];

    if (isSettled(account.status)) {
      wx.showToast({
        title: "该账号已结算",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 获取用户ID
    const app = getApp();
    const userId = app.globalData.loginResult?.userId;

    if (!userId) {
      wx.showToast({
        title: "用户未登录",
        icon: "none",
      });
      return;
    }

    // 获取时间范围参数
    const timeRange = this.data.settlementTimeRange;
    if (!timeRange || !timeRange.startTime || !timeRange.endTime) {
      wx.showToast({
        title: "时间参数错误",
        icon: "none",
      });
      return;
    }

    // 跳转到提交结算页面，传递所有必要参数
    wx.navigateTo({
      url: `/pages/submit-settlement/submit-settlement?accountId=${
        account.accountId
      }&accountName=${encodeURIComponent(
        account.accountName
      )}&period=${encodeURIComponent(
        account.settlementPeriod
      )}&userId=${userId}&startTime=${encodeURIComponent(
        timeRange.startTime
      )}&endTime=${encodeURIComponent(timeRange.endTime)}&year=${
        timeRange.year
      }&month=${timeRange.month}&periodType=${timeRange.periodType}`,
      success: function () {
        console.log("跳转到提交结算页面");
      },
      fail: function (err) {
        console.error("跳转失败:", err);
        wx.showToast({
          title: "跳转失败，请重试",
          icon: "none",
        });
      },
    });
  },
});
