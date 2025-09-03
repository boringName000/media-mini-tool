// pages/layout-tool/layout-tool.js
const timeUtils = require("../../utils/timeUtils.js");
const {
  getArticleInfoList,
  deleteArticleInfo,
  clearAllArticleInfo,
} = require("../../utils/articleInfoManager.js");
const { getTrackTypeName } = require("../../utils/trackTypeUtils.js");
const { getPlatformName } = require("../../utils/platformUtils.js");

Page({
  data: {
    // 文章信息列表
    articleInfoList: [],
  },

  onLoad: function (options) {
    // 页面加载
    // 页面加载时自动获取已保存的文章信息列表
    this.loadArticleInfoList();
  },

  onShow: function () {
    // 页面显示时刷新文章信息列表
    this.loadArticleInfoList();
  },

  // 加载已保存的文章信息列表
  loadArticleInfoList: function () {
    console.log("加载本地文章信息列表");

    try {
      const articleList = getArticleInfoList();

      // 处理文章信息，添加显示用的时间格式化和名称
      const processedList = articleList.map((article) => {
        return {
          ...article,
          // 格式化下载时间
          downloadTimeFormatted: timeUtils.formatTime(
            article.downloadTime,
            "YYYY-MM-DD HH:mm",
            { defaultValue: "未知时间" }
          ),
          // 格式化创建时间
          createTimeFormatted: timeUtils.formatTime(
            article.createTime,
            "YYYY-MM-DD HH:mm",
            { defaultValue: "未知时间" }
          ),
          // 获取赛道类型和平台类型的显示名称
          trackTypeName: getTrackTypeName(article.trackType),
          platformTypeName: getPlatformName(article.platformType),
        };
      });

      // 按下载时间从新到旧排序
      processedList.sort((a, b) => b.downloadTime - a.downloadTime);

      this.setData({
        articleInfoList: processedList,
      });

      console.log(`✅ 加载了 ${processedList.length} 条文章信息`);
    } catch (error) {
      console.error("❌ 加载文章信息失败:", error);
      this.setData({
        articleInfoList: [],
      });
    }
  },

  // 预览文章
  previewArticle: function (e) {
    const article = e.currentTarget.dataset.article;

    if (!article || !article.downloadUrl) {
      wx.showToast({
        title: "文章下载地址无效",
        icon: "none",
      });
      return;
    }

    console.log("预览文章:", article);

    // 跳转到文章预览页面，传递文章标题和下载地址
    wx.navigateTo({
      url: `/pages/article-preview/article-preview?articleTitle=${encodeURIComponent(
        article.title
      )}&downloadUrl=${encodeURIComponent(article.downloadUrl)}`,
      success: () => {
        console.log("✅ 跳转到文章预览页面成功");
      },
      fail: (err) => {
        console.error("❌ 跳转到文章预览页面失败:", err);
        wx.showToast({
          title: "页面跳转失败",
          icon: "none",
        });
      },
    });
  },

  // 删除文章信息
  deleteArticle: function (e) {
    const article = e.currentTarget.dataset.article;

    if (!article || !article.id) {
      wx.showToast({
        title: "文章信息无效",
        icon: "none",
      });
      return;
    }

    wx.showModal({
      title: "确认删除",
      content: `确定要删除文章 "${article.title}" 的信息吗？`,
      success: (res) => {
        if (res.confirm) {
          try {
            const success = deleteArticleInfo(article.id);

            if (success) {
              console.log("✅ 文章信息删除成功");

              wx.showToast({
                title: "文章信息已删除",
                icon: "success",
              });

              // 刷新文章信息列表
              this.loadArticleInfoList();
            } else {
              wx.showToast({
                title: "删除失败",
                icon: "none",
              });
            }
          } catch (error) {
            console.error("❌ 删除文章信息异常:", error);
            wx.showToast({
              title: "删除异常",
              icon: "none",
            });
          }
        }
      },
    });
  },

  // 清空所有文章信息
  clearAllArticles: function () {
    wx.showModal({
      title: "确认清空",
      content: "确定要删除所有保存的文章信息吗？此操作不可恢复。",
      success: (res) => {
        if (res.confirm) {
          try {
            console.log("🧹 开始清空所有文章信息操作");

            const success = clearAllArticleInfo();

            if (success) {
              console.log("✅ 所有文章信息已清空");

              // 刷新文章信息列表
              this.loadArticleInfoList();

              wx.showToast({
                title: "所有文章信息已清空",
                icon: "success",
              });
            } else {
              wx.showToast({
                title: "清空失败",
                icon: "none",
              });
            }
          } catch (error) {
            console.error("❌ 清空文章信息失败:", error);
            wx.showToast({
              title: "清空失败",
              icon: "none",
            });
          }
        }
      },
    });
  },
});
