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
const { TaskStatusEnum } = require("../../type/type");

Page({
  data: {
    // 任务统计数据
    taskStats: {
      pending: 3, // 待发表
      completed: 15, // 已完成
      rejected: 1, // 已拒绝
    },
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
        todayArticles: 3,
        status: "正常运营",
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
        todayArticles: 1,
        status: "正常运营",
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
        todayArticles: 2,
        status: "待审核",
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
        todayArticles: 0,
        status: "正常运营",
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
        todayArticles: 5,
        status: "正常运营",
      },
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1,
      });
    }
  },

  /**
   * 点击统计数据项
   */
  onStatTap: function (e) {
    const type = e.currentTarget.dataset.type;

    // 跳转到任务列表页面，并传递状态参数
    let statusEnum = TaskStatusEnum.PENDING;

    switch (type) {
      case "pending":
        statusEnum = TaskStatusEnum.PENDING;
        break;
      case "completed":
        statusEnum = TaskStatusEnum.COMPLETED;
        break;
      case "rejected":
        statusEnum = TaskStatusEnum.REJECTED;
        break;
    }

    // 构建查询参数
    let queryParams = `status=${statusEnum}`;

    // 如果是待发表状态，携带所有账号的ID信息
    if (type === "pending") {
      const accountIds = this.data.accountList
        .map((account) => account.accountId)
        .join(",");
      const platformEnums = this.data.accountList
        .map((account) => account.platformEnum)
        .join(",");
      const trackTypeEnums = this.data.accountList
        .map((account) => account.trackTypeEnum)
        .join(",");

      queryParams += `&accountIds=${encodeURIComponent(accountIds)}`;
      queryParams += `&platformEnums=${encodeURIComponent(platformEnums)}`;
      queryParams += `&trackTypeEnums=${encodeURIComponent(trackTypeEnums)}`;
    }

    wx.navigateTo({
      url: `/pages/task-list/task-list?${queryParams}`,
      success: function () {
        console.log(`跳转到任务列表页面，状态：${statusEnum}`);
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

  /**
   * 点击账号项
   */
  onAccountTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const account = this.data.accountList[index];

    // 跳转到文章列表页面，并传递赛道类型参数
    wx.navigateTo({
      url: `/pages/article-list/article-list?trackType=${
        account.trackTypeEnum
      }&trackName=${encodeURIComponent(account.trackType)}`,
      success: function () {
        console.log(`跳转到${account.accountName}的文章列表页面`);
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

  /**
   * 点击赛道类型
   */
  onTrackTypeTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const account = this.data.accountList[index];

    // 跳转到文章列表页面，并传递赛道类型参数
    wx.navigateTo({
      url: `/pages/article-list/article-list?trackType=${
        account.trackTypeEnum
      }&trackName=${encodeURIComponent(account.trackType)}`,
      success: function () {
        console.log(`跳转到${account.trackType}赛道的文章列表页面`);
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

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {},
});
