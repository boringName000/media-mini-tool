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
      // 待发表状态：使用 dailyTasks 数据，显示所有任务
      accounts.forEach((account) => {
        const dailyTasks = account.dailyTasks || [];
        dailyTasks.forEach((task) => {
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
      // 已拒绝状态：暂时不处理，返回空数组
      console.log("已拒绝状态暂不处理，显示无任务");
    }

    console.log("构建的任务列表:", allTasks);
    return allTasks;
  },

  // 下载任务
  downloadTask(e) {
    const task = e.currentTarget.dataset.task;

    // 检查是否有下载链接
    if (!task.downloadUrl) {
      wx.showToast({
        title: "文章下载链接不可用",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "确认下载",
      content: `确定要下载文章"${
        task.articleTitle || task.articleId
      }"到本地吗？`,
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

  // 下载任务到服务器
  downloadTaskToServer(task) {
    wx.showLoading({
      title: "下载中...",
    });

    // 使用真实的下载链接
    if (task.downloadUrl) {
      // 保存原始下载链接，用于失败时回退
      const originalDownloadUrl = task.downloadUrl;

      // 下载云存储文件到本地
      wx.cloud.downloadFile({
        fileID: task.downloadUrl,
        success: (res) => {
          wx.hideLoading();

          // 云存储下载成功，保存文件到本地
          this.saveFileToLocal(
            res.tempFilePath,
            task.articleTitle,
            originalDownloadUrl
          );
        },
        fail: (err) => {
          wx.hideLoading();
          console.error("下载失败:", err);

          // 如果云存储下载失败，回退到复制链接的方式
          wx.showModal({
            title: "下载失败",
            content: "云存储文件下载失败，是否复制文件ID到剪贴板？",
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.copyDownloadUrl(originalDownloadUrl);
              }
            },
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

  // 保存文件到本地
  saveFileToLocal(tempFilePath, fileName, originalDownloadUrl) {
    // 生成保存的文件名
    const savedFileName = `${fileName || "文档"}_${Date.now()}.txt`;

    // 构建完整的保存路径
    const savedFilePath = `${wx.env.USER_DATA_PATH}/downloads/${savedFileName}`;

    // 使用文件系统管理器保存文件到本地
    const fs = wx.getFileSystemManager();

    // 先确保 downloads 目录存在
    try {
      fs.mkdirSync(`${wx.env.USER_DATA_PATH}/downloads`, true);
    } catch (e) {
      // 目录可能已存在，忽略错误
      console.log("downloads 目录已存在或创建失败:", e);
    }

    // 使用新的文件系统 API 保存文件
    fs.saveFile({
      tempFilePath: tempFilePath,
      filePath: savedFilePath,
      success: (res) => {
        console.log("文件保存成功:", savedFilePath);

        wx.showToast({
          title: "文件已下载到本地",
          icon: "success",
          duration: 2000,
        });

        // 保存成功后，询问用户是否打开文件
        setTimeout(() => {
          wx.showModal({
            title: "文件下载成功",
            content: "文件已下载到本地，是否立即打开查看？",
            success: (modalRes) => {
              if (modalRes.confirm) {
                this.openSavedFile(savedFilePath, fileName);
              }
            },
          });
        }, 1000);
      },
      fail: (err) => {
        console.error("保存文件失败:", err);

        // 如果保存失败，尝试直接打开临时文件
        wx.showModal({
          title: "下载失败",
          content: "无法保存到本地，是否直接打开文件？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              this.openTempFile(tempFilePath, fileName);
            } else {
              // 用户选择不打开，复制文件ID
              this.copyDownloadUrl(originalDownloadUrl);
            }
          },
        });
      },
    });
  },

  // 打开已保存的文件
  openSavedFile(savedFilePath, fileName) {
    wx.openDocument({
      filePath: savedFilePath,
      fileType: "txt",
      success: () => {
        console.log("文件打开成功");
      },
      fail: (err) => {
        console.error("打开保存的文件失败:", err);
        wx.showToast({
          title: "文件已保存，但无法打开",
          icon: "none",
        });
      },
    });
  },

  // 打开临时文件
  openTempFile(tempFilePath, fileName) {
    wx.openDocument({
      filePath: tempFilePath,
      fileType: "txt",
      success: () => {
        console.log("临时文件打开成功");
      },
      fail: (err) => {
        console.error("打开临时文件失败:", err);
        wx.showToast({
          title: "无法打开文件",
          icon: "none",
        });
      },
    });
  },

  // 获取文件扩展名
  getFileExtension(filePath) {
    const lastDotIndex = filePath.lastIndexOf(".");
    if (lastDotIndex === -1) return "";
    return filePath.substring(lastDotIndex + 1).toLowerCase();
  },

  // 复制文件ID到剪贴板
  copyDownloadUrl(fileID) {
    wx.setClipboardData({
      data: fileID,
      success: () => {
        wx.showToast({
          title: "文件ID已复制",
          icon: "success",
        });
      },
      fail: () => {
        wx.showToast({
          title: "复制失败",
          icon: "none",
        });
      },
    });
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
