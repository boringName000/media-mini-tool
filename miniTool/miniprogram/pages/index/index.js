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
    console.log("加载的赛道类型数据:", trackTypes);
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
    const index = e.currentTarget.dataset.index;
    const trackItem = this.data.trackTypes[index];

    if (!trackItem) {
      console.log("赛道数据不存在");
      return;
    }

    const { icon, name, description, type } = trackItem;

    console.log("点击赛道项:", { icon, name, description, type });

    // 显示加载提示
    wx.showLoading({
      title: "加载中...",
      mask: true,
    });

    // 跳转到文章列表页面，传递赛道类型和平台类型参数（平台类型写死为公众号）
    wx.navigateTo({
      url: `/pages/article-list/article-list?trackType=${type}&platformType=1`,
      success: function () {
        console.log(`跳转到${name}赛道的文章列表页面（公众号平台）`);
        wx.hideLoading();
      },
      fail: function (err) {
        console.error("跳转失败:", err);
        wx.hideLoading();
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
