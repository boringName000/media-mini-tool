// 引入用户时间工具
const userTime = require("../../utils/userTime.js");

Page({
  data: {
    // 登录状态
    isLoggedIn: true, // 默认已登录状态

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
      {
        icon: "💰",
        title: "收益结算",
        desc: "查看和管理收益情况",
      },
      {
        icon: "📋",
        title: "合作协议",
        desc: "查看合作协议条款",
      },
      {
        icon: "🚪",
        title: "退出登录",
        desc: "安全退出当前账号",
      },
    ],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadUserInfo();
  },

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
    // 刷新用户信息
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo: function () {
    // 从工具文件获取用户注册时间字符串（用于显示）
    const registerTime = userTime.getUserRegisterTimeString();

    this.setData({
      "userInfo.registerTime": registerTime,
    });
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

            // 模拟退出登录过程
            setTimeout(() => {
              wx.hideLoading();

              // 退出成功提示
              wx.showToast({
                title: "已退出登录",
                icon: "success",
                duration: 2000,
              });

              // 设置登录状态为未登录
              that.setData({
                isLoggedIn: false,
              });

              // 这里可以添加实际的退出登录逻辑
              // 比如清除本地存储的用户信息、跳转到登录页面等
              console.log("退出登录成功");

              // 示例：清除用户信息
              // wx.removeStorageSync('userInfo');
              // wx.removeStorageSync('token');

              // 示例：跳转到登录页面
              // wx.reLaunch({
              //   url: '/pages/login/login'
              // });
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
