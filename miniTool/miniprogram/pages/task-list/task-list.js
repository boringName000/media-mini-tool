// 任务列表页面逻辑
const {
  PlatformEnum,
  TaskStatusEnum,
  TrackTypeEnum,
} = require("../../type/type");
const {
  getPlatformName,
  getPlatformIcon,
} = require("../../utils/platformUtils");
const { getTrackTypeName } = require("../../utils/trackTypeUtils");
const {
  getTaskStatusName,
  getTaskStatusClass,
} = require("../../utils/taskStatusUtils");
const authUtils = require("../../utils/authUtils");
const userInfoUtils = require("../../utils/userInfoUtils");
const timeUtils = require("../../utils/timeUtils");
const { saveArticleInfo } = require("../../utils/articleInfoManager");

Page({
  data: {
    // 当前状态筛选
    currentStatus: null,
    statusDisplayText: "",

    // 任务列表
    taskList: [],

    // 加载状态
    loading: false,

    // 数据加载状态
    dataLoaded: false,

    // 用户真实数据
    userAccounts: [],
    allTasks: [],
  },

  onLoad(options) {
    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }

    // 从任务页面传入的状态参数
    if (options.status) {
      const status = parseInt(options.status);
      this.setData({
        currentStatus: status,
        statusDisplayText: getTaskStatusName(status),
      });
    }
  },

  onShow() {
    // 页面显示时加载用户数据
    this.loadUserData();
  },

  // 加载用户数据
  loadUserData() {
    this.setData({ loading: true });

    console.log("开始刷新用户数据...");

    // 直接刷新用户数据，获取最新信息
    userInfoUtils
      .getCurrentUserInfo()
      .then((result) => {
        if (result.success && result.userInfo) {
          const accounts = result.userInfo.accounts || [];
          console.log("刷新后获取到用户账号数据:", accounts);

          this.processUserData(accounts);
        } else {
          console.error("获取用户信息失败:", result.error);
          this.setData({
            loading: false,
          });
          wx.showToast({
            title: "获取账号信息失败",
            icon: "none",
          });
        }
      })
      .catch((error) => {
        console.error("获取用户信息异常:", error);
        this.setData({
          loading: false,
        });
        wx.showToast({
          title: "获取账号信息异常",
          icon: "none",
        });
      });
  },

  // 处理用户数据
  processUserData(accounts) {
    // 保存用户账号数据
    this.setData({ userAccounts: accounts });

    // 构建所有任务列表（包含完整的文章信息）
    const allTasks = this.buildTaskList(accounts);
    this.setData({ allTasks });

    // 直接设置任务列表
    this.setData({
      taskList: allTasks,
      loading: false,
      dataLoaded: true,
    });

    // 打印调试信息
    console.log("加载的任务数量:", allTasks.length);
    console.log("加载的任务列表:", allTasks);
  },

  // 构建任务列表
  buildTaskList(accounts) {
    const allTasks = [];

    // 根据当前状态构建不同的任务列表
    if (this.data.currentStatus === TaskStatusEnum.PENDING) {
      // 待发表状态：使用 dailyTasks 数据，只显示已领取的任务
      accounts.forEach((account) => {
        const dailyTasks = account.dailyTasks || [];
        dailyTasks.forEach((task) => {
          // 只显示已领取的任务
          if (!task.isClaimed) {
            return; // 跳过未领取的任务
          }

          // 根据任务完成状态动态设置状态
          const isTaskCompleted = task.isCompleted;
          const taskStatus = isTaskCompleted
            ? TaskStatusEnum.COMPLETED
            : TaskStatusEnum.PENDING;

          const taskObj = {
            taskId: task.articleId, // 直接使用服务器的文章ID
            accountId: account.accountId,
            articleId: task.articleId,
            accountName: account.accountNickname,
            platformEnum: task.platformType || account.platform,
            platformName: getPlatformName(
              task.platformType || account.platform
            ),
            platformIcon: getPlatformIcon(
              task.platformType || account.platform
            ),
            trackTypeEnum: task.trackType || account.trackType,
            trackType: getTrackTypeName(task.trackType || account.trackType),
            taskTime: timeUtils.formatTime(task.taskTime, "YYYY-MM-DD", {
              defaultValue: "未知时间",
            }),
            isCompleted: task.isCompleted, // 使用服务器状态，用于UI显示
            status: taskStatus,
            statusText: getTaskStatusName(taskStatus),
            statusClass: getTaskStatusClass(taskStatus),
            // 直接使用任务中的文章信息
            articleTitle: task.articleTitle || "未知标题",
            downloadUrl: task.downloadUrl || "",
            isClaimed: task.isClaimed, // 添加领取状态字段
          };

          allTasks.push(taskObj);
        });
      });
    } else if (this.data.currentStatus === TaskStatusEnum.COMPLETED) {
      // 已完成状态：使用 posts 数据
      accounts.forEach((account) => {
        const posts = account.posts || [];
        posts.forEach((post) => {
          const taskObj = {
            taskId: post.articleId, // 直接使用服务器的文章ID
            accountId: account.accountId,
            articleId: post.articleId,
            accountName: account.accountNickname,
            platformEnum: account.platform,
            platformName: getPlatformName(account.platform),
            platformIcon: getPlatformIcon(account.platform),
            trackTypeEnum: post.trackType || account.trackType,
            trackType: getTrackTypeName(post.trackType || account.trackType),
            taskTime: timeUtils.formatTime(post.publishTime, "YYYY-MM-DD", {
              defaultValue: "未知时间",
            }),
            isCompleted: true,
            status: TaskStatusEnum.COMPLETED,
            statusText: getTaskStatusName(TaskStatusEnum.COMPLETED),
            statusClass: getTaskStatusClass(TaskStatusEnum.COMPLETED),
            // 直接使用文章中的信息
            articleTitle: post.title || "未知标题",
            downloadUrl: "", // posts 数组中没有 downloadUrl 字段
          };

          allTasks.push(taskObj);
        });
      });
    } else if (this.data.currentStatus === TaskStatusEnum.REJECTED) {
      // 已拒绝状态：使用 rejectPosts 数据
      accounts.forEach((account) => {
        const rejectPosts = account.rejectPosts || [];
        rejectPosts.forEach((post) => {
          const taskObj = {
            taskId: post.articleId, // 直接使用服务器的文章ID
            accountId: account.accountId,
            articleId: post.articleId,
            accountName: account.accountNickname,
            platformEnum: account.platform,
            platformName: getPlatformName(account.platform),
            platformIcon: getPlatformIcon(account.platform),
            trackTypeEnum: post.trackType || account.trackType,
            trackType: getTrackTypeName(post.trackType || account.trackType),
            taskTime: timeUtils.formatTime(post.rejectTime, "YYYY-MM-DD", {
              defaultValue: "未知时间",
            }),
            isCompleted: false, // 已拒绝的任务标记为未完成
            status: TaskStatusEnum.REJECTED,
            statusText: getTaskStatusName(TaskStatusEnum.REJECTED),
            statusClass: getTaskStatusClass(TaskStatusEnum.REJECTED),
            // 直接使用文章中的信息
            articleTitle: post.title || "未知标题",
            downloadUrl: "", // rejectPosts 数组中没有 downloadUrl 字段
            rejectTime: post.rejectTime, // 添加拒绝时间字段
          };

          allTasks.push(taskObj);
        });
      });
    }
  
    console.log("构建的任务列表:", allTasks);
    return allTasks;
  },

  // 保存任务信息
  saveTaskInfo(e) {
    const task = e.currentTarget.dataset.task;

    if (!task.accountId) {
      wx.showToast({
        title: "无法获取账号信息",
        icon: "none",
      });
      return;
    }

    saveArticleInfo({
      downloadUrl: task.downloadUrl,
      articleTitle: task.articleTitle || task.articleId,
      articleId: task.articleId, // 传递文章自己的ID
      accountId: task.accountId, // 传递账号ID
      trackType: task.trackTypeEnum,
      platformType: task.platformEnum,
    });
  },

  // 回传任务
  uploadTask(e) {
    const task = e.currentTarget.dataset.task;

    // 跳转到回传信息页面
    wx.navigateTo({
      url: `/pages/upload-info/upload-info?articleId=${encodeURIComponent(
        task.articleId
      )}&articleTitle=${encodeURIComponent(
        task.articleTitle
      )}&accountName=${encodeURIComponent(
        task.accountName
      )}&accountId=${encodeURIComponent(
        task.accountId
      )}&trackType=${encodeURIComponent(
        task.trackTypeEnum
      )}&platformType=${encodeURIComponent(task.platformEnum)}`,
      success: function () {
        console.log("跳转到回传信息页面");
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

  // 刷新数据
  refreshData() {
    this.setData({
      taskList: [],
      dataLoaded: false, // 重置数据加载状态
    });
    this.loadUserData();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
    wx.stopPullDownRefresh();
  },

  // 上拉刷新
  onReachBottom() {
    // 移除上拉加载更多功能，改为上拉刷新
    this.refreshData();
  },

  // 分享
  onShareAppMessage() {
    return {
      title: "任务列表",
      path: "/pages/task-list/task-list",
    };
  },
});
