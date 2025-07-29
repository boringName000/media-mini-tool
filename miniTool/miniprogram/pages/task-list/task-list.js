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

Page({
  data: {
    // 当前状态筛选
    currentStatus: null,
    statusDisplayText: "",

    // 筛选参数
    accountIds: [],
    platformEnums: [],
    trackTypeEnums: [],

    // 状态计数
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,

    // 任务列表
    taskList: [],

    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,

    // 数据加载状态
    dataLoaded: false,

    // 模拟任务数据
    mockTasks: [
      {
        taskId: "TASK001",
        accountId: "ACC001", // 对应美食达人小红账号
        title: "美食探店分享",
        description: "探店新开业的网红餐厅，分享美食体验和店铺环境",
        accountName: "美食达人小红",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platformName: getPlatformName(PlatformEnum.XIAOHONGSHU),
        platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
        trackTypeEnum: TrackTypeEnum.FOOD_TRACK,
        trackType: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
        status: TaskStatusEnum.COMPLETED,
        statusText: getTaskStatusName(TaskStatusEnum.COMPLETED),
        statusClass: getTaskStatusClass(TaskStatusEnum.COMPLETED),
      },
      {
        taskId: "TASK002",
        accountId: "ACC002", // 对应旅游探索者账号
        title: "旅游景点推荐",
        description: "推荐热门旅游景点，分享旅行攻略和美景照片",
        accountName: "旅游探索者",
        platformEnum: PlatformEnum.WECHAT_MP,
        platformName: getPlatformName(PlatformEnum.WECHAT_MP),
        platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
        trackTypeEnum: TrackTypeEnum.TRAVEL_TRACK,
        trackType: getTrackTypeName(TrackTypeEnum.TRAVEL_TRACK),
        status: TaskStatusEnum.COMPLETED,
        statusText: getTaskStatusName(TaskStatusEnum.COMPLETED),
        statusClass: getTaskStatusClass(TaskStatusEnum.COMPLETED),
      },
      {
        taskId: "TASK003",
        accountId: "ACC003", // 对应书法艺术家账号
        title: "书法作品展示",
        description: "展示最新创作的书法作品，分享书法技巧和心得",
        accountName: "书法艺术家",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platformName: getPlatformName(PlatformEnum.XIAOHONGSHU),
        platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
        trackTypeEnum: TrackTypeEnum.CALLIGRAPHY,
        trackType: getTrackTypeName(TrackTypeEnum.CALLIGRAPHY),
        status: TaskStatusEnum.REJECTED,
        statusText: getTaskStatusName(TaskStatusEnum.REJECTED),
        statusClass: getTaskStatusClass(TaskStatusEnum.REJECTED),
      },
      {
        taskId: "TASK004",
        accountId: "ACC004", // 对应摄影师小李账号
        title: "摄影作品分享",
        description: "分享最新拍摄的摄影作品，展示摄影技巧和构图心得",
        accountName: "摄影师小李",
        platformEnum: PlatformEnum.WECHAT_MP,
        platformName: getPlatformName(PlatformEnum.WECHAT_MP),
        platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
        trackTypeEnum: TrackTypeEnum.PHOTOGRAPHY,
        trackType: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
        status: TaskStatusEnum.PENDING,
        statusText: getTaskStatusName(TaskStatusEnum.PENDING),
        statusClass: getTaskStatusClass(TaskStatusEnum.PENDING),
      },
      {
        taskId: "TASK005",
        accountId: "ACC002", // 对应旅游探索者账号
        title: "推广新款智能手机",
        description: "需要发布关于新款智能手机的推广内容，突出产品特色和优势",
        accountName: "旅游探索者",
        platformEnum: PlatformEnum.WECHAT_MP,
        platformName: getPlatformName(PlatformEnum.WECHAT_MP),
        platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
        trackTypeEnum: TrackTypeEnum.TECH_DIGITAL,
        trackType: getTrackTypeName(TrackTypeEnum.TECH_DIGITAL),
        status: TaskStatusEnum.PENDING,
        statusText: getTaskStatusName(TaskStatusEnum.PENDING),
        statusClass: getTaskStatusClass(TaskStatusEnum.PENDING),
      },
      {
        taskId: "TASK006",
        accountId: "ACC005", // 对应古董收藏家账号
        title: "古董鉴赏分享",
        description: "分享古董鉴赏知识，展示珍贵收藏品的历史价值",
        accountName: "古董收藏家",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platformName: getPlatformName(PlatformEnum.XIAOHONGSHU),
        platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
        trackTypeEnum: TrackTypeEnum.ANTIQUE,
        trackType: getTrackTypeName(TrackTypeEnum.ANTIQUE),
        status: TaskStatusEnum.COMPLETED,
        statusText: getTaskStatusName(TaskStatusEnum.COMPLETED),
        statusClass: getTaskStatusClass(TaskStatusEnum.COMPLETED),
      },
    ],
  },

  onLoad(options) {
    // 从任务页面传入的状态参数
    if (options.status) {
      const status = parseInt(options.status);
      this.setData({
        currentStatus: status,
        statusDisplayText: getTaskStatusName(status),
      });
    }

    // 解析账号相关参数
    if (options.accountIds) {
      const accountIds = decodeURIComponent(options.accountIds).split(",");
      this.setData({ accountIds });
    }

    if (options.platformEnums) {
      const platformEnums = decodeURIComponent(options.platformEnums)
        .split(",")
        .map(Number);
      this.setData({ platformEnums });
    }

    if (options.trackTypeEnums) {
      const trackTypeEnums = decodeURIComponent(options.trackTypeEnums)
        .split(",")
        .map(Number);
      this.setData({ trackTypeEnums });
    }

    this.loadTaskList();
    this.updateStatusCount();
  },

  onShow() {
    // 页面显示时，如果数据未加载过才重新加载数据
    if (!this.data.dataLoaded) {
      this.loadTaskList();
      this.updateStatusCount();
    }
  },

  // 加载任务列表
  loadTaskList() {
    if (this.data.loading || !this.data.hasMore) return;

    this.setData({ loading: true });

    // 构建API请求参数
    const requestParams = {
      page: this.data.page,
      pageSize: this.data.pageSize,
      status: this.data.currentStatus,
    };

    // 如果有账号ID参数，添加到请求中
    if (this.data.accountIds && this.data.accountIds.length > 0) {
      requestParams.accountIds = this.data.accountIds;
    }

    // 模拟API调用
    this.fetchTasksFromServer(requestParams);
  },

  // 从服务器获取任务数据
  fetchTasksFromServer(params) {
    // 模拟API调用
    setTimeout(() => {
      const filteredTasks = this.filterTasks();
      const startIndex = (this.data.page - 1) * this.data.pageSize;
      const endIndex = startIndex + this.data.pageSize;
      const pageTasks = filteredTasks.slice(startIndex, endIndex);

      this.setData({
        taskList:
          this.data.page === 1
            ? pageTasks
            : [...this.data.taskList, ...pageTasks],
        hasMore: endIndex < filteredTasks.length,
        page: this.data.page + 1,
        loading: false,
        dataLoaded: true, // 标记数据已加载
      });

      // 打印请求参数，用于调试
      console.log("请求任务列表参数:", params);
      console.log("筛选后的任务数量:", filteredTasks.length);
      console.log("当前页任务数量:", pageTasks.length);
    }, 500);
  },

  // 筛选任务
  filterTasks() {
    let tasks = [...this.data.mockTasks];

    // 按状态筛选
    if (this.data.currentStatus !== null) {
      tasks = tasks.filter((task) => task.status === this.data.currentStatus);
    }

    // 按账号ID筛选（如果有传入账号ID参数）
    if (this.data.accountIds && this.data.accountIds.length > 0) {
      // 优先按账号ID进行精确筛选
      tasks = tasks.filter((task) =>
        this.data.accountIds.includes(task.accountId)
      );
    } else {
      // 如果没有账号ID，则按平台和赛道类型筛选
      if (this.data.platformEnums && this.data.platformEnums.length > 0) {
        tasks = tasks.filter((task) =>
          this.data.platformEnums.includes(task.platformEnum)
        );
      }

      if (this.data.trackTypeEnums && this.data.trackTypeEnums.length > 0) {
        tasks = tasks.filter((task) =>
          this.data.trackTypeEnums.includes(task.trackTypeEnum)
        );
      }
    }

    return tasks;
  },

  // 更新状态计数
  updateStatusCount() {
    const tasks = this.data.mockTasks;
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

    wx.showModal({
      title: "确认下载",
      content: `确定要下载任务"${task.title}"吗？`,
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
      }&taskTitle=${encodeURIComponent(
        task.title
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

    // 模拟API调用
    setTimeout(() => {
      wx.hideLoading();

      wx.showToast({
        title: "下载成功",
        icon: "success",
      });
    }, 1500);
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

  // 刷新数据
  refreshData() {
    this.setData({
      page: 1,
      taskList: [],
      hasMore: true,
      dataLoaded: false, // 重置数据加载状态
    });
    this.loadTaskList();
    this.updateStatusCount();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshData();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadTaskList();
  },

  // 分享
  onShareAppMessage() {
    return {
      title: "任务列表",
      path: "/pages/task-list/task-list",
    };
  },
});
