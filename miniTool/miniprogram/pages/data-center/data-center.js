const {
  TrackTypeEnum,
  getTrackTypeName,
  getTrackTypeIcon,
} = require("../../utils/trackTypeUtils");

const {
  PlatformEnum,
  getPlatformName,
  getPlatformIcon,
} = require("../../utils/platformUtils");
const authUtils = require("../../utils/authUtils");
const userInfoUtils = require("../../utils/userInfoUtils");
const timeUtils = require("../../utils/timeUtils");
const accountUtils = require("../../utils/accountUtils");

Page({
  data: {
    // 账号列表数据
    accountList: [],
    loading: true,
    refreshing: false,
  },

  onLoad: function (options) {
    console.log("数据中心页面加载");

    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }
  },

  onShow: function () {
    // 每次页面显示时都刷新数据，确保数据最新
    console.log("数据中心页面显示，刷新数据");
    this.loadAccountList();
  },

  // 加载账号列表
  loadAccountList: async function () {
    this.setData({
      loading: true,
    });

    try {
      // 获取用户信息（包含账号信息）
      const result = await userInfoUtils.getCurrentUserInfo();

      if (!result.success) {
        console.error("获取用户信息失败:", result.error);
        wx.showToast({
          title: "获取账号信息失败",
          icon: "none",
          duration: 2000,
        });
        this.setData({
          loading: false,
          refreshing: false,
        });
        return;
      }

      const userInfo = result.userInfo;
      const accounts = userInfo.accounts || [];

      console.log("获取到的用户信息:", userInfo);
      console.log("获取到的用户账号信息:", accounts);
      console.log("账号数量:", accounts.length);

      // 处理账号数据，添加显示所需的字段
      const accountList = accounts.map((account) => {
        // 获取平台图标
        const platformIcon = getPlatformIcon(account.platform);

        // 获取赛道类型信息
        const trackTypeName = getTrackTypeName(account.trackType);
        const trackTypeIcon = getTrackTypeIcon(account.trackType);

        // 处理文章数量
        const articlesCount = (account.posts || []).length;

        // 处理最后发布时间
        let lastPublishedTime = "暂无发布";
        if (account.lastPublishedTime) {
          try {
            const date = new Date(account.lastPublishedTime);
            lastPublishedTime = timeUtils.formatTime(date, "YYYY-MM-DD HH:mm");
          } catch (error) {
            console.error("格式化最后发布时间失败:", error);
            lastPublishedTime = "时间格式错误";
          }
        }

        // 处理状态显示 - 使用 accountUtils 统一处理
        const status = accountUtils.getAuditStatusText(account.auditStatus);

        return {
          // 基本信息
          accountId: account.accountId,
          accountName: account.accountNickname,
          platform: getPlatformName(account.platform),
          platformIcon: platformIcon,
          trackType: trackTypeName,
          trackIcon: trackTypeIcon,

          // 数据中心特有字段
          isReported: account.isReported || false,
          lastPublishedTime: lastPublishedTime,
          articlesCount: articlesCount,

          // 状态信息
          status: status,

          // 保留原始数据用于详情页面
          originalAccountData: account,
        };
      });

      this.setData({
        accountList,
        loading: false,
        refreshing: false,
      });

      console.log("数据中心账号列表加载完成:", accountList);
    } catch (error) {
      console.error("加载数据中心账号列表失败:", error);
      wx.showToast({
        title: "加载失败，请重试",
        icon: "none",
        duration: 2000,
      });
      this.setData({
        loading: false,
        refreshing: false,
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.setData({
      refreshing: true,
    });
    this.loadAccountList();

    // 停止下拉刷新动画
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  // 点击回传按钮
  onReportTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const account = this.data.accountList[index];
    const originalAccountData = account.originalAccountData;

    // 检查是否有已领取的每日任务
    const dailyTasks = originalAccountData.dailyTasks || [];
    const claimedTasks = dailyTasks.filter(task => task.isClaimed === true);

    if (claimedTasks.length === 0) {
      // 没有已领取的任务，弹出提示
      wx.showModal({
        title: "提示",
        content: "请去任务页面领取今日要发表的文章吧！",
        showCancel: false,
        confirmText: "确认",
        success: (res) => {
          if (res.confirm) {
            // 跳转到任务主页面
            wx.switchTab({
              url: "/pages/task/task",
              success: function () {
                console.log("跳转到任务主页面");
              },
              fail: function (err) {
                console.error("跳转任务页面失败:", err);
                wx.showToast({
                  title: "跳转失败，请重试",
                  icon: "none",
                });
              },
            });
          }
        },
      });
      return;
    }

    // 有已领取的任务，使用第一个已领取的任务数据跳转到回传页面
    const firstClaimedTask = claimedTasks[0];
    console.log("第一个已领取的任务数据:", firstClaimedTask);
    // 构造跳转参数
    const params = {
      articleId: firstClaimedTask.articleId,
      articleTitle: encodeURIComponent(firstClaimedTask.articleTitle || ""),
      accountName: encodeURIComponent(originalAccountData.accountNickname || ""),
      accountId: originalAccountData.accountId,
      trackType: firstClaimedTask.trackType,
      platformType: firstClaimedTask.platformType,
    };

    // 构建URL参数字符串
    const queryString = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&');

    // 跳转到回传信息页面
    wx.navigateTo({
      url: `/pages/upload-info/upload-info?${queryString}`,
      success: function () {
        console.log("跳转到回传信息页面，参数:", params);
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
});
