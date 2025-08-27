// 引入赛道类型工具
const {
  TrackTypeEnum,
  getTrackTypeName,
} = require("../../utils/trackTypeUtils");

const { PlatformEnum, getPlatformName } = require("../../utils/platformUtils");
const timeUtils = require("../../utils/timeUtils");

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
    console.log("文章列表页面接收到的参数:", options);

    // 检查是否有赛道类型和平台类型参数
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
    console.log("检查缓存，key:", cacheKey);

    // 检查缓存中是否已有数据
    if (this.articleCache.has(cacheKey)) {
      console.log("从缓存中获取文章数据");
      const cachedData = this.articleCache.get(cacheKey);

      this.setData({
        articleList: cachedData,
        filteredArticleList: cachedData,
        isLoading: false,
      });

      console.log("缓存数据加载完成，共", cachedData.length, "篇");
      return;
    }

    console.log("缓存中无数据，调用云函数获取文章数据:", {
      trackType,
      platformType,
    });

    wx.cloud.callFunction({
      name: "get-article-info",
      data: {
        trackType: trackType,
        platformType: platformType,
      },
      success: function (res) {
        console.log("云函数调用成功:", res);

        if (res.result && res.result.success) {
          const articles = res.result.data.articles || [];
          console.log("获取到文章数据:", articles);

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
          console.log("文章数据已缓存，key:", cacheKey);

          that.setData({
            articleList: processedArticles,
            filteredArticleList: processedArticles,
            isLoading: false,
          });

          console.log("文章数据加载完成，共", processedArticles.length, "篇");
        } else {
          console.error("云函数返回错误:", res.result);
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
        console.error("云函数调用失败:", err);
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
      console.log("已清除缓存，key:", cacheKey);
    }
  },

  /**
   * 清除所有缓存
   */
  clearAllCache: function () {
    this.articleCache.clear();
    console.log("已清除所有缓存");
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
   * 点击文章项
   */
  onArticleTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const article = this.data.filteredArticleList[index];

    wx.showToast({
      title: `查看文章: ${article.articleTitle}`,
      icon: "none",
    });

    // 这里可以添加跳转到文章详情页面的逻辑
    console.log("点击了文章:", article);
  },

  /**
   * 点击下载按钮
   */
  onDownloadTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const type = e.currentTarget.dataset.type;
    const article = this.data.filteredArticleList[index];

    if (type === "title") {
      // 下载标题
      this.downloadTitle(article);
    } else if (type === "article") {
      // 下载文章
      this.downloadArticle(article);
    }
  },

  /**
   * 下载标题
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
    const content = `文章标题：${article.articleTitle}\n\n平台：${article.platform}\n赛道：${article.trackTypeName}\n上传时间：${article.uploadTimeFormatted}\n下载地址：${article.downloadUrl}`;

    wx.setClipboardData({
      data: content,
      success: function () {
        wx.showToast({
          title: "文章信息已复制到剪贴板",
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
