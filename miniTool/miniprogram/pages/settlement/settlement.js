// 引入用户时间工具
const userTime = require("../../utils/userTime.js");
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
    settlementAccountList: [
      {
        accountId: "ACC001",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
        platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
        accountName: "美食达人小红",
        trackTypeEnum: TrackTypeEnum.FOOD_TRACK,
        trackType: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
        trackIcon: getTrackTypeIcon(TrackTypeEnum.FOOD_TRACK),
        status: SettlementStatusEnum.PENDING,
        settlementPeriod: "2025年1月上半月",
        lastSettlementTime: "2024-12-31",
        articlesCount: 12,
        accountEarnings: 0,
        settlementEarnings: 0,
      },
      {
        accountId: "ACC002",
        platformEnum: PlatformEnum.WECHAT_MP,
        platform: getPlatformName(PlatformEnum.WECHAT_MP),
        platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
        accountName: "旅游探索者",
        trackTypeEnum: TrackTypeEnum.TRAVEL_TRACK,
        trackType: getTrackTypeName(TrackTypeEnum.TRAVEL_TRACK),
        trackIcon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_TRACK),
        status: SettlementStatusEnum.SETTLED,
        settlementPeriod: "2025年1月上半月",
        lastSettlementTime: "2025-01-15",
        articlesCount: 8,
        accountEarnings: 1800,
        settlementEarnings: 1500,
      },
      {
        accountId: "ACC003",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
        platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
        accountName: "书法艺术家",
        trackTypeEnum: TrackTypeEnum.CALLIGRAPHY,
        trackType: getTrackTypeName(TrackTypeEnum.CALLIGRAPHY),
        trackIcon: getTrackTypeIcon(TrackTypeEnum.CALLIGRAPHY),
        status: SettlementStatusEnum.PENDING,
        settlementPeriod: "2025年1月上半月",
        lastSettlementTime: "2024-12-31",
        articlesCount: 15,
        accountEarnings: 0,
        settlementEarnings: 0,
      },
      {
        accountId: "ACC004",
        platformEnum: PlatformEnum.WECHAT_MP,
        platform: getPlatformName(PlatformEnum.WECHAT_MP),
        platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
        accountName: "摄影师小李",
        trackTypeEnum: TrackTypeEnum.PHOTOGRAPHY,
        trackType: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
        trackIcon: getTrackTypeIcon(TrackTypeEnum.PHOTOGRAPHY),
        status: SettlementStatusEnum.SETTLED,
        settlementPeriod: "2025年1月上半月",
        lastSettlementTime: "2025-01-15",
        articlesCount: 6,
        accountEarnings: 1200,
        settlementEarnings: 1000,
      },
      {
        accountId: "ACC005",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
        platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
        accountName: "古董收藏家",
        trackTypeEnum: TrackTypeEnum.ANTIQUE,
        trackType: getTrackTypeName(TrackTypeEnum.ANTIQUE),
        trackIcon: getTrackTypeIcon(TrackTypeEnum.ANTIQUE),
        status: SettlementStatusEnum.PENDING,
        settlementPeriod: "2025年1月上半月",
        lastSettlementTime: "2024-12-31",
        articlesCount: 10,
        accountEarnings: 0,
        settlementEarnings: 0,
      },
    ],

    // 结算统计
    settlementStats: {
      totalAccounts: 0,
      pendingAccounts: 0,
      settledAccounts: 0,
      settledEarnings: 0,
    },

    // 当前结算期
    currentSettlementPeriod: "",
  },

  onLoad: function (options) {
    console.log("结算页面接收到的参数:", options);

    // 处理从earnings-settlement页面传递过来的参数
    if (options.period) {
      const period = decodeURIComponent(options.period);

      console.log("处理传递的参数:", { period });

      this.setData({
        currentSettlementPeriod: period,
        settlementAccountList: this.data.settlementAccountList.map(
          (account) => ({
            ...account,
            settlementPeriod: period,
          })
        ),
      });
    } else {
      this.setCurrentSettlementPeriod();
    }

    this.calculateSettlementStats();
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.calculateSettlementStats();
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

    // 计算本期已结算收益（模拟数据）
    const settledEarnings = settledAccounts * 1500; // 假设每个已结算账号收益1500元

    this.setData({
      settlementStats: {
        totalAccounts,
        pendingAccounts,
        settledAccounts,
        settledEarnings,
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

    // 跳转到提交结算页面
    wx.navigateTo({
      url: `/pages/submit-settlement/submit-settlement?accountId=${
        account.accountId
      }&accountName=${encodeURIComponent(
        account.accountName
      )}&period=${encodeURIComponent(account.settlementPeriod)}`,
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

  // 点击账号项查看详情
  onAccountTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const account = this.data.settlementAccountList[index];

    wx.showModal({
      title: account.accountName,
      content: `平台：${account.platform}\n赛道：${account.trackType}\n状态：${account.status}\n文章数：${account.articlesCount}`,
      showCancel: false,
      confirmText: "确定",
    });
  },
});
