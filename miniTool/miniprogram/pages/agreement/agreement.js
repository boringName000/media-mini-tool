// 协议页面
Page({
  data: {
    // 页面数据
    isFromLogin: false, // 是否从登录入口进入
    showButtons: false, // 是否显示底部按钮
    agreementTitle: "用户服务协议", // 协议标题
  },

  onLoad: function (options) {
    console.log("协议页面加载，参数:", options);

    // 检查是否从登录入口进入
    if (options.from === "login") {
      this.setData({
        isFromLogin: true,
        agreementTitle: "隐私权政策", // 从登录入口进入时使用隐私权政策标题
        showButtons: options.showButtons === "true", // 只有当showButtons参数为true时才显示按钮
      });
      console.log("从登录入口进入协议页面");
    }
  },

  onShow: function () {
    // 页面显示时的逻辑
  },

  // 点击不同意按钮
  onDisagree: function () {
    console.log("用户点击不同意");

    wx.showToast({
      title: "您需要同意协议才能使用",
      icon: "none",
      duration: 2000,
    });

    // 返回上一页
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
      });
    }, 2000);
  },

  // 点击同意按钮
  onAgree: function () {
    console.log("用户点击同意");

    // 直接跳转到登录页面
    wx.navigateTo({
      url: "/pages/login/login?showButtons=true",
      success: function () {
        console.log("跳转到登录页面成功");
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
