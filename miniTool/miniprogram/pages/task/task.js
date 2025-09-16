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
const authUtils = require("../../utils/authUtils");
const userInfoUtils = require("../../utils/userInfoUtils");
const accountUtils = require("../../utils/accountUtils");
const updateDailyTasksUtils = require("../../utils/updateDailyTasksUtils");

Page({
  data: {
    // 任务统计数据
    taskStats: {
      pending: 0, // 待发表
      completed: 0, // 已完成
      rejected: 0, // 已拒绝
    },
    // 账号列表数据
    accountList: [],
    // 加载状态
    isLoading: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 加载用户账号数据
   */
  loadUserAccounts: function () {
    this.setData({
      isLoading: true,
    });

    // 从全局数据获取用户信息
    const app = getApp();
    const loginResult = app.globalData.loginResult;

    if (loginResult && loginResult.success && loginResult.accounts) {
      const accounts = loginResult.accounts;
      console.log("从全局数据获取到用户账号数据:", accounts);

      // 格式化账号数据
      const formattedAccounts = this.formatAccountData(accounts);

      this.setData({
        accountList: formattedAccounts,
        isLoading: false,
      });

      // 更新任务统计数据（这里可以根据实际需求计算）
      this.updateTaskStats(formattedAccounts);
    } else {
      console.log("全局数据中没有账号信息，尝试刷新用户数据");

      // 如果全局数据中没有账号信息，则刷新用户数据
      userInfoUtils
        .getCurrentUserInfo()
        .then((result) => {
          if (result.success && result.userInfo) {
            const accounts = result.userInfo.accounts || [];
            console.log("刷新后获取到用户账号数据:", accounts);

            // 格式化账号数据
            const formattedAccounts = this.formatAccountData(accounts);

            this.setData({
              accountList: formattedAccounts,
              isLoading: false,
            });

            // 更新任务统计数据
            this.updateTaskStats(formattedAccounts);
          } else {
            console.error("获取用户信息失败:", result.error);
            this.setData({
              isLoading: false,
            });
            wx.showToast({
              title: "获取账号信息失败",
              icon: "none",
              duration: 2000,
            });
          }
        })
        .catch((error) => {
          console.error("获取用户信息异常:", error);
          this.setData({
            isLoading: false,
          });
          wx.showToast({
            title: "网络错误，请重试",
            icon: "none",
            duration: 2000,
          });
        });
    }
  },

  /**
   * 格式化账号数据
   */
  formatAccountData: function (accounts) {
    return accounts.map((account) => {
      // 获取平台信息
      const platformEnum =
        parseInt(account.platform) ||
        account.platform ||
        PlatformEnum.WECHAT_MP;
      const platformName = getPlatformName(platformEnum);
      const platformIcon = getPlatformIcon(platformEnum);

      // 获取赛道信息
      const trackTypeEnum =
        parseInt(account.trackType) ||
        account.trackType ||
        TrackTypeEnum.FOOD_TRACK;
      const trackTypeName = getTrackTypeName(trackTypeEnum);
      const trackTypeIcon = getTrackTypeIcon(trackTypeEnum);

      // 计算今日发文数量（统计每日任务数组中已完成的任务）
      const todayArticles = this.calculateTodayArticles(
        account.dailyTasks || []
      );

      // 获取账号状态
      const status = this.getAccountStatus(account);

      return {
        accountId: account.accountId,
        platformEnum: platformEnum,
        platform: platformName,
        platformIcon: platformIcon,
        accountName:
          account.accountNickname || account.originalAccountId || "未命名账号",
        trackTypeEnum: trackTypeEnum,
        trackType: trackTypeName,
        trackIcon: trackTypeIcon,
        todayArticles: todayArticles,
        status: status,
        // 保留原始数据用于其他操作
        originalData: account,
      };
    });
  },

  /**
   * 计算今日发文数量（统计每日任务数组中已完成的任务）
   */
  calculateTodayArticles: function (dailyTasks) {
    if (!dailyTasks || dailyTasks.length === 0) {
      return 0;
    }

    return dailyTasks.filter((task) => {
      // 只检查任务是否完成，云函数已保证是当天的任务
      return task.isCompleted === true;
    }).length;
  },

  /**
   * 获取账号状态
   */
  getAccountStatus: function (account) {
    if (account.status === 0) {
      return "已禁用";
    } else if (account.status === 1) {
      return accountUtils.getAuditStatusText(account.auditStatus);
    }
    return "未知状态";
  },

  /**
   * 更新任务统计数据
   */
  updateTaskStats: function (accounts) {
    const taskStats = {
      pending: 0, // 待发表任务数量（已领取的任务）
      completed: 0, // 已完成任务数量
      rejected: 0, // 已拒绝任务数量（直接给0）
    };

    // 遍历所有账号，统计每日任务数据
    accounts.forEach((account) => {
      const dailyTasks = account.originalData.dailyTasks || [];
      const posts = account.originalData.posts || [];
      const rejectPosts = account.originalData.rejectPosts || [];

      // completed: posts 数组里面的都是已完成
      taskStats.completed += posts.length;

      // rejected: rejectPosts 数组里面的都是已拒绝
      taskStats.rejected += rejectPosts.length; 

      // pending: dailyTasks 每日任务中，已领取但未完成的任务（isClaimed 为 true 且 isCompleted 为 false）
      dailyTasks.forEach((task) => {
        if (task.isClaimed === true && task.isCompleted !== true) {
          taskStats.pending++;
        }
      });
    });

    console.log("任务统计数据:", taskStats);

    this.setData({
      taskStats: taskStats,
    });
  },

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

    // 刷新用户账号数据
    this.loadUserAccounts();
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

    // 构建查询参数，只传递状态参数
    const queryParams = `status=${statusEnum}`;

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

    // 检查账号状态
    if (account.originalData.status === 0) {
      // 如果是禁用状态，弹出提示框
      wx.showModal({
        title: "账号已禁用",
        content: "该账号已被禁用，请联系管理员处理",
        showCancel: false,
        confirmText: "知道了",
      });
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: "更新任务中...",
      mask: true,
    });

    // 调用 updateDailyTasks 不传参数，更新每日任务
    updateDailyTasksUtils
      .updateDailyTasks()
      .then((result) => {
        wx.hideLoading();

        if (result.success) {
          console.log("每日任务更新成功:", result);
        } else {
          console.log("每日任务更新失败:", result.error);
        }

        // 无论更新成功与否，都继续跳转
        this.navigateToArticleList(account);
      })
      .catch((error) => {
        wx.hideLoading();
        console.error("更新每日任务异常:", error);

        // 即使更新失败，也继续跳转
        this.navigateToArticleList(account);
      });
  },

  /**
   * 跳转到文章列表页面
   */
  navigateToArticleList: function (account) {
    wx.navigateTo({
      url: `/pages/article-list/article-list?accountId=${account.accountId}`,
      success: function () {
        console.log(
          `跳转到${account.accountName}的文章列表页面，账号ID：${account.accountId}`
        );
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
