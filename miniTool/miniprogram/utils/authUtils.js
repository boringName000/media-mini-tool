// 登录状态检查工具
const authUtils = {
  // 检查是否已登录
  isLoggedIn: function () {
    const app = getApp();
    return !!(app.globalData.loginResult && app.globalData.loginResult.success);
  },

  // 获取用户信息
  getUserInfo: function () {
    const app = getApp();
    return app.globalData.loginResult || null;
  },

  // 检查登录状态，如果未登录则跳转到登录页面
  checkLoginAndRedirect: function () {
    if (!this.isLoggedIn()) {
      wx.redirectTo({
        url: "/pages/login/login",
        fail: function (err) {
          console.error("跳转到登录页面失败:", err);
          wx.showToast({
            title: "请先登录",
            icon: "none",
            duration: 2000,
          });
        },
      });
      return false;
    }
    return true;
  },

  // 页面级别的登录检查（在页面的onLoad或onShow中调用）
  requireLogin: function (pageInstance) {
    if (!this.isLoggedIn()) {
      // 保存当前页面路径，登录成功后可以跳转回来
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.route) {
        try {
          wx.setStorageSync("redirectAfterLogin", "/" + currentPage.route);
        } catch (e) {
          console.error("保存重定向路径失败:", e);
        }
      }

      wx.redirectTo({
        url: "/pages/login/login",
        fail: function (err) {
          console.error("跳转到登录页面失败:", err);
          wx.showToast({
            title: "请先登录",
            icon: "none",
            duration: 2000,
          });
        },
      });
      return false;
    }
    return true;
  },

  // 清除登录状态
  clearLoginStatus: function () {
    const app = getApp();
    app.clearLoginStatus();
  },

  // 登录成功后处理重定向
  handleLoginSuccess: function (result) {
    const app = getApp();
    app.globalData.loginResult = result;

    try {
      wx.setStorageSync("loginResult", result);

      // 检查是否有重定向路径
      const redirectPath = wx.getStorageSync("redirectAfterLogin");
      if (redirectPath) {
        wx.removeStorageSync("redirectAfterLogin");
        wx.redirectTo({
          url: redirectPath,
          fail: () => {
            // 如果重定向失败，跳转到首页
            wx.switchTab({
              url: "/pages/index/index",
            });
          },
        });
      } else {
        // 默认跳转到首页
        wx.switchTab({
          url: "/pages/index/index",
        });
      }
    } catch (e) {
      console.error("处理登录成功失败:", e);
      wx.switchTab({
        url: "/pages/index/index",
      });
    }
  },
};

module.exports = authUtils;
