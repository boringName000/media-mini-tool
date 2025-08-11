const {
  TrackTypeEnum,
  getTrackTypeName,
  getTrackTypeIcon,
} = require("../../utils/trackTypeUtils");

const {
  PlatformEnum,
  getPlatformName,
  getPlatformIcon,
} = require("../../utils/platformUtils");

Page({
  data: {
    // 账号列表数据
    accountList: [
      {
        accountId: "ACC001",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
        platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
        accountName: "美食达人小红",
        trackTypeEnum: TrackTypeEnum.FOOD_TRACK,
        trackType: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
        trackIcon: getTrackTypeIcon(TrackTypeEnum.FOOD_TRACK),
        status: "正常运营",
        isReported: true,
        lastPublishedTime: "2025-01-20 14:30",
        articlesCount: 156,
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
        status: "正常运营",
        isReported: false,
        lastPublishedTime: "2025-01-19 09:15",
        articlesCount: 89,
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
        status: "待审核",
        isReported: false,
        lastPublishedTime: "2025-01-18 16:45",
        articlesCount: 234,
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
        status: "正常运营",
        isReported: true,
        lastPublishedTime: "2025-01-21 11:20",
        articlesCount: 67,
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
        status: "正常运营",
        isReported: false,
        lastPublishedTime: "2025-01-17 13:55",
        articlesCount: 45,
      },
    ],
  },

  onLoad: function (options) {
    // 页面加载时的初始化逻辑

    // 检查登录状态
    const authUtils = require("../../utils/authUtils");
    if (!authUtils.requireLogin(this)) {
      return;
    }
  },

  onShow: function () {
    // 页面显示时的逻辑
  },

  // 点击回传按钮
  onReportTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const account = this.data.accountList[index];

    // 跳转到回传信息页面
    wx.navigateTo({
      url: `/pages/upload-info/upload-info?taskId=${
        account.accountId
      }&taskTitle=${encodeURIComponent(
        account.accountName
      )}&accountName=${encodeURIComponent(account.accountName)}`,
      success: function () {
        console.log("跳转到回传信息页面");
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
