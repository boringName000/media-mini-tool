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

Page({
  data: {
    // 当前状态筛选
    currentStatus: null,
    statusDisplayText: "",

    // 状态计数
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,

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

    // 构建所有任务列表
    const allTasks = this.buildTaskList(accounts);
    this.setData({ allTasks });

    // 获取文章详细信息
    this.loadArticleInfo(allTasks);

    // 加载任务列表
    this.loadTaskList();
    this.updateStatusCount();

    this.setData({ loading: false, dataLoaded: true });
  },

  // 构建任务列表
  buildTaskList(accounts) {
    const allTasks = [];

    // 根据当前状态构建不同的任务列表
    if (this.data.currentStatus === TaskStatusEnum.PENDING) {
      // 待发表状态：使用 dailyTasks 数据，显示所有任务
      accounts.forEach((account) => {
        const dailyTasks = account.dailyTasks || [];
        dailyTasks.forEach((task) => {
          const taskObj = {
            taskId: task.articleId, // 直接使用服务器的文章ID
            accountId: account.accountId,
            articleId: task.articleId,
            accountName: account.accountNickname,
            platformEnum: account.platform,
            platformName: getPlatformName(account.platform),
            platformIcon: getPlatformIcon(account.platform),
            trackTypeEnum: account.trackType,
            trackType: getTrackTypeName(account.trackType),
            taskTime: timeUtils.formatTime(task.taskTime, "YYYY-MM-DD", {
              defaultValue: "未知时间",
            }),
            isCompleted: task.isCompleted, // 使用服务器状态，用于UI显示
            status: TaskStatusEnum.PENDING,
            statusText: getTaskStatusName(TaskStatusEnum.PENDING),
            statusClass: getTaskStatusClass(TaskStatusEnum.PENDING),
            // 文章信息占位符，等待从云函数获取
            articleTitle: "加载中...",
            articleDownloadUrl: "",
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
            trackTypeEnum: account.trackType,
            trackType: getTrackTypeName(account.trackType),
            taskTime: timeUtils.formatTime(post.publishTime, "YYYY-MM-DD", {
              defaultValue: "未知时间",
            }),
            isCompleted: true,
            status: TaskStatusEnum.COMPLETED,
            statusText: getTaskStatusName(TaskStatusEnum.COMPLETED),
            statusClass: getTaskStatusClass(TaskStatusEnum.COMPLETED),
            // 文章信息占位符，等待从云函数获取
            articleTitle: "加载中...",
            articleDownloadUrl: "",
          };

          allTasks.push(taskObj);
        });
      });
    } else if (this.data.currentStatus === TaskStatusEnum.REJECTED) {
      // 已拒绝状态：暂时不处理，返回空数组
      console.log("已拒绝状态暂不处理，显示无任务");
    }

    console.log("构建的任务列表:", allTasks);
    return allTasks;
  },

  // 加载任务列表
  loadTaskList() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    // 使用真实数据，一次性加载所有任务
    this.fetchTasksFromServer();
  },

  // 从服务器获取任务数据
  fetchTasksFromServer() {
    // 使用真实数据，一次性加载所有任务
    const filteredTasks = this.filterTasks();

    this.setData({
      taskList: filteredTasks,
      loading: false,
    });

    // 打印调试信息
    console.log("筛选后的任务数量:", filteredTasks.length);
    console.log("加载的任务列表:", filteredTasks);
  },

  // 筛选任务
  filterTasks() {
    // 直接返回构建好的任务列表，因为 buildTaskList 已经根据状态筛选了
    return [...this.data.allTasks];
  },

  // 更新状态计数
  updateStatusCount() {
    const tasks = this.data.allTasks;
    const pendingCount = tasks.filter(
      (task) => task.status === TaskStatusEnum.PENDING
    ).length;
    const completedCount = tasks.filter(
      (task) => task.status === TaskStatusEnum.COMPLETED
    ).length;
    const rejectedCount = tasks.filter(
      (task) => task.status === TaskStatusEnum.REJECTED
    ).length;

    this.setData({
      pendingCount,
      completedCount,
      rejectedCount,
    });
  },

  // 下载任务
  downloadTask(e) {
    const task = e.currentTarget.dataset.task;

    // 检查是否有下载链接
    if (!task.articleDownloadUrl) {
      wx.showToast({
        title: "文章下载链接不可用",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "确认下载",
      content: `确定要下载文章"${task.articleTitle || task.articleId}"吗？`,
      success: (res) => {
        if (res.confirm) {
          this.downloadTaskToServer(task);
        }
      },
    });
  },

  // 回传任务
  uploadTask(e) {
    const task = e.currentTarget.dataset.task;

    // 跳转到回传信息页面
    wx.navigateTo({
      url: `/pages/upload-info/upload-info?taskId=${
        task.taskId
      }&articleId=${encodeURIComponent(
        task.articleId
      )}&accountName=${encodeURIComponent(task.accountName)}`,
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

  // 下载任务到服务器
  downloadTaskToServer(task) {
    wx.showLoading({
      title: "下载中...",
    });

    // 使用真实的下载链接
    if (task.articleDownloadUrl) {
      // 复制下载链接到剪贴板
      wx.setClipboardData({
        data: task.articleDownloadUrl,
        success: () => {
          wx.hideLoading();
          wx.showToast({
            title: "下载链接已复制",
            icon: "success",
          });
        },
        fail: () => {
          wx.hideLoading();
          wx.showToast({
            title: "复制失败",
            icon: "none",
          });
        },
      });
    } else {
      // 如果没有下载链接，显示错误
      wx.hideLoading();
      wx.showToast({
        title: "下载链接不可用",
        icon: "none",
      });
    }
  },

  // 回传任务到服务器
  uploadTaskToServer(task) {
    wx.showLoading({
      title: "回传中...",
    });

    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();

      wx.showToast({
        title: "回传成功",
        icon: "success",
      });
    }, 1500);
  },

  // 获取文章详细信息
  async loadArticleInfo(allTasks) {
    if (!allTasks || allTasks.length === 0) {
      console.log("没有任务需要获取文章信息");
      return;
    }

    // 提取所有文章ID
    const articleIds = allTasks
      .map((task) => task.articleId)
      .filter((id) => id);

    if (articleIds.length === 0) {
      console.log("没有有效的文章ID");
      return;
    }

    console.log("开始获取文章信息，文章ID:", articleIds);

    try {
      // 调用云函数获取文章信息
      const result = await wx.cloud.callFunction({
        name: "get-article-info",
        data: {
          articleIds: articleIds,
        },
      });

      if (result.result && result.result.success) {
        const articles = result.result.data.articles || [];
        console.log("获取到的文章信息:", articles);

        // 更新任务列表中的文章信息
        this.updateTaskListWithArticleInfo(allTasks, articles);
      } else {
        console.error(
          "获取文章信息失败:",
          result.result?.message || "未知错误"
        );
        wx.showToast({
          title: "获取文章信息失败",
          icon: "none",
        });
      }
    } catch (error) {
      console.error("调用获取文章信息云函数失败:", error);
      wx.showToast({
        title: "获取文章信息异常",
        icon: "none",
      });
    }
  },

  // 更新任务列表中的文章信息
  updateTaskListWithArticleInfo(allTasks, articles) {
    // 创建文章信息映射
    const articleMap = {};
    articles.forEach((article) => {
      articleMap[article.articleId] = article;
    });

    // 更新任务列表中的文章信息
    const updatedTasks = allTasks.map((task) => {
      const article = articleMap[task.articleId];
      console.log(`处理任务 ${task.articleId}:`, { task, article });

      if (article) {
        const updatedTask = {
          ...task,
          articleTitle: article.articleTitle || "未知标题",
          articleDownloadUrl: article.downloadUrl || "",
        };
        console.log(`更新后的任务:`, updatedTask);
        return updatedTask;
      } else {
        const updatedTask = {
          ...task,
          articleTitle: "文章信息获取失败",
          articleDownloadUrl: "",
        };
        console.log(`未找到文章信息的任务:`, updatedTask);
        return updatedTask;
      }
    });

    // 更新数据
    this.setData({
      allTasks: updatedTasks,
    });

    // 重新加载任务列表以显示更新后的信息
    this.loadTaskList();
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
