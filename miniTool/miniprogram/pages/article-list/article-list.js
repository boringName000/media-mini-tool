// 引入赛道类型工具
const {
  TrackTypeEnum,
  getTrackTypeName,
} = require("../../utils/trackTypeUtils");

const { PlatformEnum, getPlatformName } = require("../../utils/platformUtils");

Page({
  data: {
    // 搜索关键词
    searchKeyword: "",
    // 当前筛选的赛道类型
    currentTrackType: null,
    currentTrackName: "",
    // 文章列表数据
    articleList: [
      {
        id: 1,
        title: "美食探店：隐藏在胡同里的小馆子",
        content: "今天为大家推荐一家藏在胡同深处的宝藏小店，这里的招牌菜...",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
        trackTypeEnum: TrackTypeEnum.FOOD_TRACK,
        trackType: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
        publishTime: "2024-01-15 14:30",
      },
      {
        id: 2,
        title: "旅游攻略：北京三日游完整指南",
        content:
          "计划来北京旅游的朋友们，这篇攻略一定要收藏！涵盖景点、美食、住宿...",
        platformEnum: PlatformEnum.WECHAT_MP,
        platform: getPlatformName(PlatformEnum.WECHAT_MP),
        trackTypeEnum: TrackTypeEnum.TRAVEL_TRACK,
        trackType: getTrackTypeName(TrackTypeEnum.TRAVEL_TRACK),
        publishTime: "2024-01-14 10:15",
      },
      {
        id: 3,
        title: "书法练习：楷书基础笔画详解",
        content:
          "今天跟大家分享楷书的基础笔画练习方法，从横、竖、撇、捺开始...",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
        trackTypeEnum: TrackTypeEnum.CALLIGRAPHY,
        trackType: getTrackTypeName(TrackTypeEnum.CALLIGRAPHY),
        publishTime: "2024-01-13 16:45",
      },
      {
        id: 4,
        title: "摄影技巧：夜景拍摄入门指南",
        content:
          "夜景拍摄一直是摄影爱好者的热门话题，今天分享一些实用的技巧...",
        platformEnum: PlatformEnum.WECHAT_MP,
        platform: getPlatformName(PlatformEnum.WECHAT_MP),
        trackTypeEnum: TrackTypeEnum.PHOTOGRAPHY,
        trackType: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
        publishTime: "2024-01-12 20:00",
      },
      {
        id: 5,
        title: "古董收藏：明清瓷器鉴别要点",
        content: "对于古董收藏爱好者来说，瓷器鉴别是一门重要的学问...",
        platformEnum: PlatformEnum.XIAOHONGSHU,
        platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
        trackTypeEnum: TrackTypeEnum.ANTIQUE,
        trackType: getTrackTypeName(TrackTypeEnum.ANTIQUE),
        publishTime: "2024-01-11 13:20",
      },
    ],
    // 过滤后的文章列表
    filteredArticleList: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 检查是否有赛道类型参数
    if (options.trackType && options.trackName) {
      const trackType = parseInt(options.trackType);
      const trackName = decodeURIComponent(options.trackName);

      this.setData({
        currentTrackType: trackType,
        currentTrackName: trackName,
      });

      // 根据赛道类型过滤文章
      this.filterArticlesByTrackType(trackType);
    } else {
      // 初始化显示所有文章
      this.setData({
        filteredArticleList: this.data.articleList,
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {},

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

    // 根据当前赛道类型过滤
    if (this.data.currentTrackType) {
      this.filterArticlesByTrackType(this.data.currentTrackType);
    } else {
      this.setData({
        filteredArticleList: this.data.articleList,
      });
    }
  },

  /**
   * 根据赛道类型过滤文章
   */
  filterArticlesByTrackType: function (trackType) {
    const filtered = this.data.articleList.filter((article) => {
      return article.trackTypeEnum === trackType;
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
      // 如果没有关键词，根据当前赛道类型过滤
      if (this.data.currentTrackType) {
        this.filterArticlesByTrackType(this.data.currentTrackType);
      } else {
        this.setData({
          filteredArticleList: this.data.articleList,
        });
      }
      return;
    }

    let baseArticles = this.data.articleList;

    // 如果当前有赛道类型筛选，先按赛道类型过滤
    if (this.data.currentTrackType) {
      baseArticles = baseArticles.filter((article) => {
        return article.trackTypeEnum === this.data.currentTrackType;
      });
    }

    const filtered = baseArticles.filter((article) => {
      // 搜索标题和内容
      const titleMatch = article.title
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const contentMatch = article.content
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const platformMatch = article.platform
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const trackMatch = article.trackType
        .toLowerCase()
        .includes(keyword.toLowerCase());

      return titleMatch || contentMatch || platformMatch || trackMatch;
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
      title: `查看文章: ${article.title}`,
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
      data: article.title,
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
    const content = `文章标题：${article.title}\n\n文章内容：\n${article.content}\n\n平台：${article.platform}\n赛道：${article.trackType}\n发布时间：${article.publishTime}`;

    wx.setClipboardData({
      data: content,
      success: function () {
        wx.showToast({
          title: "文章内容已复制到剪贴板",
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
    // 模拟刷新数据
    setTimeout(() => {
      wx.stopPullDownRefresh();
      wx.showToast({
        title: "刷新成功",
        icon: "success",
      });
      // 重新过滤文章
      this.filterArticles(this.data.searchKeyword);
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
