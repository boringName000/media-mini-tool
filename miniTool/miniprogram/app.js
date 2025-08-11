// app.js
App({
  globalData: {
    loginResult: null,
  },
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: wx.cloud.DYNAMIC_CURRENT_ENV,
        traceUser: true,
      });
    }

    // 检查用户登录状态
    this.checkLoginStatus();
  },

  // 检查用户登录状态
  checkLoginStatus: function () {
    try {
      // 先从本地存储获取登录结果
      const loginResult = wx.getStorageSync("loginResult");

      if (loginResult && loginResult.success) {
        // 有有效的登录数据，保存到全局数据
        this.globalData.loginResult = loginResult;
        console.log("检测到用户已登录:", loginResult.nickname);
      } else {
        // 没有登录数据，跳转到登录页面
        console.log("未检测到登录状态，跳转到登录页面");
        this.redirectToLogin();
      }
    } catch (e) {
      console.error("检查登录状态失败:", e);
      // 出错时也跳转到登录页面
      this.redirectToLogin();
    }
  },

  // 跳转到登录页面
  redirectToLogin: function () {
    // 使用 redirectTo 而不是 navigateTo，避免用户通过返回按钮回到未登录状态
    wx.redirectTo({
      url: "/pages/login/login",
      fail: function (err) {
        console.error("跳转到登录页面失败:", err);
        // 如果跳转失败，显示提示
        wx.showToast({
          title: "请先登录",
          icon: "none",
          duration: 2000,
        });
      },
    });
  },

  // 清除登录状态
  clearLoginStatus: function () {
    this.globalData.loginResult = null;
    try {
      wx.removeStorageSync("loginResult");
    } catch (e) {
      console.error("清除登录状态失败:", e);
    }
  },
});
