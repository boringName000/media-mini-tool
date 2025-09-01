// 引入赛道类型工具
const {
  TrackTypeEnum,
  getTrackTypeName,
} = require("../../utils/trackTypeUtils");

const { PlatformEnum, getPlatformName } = require("../../utils/platformUtils");
const timeUtils = require("../../utils/timeUtils");
const { downloadArticle } = require("../../utils/articleDownloadUtils");

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
    // 接收参数
    if (options.trackType && options.platformType) {
      const trackType = parseInt(options.trackType);
      const platformType = parseInt(options.platformType);

      // 使用工具函数获取显示名称
      const trackName = getTrackTypeName(trackType);
      const platformName = getPlatformName(platformType);

      this.setData({
        currentTrackType: trackType,
        currentTrackName: trackName,
        currentPlatformType: platformType,
        currentPlatformName: platformName,
        isLoading: true,
      });
    } else {
      // 没有参数时显示空状态
      this.setData({
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
    // 如果有赛道类型和平台类型参数，调用云函数获取数据
    if (this.data.currentTrackType && this.data.currentPlatformType) {
      this.loadArticlesFromCloud(
        this.data.currentTrackType,
        this.data.currentPlatformType
      );
    }
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
      // 下载文章文件
      this.downloadArticle(article);
    }
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
   * 下载文章
   */
  downloadArticle: function (article) {
    downloadArticle({
      downloadUrl: article.downloadUrl,
      articleTitle: article.articleTitle,
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
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    wx.showToast({
      title: "加载更多...",
      icon: "loading",
    });
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
