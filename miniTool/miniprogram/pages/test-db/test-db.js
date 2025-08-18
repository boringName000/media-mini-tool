// 测试数据库页面
const userInfoUtils = require("../../utils/userInfoUtils");
const timeUtils = require("../../utils/timeUtils");
const imageUtils = require("../../utils/imageUtils");

Page({
  data: {
    userInfo: null,
    // 真实的账户数据（从全局数据获取）
    realAccountData: null,
  },

  onLoad: function (options) {
    console.log("测试数据库页面加载");
    // 获取真实的账户数据
    this.getRealAccountData();
  },

  // 获取真实的账户数据
  getRealAccountData: function () {
    const app = getApp();
    const globalData = app.globalData;

    console.log("=== 获取真实账户数据 ===");
    console.log("globalData:", globalData);
    console.log("loginResult:", globalData.loginResult);

    if (
      globalData.loginResult &&
      globalData.loginResult.accounts &&
      globalData.loginResult.accounts.length > 0
    ) {
      // 获取第一个账户的数据
      const firstAccount = globalData.loginResult.accounts[0];
      console.log("第一个账户数据:", firstAccount);

      this.setData({
        realAccountData: firstAccount,
      });

      wx.showToast({
        title: "获取真实数据成功",
        icon: "success",
        duration: 2000,
      });
    } else {
      console.log("没有找到账户数据");
      wx.showToast({
        title: "没有找到账户数据",
        icon: "none",
        duration: 2000,
      });
    }
  },

  // 获取用户信息
  getUserInfo: async function () {
    try {
      wx.showLoading({
        title: "获取中...",
        mask: true,
      });

      const result = await userInfoUtils.getCurrentUserInfo();

      wx.hideLoading();

      if (result.success) {
        this.setData({
          userInfo: result.userInfo,
        });

        wx.showToast({
          title: "获取成功",
          icon: "success",
          duration: 2000,
        });

        console.log("用户信息:", result.userInfo);
      } else {
        wx.showToast({
          title: result.error || "获取失败",
          icon: "none",
          duration: 2000,
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error("获取用户信息失败:", error);
      wx.showToast({
        title: "获取失败",
        icon: "none",
        duration: 2000,
      });
    }
  },

  // 测试账户截图URL的智能图片组件
  testAccountScreenshot: function () {
    console.log("=== 测试账户截图URL的智能图片组件 ===");

    if (!this.data.realAccountData) {
      wx.showToast({
        title: "没有真实账户数据",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    const screenshotUrl = this.data.realAccountData.screenshotUrl;
    console.log("真实账户截图URL:", screenshotUrl);

    // 测试图片处理逻辑
    const result = imageUtils.processImageUrl(screenshotUrl);
    console.log("图片处理结果:", result);

    // 测试图片显示信息
    const displayInfo = imageUtils.getImageDisplayInfo(screenshotUrl);
    console.log("图片显示信息:", displayInfo);

    wx.showToast({
      title: "查看控制台输出",
      icon: "none",
      duration: 2000,
    });
  },

  // 切换不同的账户进行测试
  switchAccount: function () {
    const app = getApp();
    const globalData = app.globalData;

    if (
      !globalData.loginResult ||
      !globalData.loginResult.accounts ||
      globalData.loginResult.accounts.length === 0
    ) {
      wx.showToast({
        title: "没有账户数据",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    const accounts = globalData.loginResult.accounts;
    const currentIndex = this.data.realAccountData
      ? accounts.findIndex(
          (acc) => acc.accountId === this.data.realAccountData.accountId
        )
      : -1;

    // 切换到下一个账户，如果没有当前账户或到达末尾，则选择第一个
    const nextIndex = (currentIndex + 1) % accounts.length;
    const nextAccount = accounts[nextIndex];

    this.setData({
      realAccountData: nextAccount,
    });

    console.log("切换到账户:", nextAccount);
    console.log("账户截图URL:", nextAccount.screenshotUrl);

    wx.showToast({
      title: `切换到账户 ${nextIndex + 1}`,
      icon: "success",
      duration: 1500,
    });
  },

  // 图片加载成功事件
  onImageLoad: function (e) {
    console.log("图片加载成功:", e.detail);
  },

  // 图片加载错误事件
  onImageError: function (e) {
    console.error("图片加载失败:", e.detail);
  },

  // 图片点击事件
  onImageTap: function (e) {
    console.log("图片被点击:", e.detail);
    wx.showToast({
      title: "图片被点击",
      icon: "none",
      duration: 1000,
    });
  },
});
