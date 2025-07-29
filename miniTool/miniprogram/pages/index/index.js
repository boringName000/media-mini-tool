Page({
  data: {
    trackTypes: [], // 赛道类型数据
    isScrolling: false, // 滚动状态
  },

  onLoad: function () {
    this.loadTrackTypes();
    this.startNoticeScroll();
  },

  onShow: function () {
    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
      });
    }
  },

  // 加载赛道类型数据
  loadTrackTypes: function () {
    const trackTypes = require("../../config/trackType");
    this.setData({
      trackTypes: trackTypes,
    });
  },

  // 启动通知滚动动画
  startNoticeScroll: function () {
    // 延迟启动滚动，确保页面渲染完成
    setTimeout(() => {
      this.setData({
        isScrolling: true,
      });
    }, 500);
  },

  // 点击赛道项
  onTrackItemTap: function (e) {
    const { icon, name, description, type } = e.detail;

    // 跳转到文章列表页面，并传递赛道类型参数
    wx.navigateTo({
      url: `/pages/article-list/article-list?trackType=${type}&trackName=${encodeURIComponent(
        name
      )}`,
      success: function () {
        console.log(`跳转到${name}赛道的文章列表页面`);
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

  // 跳转到今日数据页面
  goTodayData: function () {
    wx.navigateTo({
      url: "/pages/data-center/data-center",
      success: function () {
        console.log("跳转到数据中心页面");
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

  // 跳转到结算收益页面
  goSettlement: function () {
    console.log("点击了结算收益按钮");
    wx.navigateTo({
      url: "/pages/earnings-settlement/earnings-settlement",
      success: function () {
        console.log("跳转到收益结算页面成功");
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
