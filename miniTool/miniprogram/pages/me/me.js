// 引入用户时间工具
const timeUtils = require("../../utils/timeUtils.js");
const authUtils = require("../../utils/authUtils");

Page({
  data: {
    // 登录状态
    isLoggedIn: true, // 默认已登录状态
    // 管理员权限
    isAdmin: false, // 是否为管理员（userType === 999）

    userInfo: {
      nickname: "用户",
      avatar: "👤",
      uid: "U20240101001",
      registerTime: "", // 将通过工具函数动态设置
    },
    menuList: [
      {
        icon: "➕",
        title: "新增账号",
        desc: "添加新的创作账号",
      },
      {
        icon: "👥",
        title: "账号管理",
        desc: "管理现有的创作账号",
      },
      {
        icon: "📝",
        title: "今日数据",
        desc: "每天都要登记的数据",
      },
      // 收益结算 - 暂时隐藏
      // {
      //   icon: "💰",
      //   title: "收益结算",
      //   desc: "查看和管理收益情况",
      // },
      {
        icon: "📄",
        title: "排版工具",
        desc: "文章排版和预览工具",
      },
      {
        icon: "📋",
        title: "合作协议",
        desc: "查看合作协议条款",
      },
      {
        icon: "🗄️",
        title: "数据库测试",
        desc: "测试数据库连接和操作",
        adminOnly: true, // 标记为管理员专用
      },

      {
        icon: "🚪",
        title: "退出登录",
        desc: "安全退出当前账号",
      },
    ],
  },

  // 新增：接收登录结果并更新页面
  applyLoginData: function (loginResult) {
    const ts = loginResult && loginResult.registerTimestamp;
    const timeLabel = timeUtils.formatTime(ts, "YYYY-MM-DD HH:mm");
    
    // 检查用户类型，判断是否为管理员
    const userType = loginResult && loginResult.userType;
    const isAdmin = userType === 999;
    
    this.setData({
      isLoggedIn: true,
      isAdmin: isAdmin, // 设置管理员权限
      "userInfo.nickname":
        (loginResult && loginResult.nickname) || this.data.userInfo.nickname,
      "userInfo.uid":
        (loginResult && loginResult.userId) || this.data.userInfo.uid,
      "userInfo.registerTime": timeLabel,
    });
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
        selected: 2,
      });
    }

    // 检查登录状态
    if (!authUtils.isLoggedIn()) {
      // 未登录状态
      this.setData({
        isLoggedIn: false,
      });
      return;
    }

    // 已登录状态，更新用户信息
    this.setData({
      isLoggedIn: true,
    });

    // 再从全局数据或本地存储获取登录结果并应用，避免被覆盖
    try {
      const app = getApp();
      const loginResult = app && app.globalData && app.globalData.loginResult;
      if (loginResult && loginResult.success) {
        this.applyLoginData(loginResult);
      } else {
        const cached = wx.getStorageSync("loginResult");
        if (cached && cached.success) {
          this.applyLoginData(cached);
        }
      }
    } catch (e) {}
  },

  /**
   * 点击菜单项
   */
  onMenuTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const menu = this.data.menuList[index];

    // 新增账号跳转
    if (menu.title === "新增账号") {
      wx.navigateTo({
        url: "/pages/add-account/add-account",
        success: function () {
          console.log("跳转到添加账号页面");
        },
        fail: function (err) {
          console.error("跳转失败:", err);
          wx.showToast({
            title: "跳转失败，请重试",
            icon: "none",
          });
        },
      });
    } else if (menu.title === "账号管理") {
      wx.navigateTo({
        url: "/pages/account-list/account-list",
        success: function () {
          console.log("跳转到账号列表页面");
        },
        fail: function (err) {
          console.error("跳转失败:", err);
          wx.showToast({
            title: "跳转失败，请重试",
            icon: "none",
          });
        },
      });
    } else if (menu.title === "今日数据") {
      // 跳转到数据中心页面
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
    } else if (menu.title === "收益结算") {
      // 跳转到收益结算页面
      wx.navigateTo({
        url: "/pages/earnings-settlement/earnings-settlement",
        success: function () {
          console.log("跳转到收益结算页面");
        },
        fail: function (err) {
          console.error("跳转失败:", err);
          wx.showToast({
            title: "跳转失败，请重试",
            icon: "none",
          });
        },
      });
    } else if (menu.title === "排版工具") {
      // 跳转到排版工具页面
      wx.navigateTo({
        url: "/pages/layout-tool/layout-tool",
        success: function () {
          console.log("跳转到排版工具页面");
        },
        fail: function (err) {
          console.error("跳转失败:", err);
          wx.showToast({
            title: "跳转失败，请重试",
            icon: "none",
          });
        },
      });
    } else if (menu.title === "合作协议") {
      // 跳转到协议页面
      wx.navigateTo({
        url: "/pages/agreement/agreement",
        success: function () {
          console.log("跳转到协议页面");
        },
        fail: function (err) {
          console.error("跳转失败:", err);
          wx.showToast({
            title: "跳转失败，请重试",
            icon: "none",
          });
        },
      });
    } else if (menu.title === "数据库测试") {
      // 跳转到数据库测试页面
      wx.navigateTo({
        url: "/pages/test-db/test-db",
        success: function () {
          console.log("跳转到数据库测试页面");
        },
        fail: function (err) {
          console.error("跳转失败:", err);
          wx.showToast({
            title: "跳转失败，请重试",
            icon: "none",
          });
        },
      });

    } else if (menu.title === "退出登录") {
      // 显示退出登录确认框
      const that = this; // 保存this引用
      wx.showModal({
        title: "确认退出",
        content: "您确定要退出当前账号登录吗？",
        confirmText: "确认退出",
        cancelText: "取消",
        confirmColor: "#e74c3c",
        success: function (res) {
          if (res.confirm) {
            // 用户确认退出
            console.log("用户确认退出登录");

            // 显示退出中提示
            wx.showLoading({
              title: "退出中...",
              mask: true,
            });

            // 清除登录状态
            authUtils.clearLoginStatus();

            setTimeout(() => {
              wx.hideLoading();

              // 退出成功提示
              wx.showToast({
                title: "已退出登录",
                icon: "success",
                duration: 2000,
              });

              // 跳转到登录页面
              wx.redirectTo({
                url: "/pages/login/login",
                success: () => {
                  console.log("退出登录成功，已跳转到登录页面");
                },
                fail: (err) => {
                  console.error("跳转到登录页面失败:", err);
                },
              });
            }, 1500);
          } else {
            // 用户取消退出
            console.log("用户取消退出登录");
          }
        },
      });
    } else {
      wx.showToast({
        title: menu.title + "功能开发中",
        icon: "none",
      });
    }
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

  /**
   * 点击登录按钮
   */
  onLoginTap: function () {
    console.log("用户点击登录按钮");

    // 跳转到协议页面，传递来源参数和显示按钮参数
    wx.navigateTo({
      url: "/pages/agreement/agreement?from=login&showButtons=true",
      success: function () {
        console.log("跳转到协议页面成功");
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
