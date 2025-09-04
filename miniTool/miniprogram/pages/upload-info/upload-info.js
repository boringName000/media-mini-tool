// 回传信息页面
const { getPlatformName } = require("../../utils/platformUtils");
const {
  getTrackTypeName,
  getTrackTypeEnum,
} = require("../../utils/trackTypeUtils");
const authUtils = require("../../utils/authUtils");

Page({
  data: {
    // 页面数据
    articleId: "",
    articleTitle: "",
    accountName: "",
    accountId: "",
    trackType: "",
    platformType: "",
    publishedLink: "", // 发表后的链接
    linkError: "", // 链接错误提示
    viewCount: "", // 浏览量
    dailyEarnings: "", // 当日收益
  },

  onLoad: function (options) {
    console.log("回传信息页面接收到的参数:", options);

    // 处理传递过来的参数
    if (options.articleId) {
      this.setData({
        articleId: decodeURIComponent(options.articleId),
      });
    }

    if (options.articleTitle) {
      this.setData({
        articleTitle: decodeURIComponent(options.articleTitle),
      });
    }

    if (options.accountName) {
      this.setData({
        accountName: decodeURIComponent(options.accountName),
      });
    }

    if (options.accountId) {
      this.setData({
        accountId: decodeURIComponent(options.accountId),
      });
    }

    if (options.trackType) {
      const trackTypeValue = parseInt(decodeURIComponent(options.trackType));
      this.setData({
        trackType: trackTypeValue, // 直接保存枚举值，用于云函数调用
        trackTypeName: getTrackTypeName(trackTypeValue), // 保存显示名称，用于UI显示
      });
    }

    if (options.platformType) {
      const platformTypeValue = parseInt(
        decodeURIComponent(options.platformType)
      );
      this.setData({
        platformType: platformTypeValue, // 直接保存枚举值，用于云函数调用
        platformTypeName: getPlatformName(platformTypeValue), // 保存显示名称，用于UI显示
      });
    }

    // 打印解析后的数据，用于调试
    console.log("解析后的页面数据:", {
      articleId: this.data.articleId,
      articleTitle: this.data.articleTitle,
      accountName: this.data.accountName,
      trackType: this.data.trackType,
      platformType: this.data.platformType,
    });
  },

  onShow: function () {
    // 页面显示时的逻辑
  },

  // 链接输入处理
  onLinkInput: function (e) {
    const link = e.detail.value;
    this.setData({
      publishedLink: link,
      linkError: "", // 清除错误提示
    });
    console.log("输入的链接:", link);
  },

  // 链接输入框失去焦点时的验证
  onLinkBlur: function (e) {
    const link = e.detail.value;
    this.validateLink(link);
  },

  // 浏览量输入处理
  onViewCountInput: function (e) {
    const value = e.detail.value;
    this.setData({
      viewCount: value,
    });
    console.log("输入的浏览量:", value);
  },

  // 当日收益输入处理
  onDailyEarningsInput: function (e) {
    const value = e.detail.value;
    this.setData({
      dailyEarnings: value,
    });
    console.log("输入的当日收益:", value);
  },

  // 验证链接格式
  validateLink: function (link) {
    if (!link) {
      this.setData({
        linkError: "请填写发表后的链接",
      });
      return false;
    }

    // 如果用户没有输入协议，自动添加 http://
    let normalizedLink = link;
    if (!link.startsWith("http://") && !link.startsWith("https://")) {
      normalizedLink = "http://" + link;
    }

    // 验证链接格式
    try {
      new URL(normalizedLink);
      // 如果验证通过，更新链接为标准化后的格式
      this.setData({
        publishedLink: normalizedLink,
        linkError: "",
      });
      return true;
    } catch (error) {
      this.setData({
        linkError: "请输入有效的链接地址",
      });
      return false;
    }
  },

  // 验证浏览量
  validateViewCount: function (viewCount) {
    if (!viewCount) {
      this.setData({
        viewCountError: "请填写浏览量",
      });
      return false;
    }

    const count = parseInt(viewCount);
    if (isNaN(count) || count < 0) {
      this.setData({
        viewCountError: "浏览量必须是有效的非负整数",
      });
      return false;
    }

    this.setData({
      viewCountError: "",
    });
    return true;
  },

  // 验证当日收益
  validateDailyEarnings: function (dailyEarnings) {
    if (!dailyEarnings) {
      this.setData({
        dailyEarningsError: "请填写当日收益",
      });
      return false;
    }

    const earnings = parseFloat(dailyEarnings);
    if (isNaN(earnings) || earnings < 0) {
      this.setData({
        dailyEarningsError: "当日收益必须是有效的非负数",
      });
      return false;
    }

    this.setData({
      dailyEarningsError: "",
    });
    return true;
  },

  // 检查是否可以提交
  canSubmit: function () {
    const { publishedLink, viewCount, dailyEarnings } = this.data;
    return publishedLink && viewCount && dailyEarnings;
  },

  // 提交回传信息
  submitUploadInfo: function () {
    const {
      publishedLink,
      articleId,
      articleTitle,
      accountName,
      accountId,
      trackType,
      platformType,
      viewCount,
      dailyEarnings,
    } = this.data;

    // 验证链接
    if (!this.validateLink(publishedLink)) {
      wx.showToast({
        title: "请填写有效的链接",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 验证浏览量
    if (!this.validateViewCount(viewCount)) {
      wx.showToast({
        title: "请填写有效的浏览量",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 验证当日收益
    if (!this.validateDailyEarnings(dailyEarnings)) {
      wx.showToast({
        title: "请填写有效的当日收益",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }

    // 显示加载提示
    wx.showLoading({
      title: "提交中...",
      mask: true,
    });

    // 获取全局App数据中的用户ID
    const app = getApp();
    const userId = app.globalData.loginResult?.userId;

    if (!userId) {
      wx.showToast({
        title: "用户信息获取失败，请重新登录",
        icon: "none",
        duration: 2000,
      });
      return;
    }

    // 调用云函数更新回传信息
    wx.cloud
      .callFunction({
        name: "update-account-posts",
        data: {
          userId: userId,
          accountId: accountId,
          articleId: articleId,
          title: articleTitle,
          trackType: trackType, // 直接使用枚举值
          callbackUrl: publishedLink, // 使用回传链接作为callbackUrl
          viewCount: viewCount ? parseInt(viewCount) : undefined,
          dailyEarnings: dailyEarnings ? parseFloat(dailyEarnings) : undefined,
        },
      })
      .then((result) => {
        wx.hideLoading();

        if (result.result && result.result.success) {
          // 提交成功
          wx.showToast({
            title: "回传成功",
            icon: "success",
            duration: 2000,
          });

          console.log("回传成功:", result.result);

          // 延迟返回上一页
          setTimeout(() => {
            wx.navigateBack({
              delta: 1,
            });
          }, 2000);
        } else {
          throw new Error(result.result?.message || "回传失败");
        }
      })
      .catch((error) => {
        wx.hideLoading();
        console.error("回传失败:", error);

        wx.showToast({
          title: error.message || "回传失败，请重试",
          icon: "none",
          duration: 2000,
        });
      });
  },
});
