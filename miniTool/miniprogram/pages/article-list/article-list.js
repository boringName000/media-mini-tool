// 引入赛道类型工具
const {
  TrackTypeEnum,
  getTrackTypeName,
} = require("../../utils/trackTypeUtils");

const { PlatformEnum, getPlatformName } = require("../../utils/platformUtils");
const timeUtils = require("../../utils/timeUtils");
const { saveArticleInfo } = require("../../utils/articleInfoManager");

Page({
  data: {
    // 搜索关键词
    searchKeyword: "",
    // 当前筛选的赛道类型
    currentTrackType: null,
    currentTrackName: "",
    // 当前筛选的平台类型
    currentPlatformType: null,
    currentPlatformName: "",
    // 当前账号ID
    currentAccountId: null,
    // 页面类型：'account' 表示通过账号ID进入，'track' 表示通过赛道类型进入
    pageType: null,
    // 文章列表数据
    articleList: [],
    // 过滤后的文章列表
    filteredArticleList: [],
    // 加载状态
    isLoading: false,
  },

  // 页面内存缓存，用于存储不同参数组合的文章数据
  articleCache: new Map(),

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 优先检查账号ID参数
    if (options.accountId) {
      console.log("通过账号ID加载文章列表，账号ID:", options.accountId);
      this.setData({
        pageType: "account",
      });
      this.loadArticlesByAccountId(options.accountId);
      return;
    }

    // 接收参数
    if (options.trackType && options.platformType) {
      const trackType = parseInt(options.trackType);
      const platformType = parseInt(options.platformType);

      // 使用工具函数获取显示名称
      const trackName = getTrackTypeName(trackType);
      const platformName = getPlatformName(platformType);

      this.setData({
        pageType: "track",
        currentTrackType: trackType,
        currentTrackName: trackName,
        currentPlatformType: platformType,
        currentPlatformName: platformName,
        isLoading: true,
      });
    } else {
      // 没有参数时显示空状态
      this.setData({
        pageType: null,
        filteredArticleList: [],
        isLoading: false,
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 刷新页面数据
   */
  refreshPageData: function () {
    const pageType = this.data.pageType;

    if (pageType === "account") {
      // 通过账号ID进入的情况，重新加载账号文章列表
      const currentAccountId = this.data.currentAccountId;
      if (currentAccountId) {
        console.log(
          "页面显示时重新加载账号文章列表，账号ID:",
          currentAccountId
        );
        this.loadArticlesByAccountId(currentAccountId);
      }
    } else if (pageType === "track") {
      // 通过赛道类型进入的情况，重新加载赛道文章列表
      const trackType = this.data.currentTrackType;
      const platformType = this.data.currentPlatformType;
      console.log(
        "页面显示时重新加载赛道文章列表，赛道类型:",
        trackType,
        "平台类型:",
        platformType
      );
      this.loadArticlesFromCloud(trackType, platformType);
    }
    // 如果 pageType 为 null，说明没有有效参数，不需要刷新
  },

  /**
   * 通过账号ID加载文章列表（从每日任务中获取）
   */
  loadArticlesByAccountId: function (accountId) {
    const that = this;

    this.setData({
      isLoading: true,
    });

    // 从全局数据获取用户信息
    const app = getApp();
    const loginResult = app.globalData.loginResult;

    if (loginResult && loginResult.success && loginResult.accounts) {
      const accounts = loginResult.accounts;

      // 查找指定账号ID的账号
      const targetAccount = accounts.find(
        (account) => account.accountId === accountId
      );

      if (targetAccount) {
        console.log("找到目标账号:", targetAccount);

        // 获取账号的每日任务
        const dailyTasks = targetAccount.dailyTasks || [];

        // 将每日任务转换为文章列表格式
        const articles = dailyTasks.map((task) => {
          return {
            articleId: task.articleId,
            articleTitle: task.articleTitle,
            trackType: task.trackType,
            platformType: task.platformType,
            downloadUrl: task.downloadUrl,
            uploadTime: task.taskTime, // 使用任务时间作为上传时间
            platform: getPlatformName(task.platformType),
            trackTypeName: getTrackTypeName(task.trackType),
            uploadTimeFormatted: timeUtils.formatTime(
              task.taskTime,
              "YYYY-MM-DD"
            ),
            // 添加任务相关字段
            isClaimed: task.isClaimed,
            isCompleted: task.isCompleted,
            taskTime: task.taskTime,
          };
        });

        // 设置页面标题
        const trackName = getTrackTypeName(targetAccount.trackType);
        const platformName = getPlatformName(targetAccount.platform);

        this.setData({
          currentAccountId: accountId,
          currentTrackType: targetAccount.trackType,
          currentTrackName: trackName,
          currentPlatformType: targetAccount.platform,
          currentPlatformName: platformName,
          articleList: articles,
          filteredArticleList: articles,
          isLoading: false,
        });

        // 设置页面标题
        wx.setNavigationBarTitle({
          title: `${targetAccount.accountNickname} - 每日文章`,
        });
      } else {
        console.error("未找到指定账号ID的账号:", accountId);
        this.setData({
          isLoading: false,
        });
        wx.showToast({
          title: "未找到指定账号",
          icon: "none",
          duration: 2000,
        });
      }
    } else {
      console.error("全局数据中没有用户信息");
      this.setData({
        isLoading: false,
      });
      wx.showToast({
        title: "获取用户信息失败",
        icon: "none",
        duration: 2000,
      });
    }
  },

  /**
   * 从云函数获取文章数据
   */
  loadArticlesFromCloud: function (trackType, platformType) {
    const that = this;

    // 生成缓存key
    const cacheKey = `${trackType}-${platformType}`;

    // 检查缓存中是否已有数据
    if (this.articleCache.has(cacheKey)) {
      console.log("从缓存中获取文章数据");
      const cachedData = this.articleCache.get(cacheKey);

      this.setData({
        articleList: cachedData,
        filteredArticleList: cachedData,
        isLoading: false,
      });
      return;
    }

    console.log("调用云函数获取文章数据");
    wx.cloud.callFunction({
      name: "get-article-info",
      data: {
        trackType: trackType,
        platformType: platformType,
      },
      success: function (res) {
        if (res.result && res.result.success) {
          console.log("✅ 云函数调用成功");
          const articles = res.result.data.articles || [];

          // 处理文章数据，添加显示名称
          const processedArticles = articles.map((article) => {
            return {
              ...article,
              platform: getPlatformName(article.platformType),
              trackTypeName: getTrackTypeName(article.trackType),
              // 格式化上传时间
              uploadTimeFormatted: timeUtils.formatTime(
                article.uploadTime,
                "YYYY-MM-DD"
              ),
            };
          });

          // 将数据存储到缓存中
          that.articleCache.set(cacheKey, processedArticles);

          that.setData({
            articleList: processedArticles,
            filteredArticleList: processedArticles,
            isLoading: false,
          });
        } else {
          console.error("❌ 云函数返回错误:", res.result);
          that.setData({
            isLoading: false,
          });
          wx.showToast({
            title: res.result?.message || "获取文章失败",
            icon: "none",
            duration: 2000,
          });
        }
      },
      fail: function (err) {
        console.error("❌ 云函数调用失败:", err);
        that.setData({
          isLoading: false,
        });
        wx.showToast({
          title: "网络错误，请重试",
          icon: "none",
          duration: 2000,
        });
      },
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 页面显示时重新加载数据，确保数据是最新的
    this.refreshPageData();
  },

  /**
   * 清除指定参数的缓存
   */
  clearCache: function (trackType, platformType) {
    const cacheKey = `${trackType}-${platformType}`;
    if (this.articleCache.has(cacheKey)) {
      this.articleCache.delete(cacheKey);
    }
  },

  /**
   * 清除所有缓存
   */
  clearAllCache: function () {
    this.articleCache.clear();
  },

  /**
   * 搜索输入事件
   */
  onSearchInput: function (e) {
    const keyword = e.detail.value;
    this.setData({
      searchKeyword: keyword,
    });
    this.filterArticles(keyword);
  },

  /**
   * 搜索确认事件
   */
  onSearchConfirm: function (e) {
    const keyword = e.detail.value;
    this.filterArticles(keyword);
  },

  /**
   * 清除搜索
   */
  onClearSearch: function () {
    this.setData({
      searchKeyword: "",
    });

    // 根据当前赛道类型和平台类型过滤
    if (this.data.currentTrackType && this.data.currentPlatformType) {
      this.filterArticlesByTrackAndPlatform(
        this.data.currentTrackType,
        this.data.currentPlatformType
      );
    } else if (this.data.currentTrackType) {
      this.filterArticlesByTrackType(this.data.currentTrackType);
    } else {
      this.setData({
        filteredArticleList: this.data.articleList,
      });
    }
  },

  /**
   * 根据赛道类型和平台类型过滤文章
   */
  filterArticlesByTrackAndPlatform: function (trackType, platformType) {
    const filtered = this.data.articleList.filter((article) => {
      return (
        article.trackType === trackType && article.platformType === platformType
      );
    });

    this.setData({
      filteredArticleList: filtered,
    });
  },

  /**
   * 根据赛道类型过滤文章（保留原有方法用于兼容）
   */
  filterArticlesByTrackType: function (trackType) {
    const filtered = this.data.articleList.filter((article) => {
      return article.trackType === trackType;
    });

    this.setData({
      filteredArticleList: filtered,
    });
  },

  /**
   * 过滤文章
   */
  filterArticles: function (keyword) {
    if (!keyword || keyword.trim() === "") {
      // 如果没有关键词，根据当前赛道类型和平台类型过滤
      if (this.data.currentTrackType && this.data.currentPlatformType) {
        this.filterArticlesByTrackAndPlatform(
          this.data.currentTrackType,
          this.data.currentPlatformType
        );
      } else if (this.data.currentTrackType) {
        this.filterArticlesByTrackType(this.data.currentTrackType);
      } else {
        this.setData({
          filteredArticleList: this.data.articleList,
        });
      }
      return;
    }

    let baseArticles = this.data.articleList;

    // 如果当前有赛道类型和平台类型筛选，先按这两个条件过滤
    if (this.data.currentTrackType && this.data.currentPlatformType) {
      baseArticles = baseArticles.filter((article) => {
        return (
          article.trackType === this.data.currentTrackType &&
          article.platformType === this.data.currentPlatformType
        );
      });
    } else if (this.data.currentTrackType) {
      // 如果只有赛道类型筛选，按赛道类型过滤
      baseArticles = baseArticles.filter((article) => {
        return article.trackType === this.data.currentTrackType;
      });
    }

    const filtered = baseArticles.filter((article) => {
      // 搜索标题和内容
      const titleMatch = article.articleTitle
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const platformMatch = article.platform
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const trackMatch = article.trackTypeName
        .toLowerCase()
        .includes(keyword.toLowerCase());

      return titleMatch || platformMatch || trackMatch;
    });

    this.setData({
      filteredArticleList: filtered,
    });
  },

  /**
   * 点击下载按钮
   */
  onDownloadTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const type = e.currentTarget.dataset.type;
    const article = this.data.filteredArticleList[index];

    if (type === "title") {
      // 复制标题
      this.downloadTitle(article);
    } else if (type === "article") {
      // 检查下载限制
      if (!this.checkDownloadPermission(article)) {
        return;
      }
      // 保存文章信息
      this.saveArticleInfo(article);
    }
  },

  /**
   * 检查下载权限
   */
  checkDownloadPermission: function (article) {
    const pageType = this.data.pageType;

    if (pageType === "track") {
      // 通过赛道类型进入的情况，不允许下载
      const trackName = this.data.currentTrackName;
      wx.showModal({
        title: "无法下载",
        content: `您还没有添加${trackName}类型的账号，请添加后再来领取吧`,
        showCancel: false,
        confirmText: "知道了",
      });
      return false;
    }

    if (pageType === "account") {
      // 通过账号ID进入的情况，检查是否有已领取的文章
      const hasClaimedTasks = this.data.articleList.some(
        (item) => item.isClaimed === true
      );

      if (hasClaimedTasks) {
        // 有已领取的文章，只能下载已领取的文章
        if (!article.isClaimed) {
          wx.showModal({
            title: "无法下载",
            content: "今天已经领取文章，请明天再来下载吧",
            showCancel: false,
            confirmText: "知道了",
          });
          return false;
        }
      }
      // 没有已领取的文章，可以下载任何文章
    }

    return true;
  },

  /**
   * 复制标题
   */
  downloadTitle: function (article) {
    wx.setClipboardData({
      data: article.articleTitle,
      success: function () {
        wx.showToast({
          title: "标题已复制到剪贴板",
          icon: "success",
        });
      },
      fail: function () {
        wx.showToast({
          title: "复制失败",
          icon: "none",
        });
      },
    });
  },

  /**
   * 保存文章信息
   */
  saveArticleInfo: function (article) {
    // 获取当前账号ID
    const currentAccountId = this.data.currentAccountId;

    if (!currentAccountId) {
      wx.showToast({
        title: "无法获取账号信息",
        icon: "none",
      });
      return;
    }

    saveArticleInfo({
      downloadUrl: article.downloadUrl,
      articleTitle: article.articleTitle,
      articleId: article.articleId, // 使用正确的文章ID字段
      accountId: currentAccountId, // 传递账号ID
      trackType: this.data.currentTrackType,
      platformType: this.data.currentPlatformType,
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
   * 查找文件的最新版本
   */
  findLatestFileVersion: function (originalFileID, callback) {
    // 从原始文件ID中提取路径信息
    const pathMatch = originalFileID.match(/cloud:\/\/[^\/]+\/(.+)/);
    if (!pathMatch) {
      callback(false);
      return;
    }

    const filePath = pathMatch[1];
    const pathParts = filePath.split("/");
    const fileName = pathParts[pathParts.length - 1];

    // 尝试查找同目录下的最新文件（未来可扩展）
    this.searchLatestFileInDirectory(
      pathParts.slice(0, -1).join("/"),
      fileName,
      callback
    );
  },

  /**
   * 在目录中搜索最新文件
   */
  searchLatestFileInDirectory: function (directory, baseFileName, callback) {
    wx.showModal({
      title: "文件已更新",
      content:
        "云存储中的文件已更新，但数据库中的记录还未同步。\n\n请联系管理员更新文件记录，或稍后重试。",
      showCancel: false,
      confirmText: "知道了",
    });

    callback(false);
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    // 清除当前参数的缓存
    if (this.data.currentTrackType && this.data.currentPlatformType) {
      this.clearCache(
        this.data.currentTrackType,
        this.data.currentPlatformType
      );
    }

    // 重新获取数据
    if (this.data.currentTrackType && this.data.currentPlatformType) {
      this.loadArticlesFromCloud(
        this.data.currentTrackType,
        this.data.currentPlatformType
      );
    }

    // 停止下拉刷新动画
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: "刷新成功",
        icon: "success",
      });
    }, 1000);
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: "文章列表",
      path: "/pages/article-list/article-list",
    };
  },
});
