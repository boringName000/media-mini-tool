// 引入工具函数
const { PlatformEnum, getPlatformName } = require("../../utils/platformUtils");
const accountUtils = require("../../utils/accountUtils");
const updateDailyTasksUtils = require("../../utils/updateDailyTasksUtils");

Page({
  data: {
    trackTypes: [], // 赛道类型数据
    isScrolling: false, // 滚动状态
    // 账号选择弹出卡片相关
    showAccountPopup: false, // 是否显示账号选择弹出卡片
    selectedTrackType: null, // 当前选中的赛道类型
    matchedAccounts: [], // 匹配的账号列表
  },

  onLoad: function () {
    this.loadTrackTypes();
    this.startNoticeScroll();
  },

  onShow: function () {
    // 更新自定义tabBar的选中状态
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
      });
    }
  },

  // 加载赛道类型数据
  loadTrackTypes: function () {
    const trackTypes = require("../../config/trackType");
    console.log("加载的赛道类型数据:", trackTypes);
    this.setData({
      trackTypes: trackTypes,
    });
  },

  // 启动通知滚动动画
  startNoticeScroll: function () {
    // 延迟启动滚动，确保页面渲染完成
    setTimeout(() => {
      this.setData({
        isScrolling: true,
      });
    }, 500);
  },

  // 点击赛道项
  onTrackItemTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const trackItem = this.data.trackTypes[index];

    if (!trackItem) {
      console.log("赛道数据不存在");
      return;
    }

    const { icon, name, description, type } = trackItem;

    console.log("点击赛道项:", { icon, name, description, type });

    // 从app的globalData中获取我的账号信息
    const app = getApp();
    const loginResult = app.globalData.loginResult;

    if (loginResult && loginResult.success && loginResult.accounts) {
      const accounts = loginResult.accounts;

      // 查找符合点击赛道类型的账号
      const matchedAccounts = accounts.filter(
        (account) => account.trackType === type
      );

      if (matchedAccounts.length === 0) {
        // 如果没有账号符合点击的赛道类型，保持现在的跳转逻辑
        this.navigateToArticleList(type, 1, name);
      } else {
        // 当查找到有符合点击赛道类型的账号的时候，调用 updateDailyTasks 不传参数，更新每日任务，再跳转
        this.updateDailyTasksAndNavigate(type, matchedAccounts, name);
      }
    } else {
      // 如果没有账号信息，保持现在的跳转逻辑
      this.navigateToArticleList(type, 1, name);
    }
  },

  // 更新每日任务并导航
  updateDailyTasksAndNavigate: function (
    trackType,
    matchedAccounts,
    trackName
  ) {
    // 显示加载提示
    wx.showLoading({
      title: "更新任务中...",
      mask: true,
    });

    // 调用 updateDailyTasks 不传参数，更新每日任务
    updateDailyTasksUtils
      .updateDailyTasks()
      .then((result) => {
        wx.hideLoading();

        if (result.success) {
          console.log("每日任务更新成功:", result);
        } else {
          console.log("每日任务更新失败:", result.error);
        }

        // 无论更新成功与否，都继续跳转
        this.navigateAfterUpdate(trackType, matchedAccounts, trackName);
      })
      .catch((error) => {
        wx.hideLoading();
        console.error("更新每日任务异常:", error);

        // 即使更新失败，也继续跳转
        this.navigateAfterUpdate(trackType, matchedAccounts, trackName);
      });
  },

  // 更新后的导航逻辑
  navigateAfterUpdate: function (trackType, matchedAccounts, trackName) {
    if (matchedAccounts.length === 1) {
      // 如果只有一个账号符合，直接跳转到文章列表页面，传递账号ID
      const account = matchedAccounts[0];
      this.navigateToArticleListByAccount(
        account.accountId,
        account.accountNickname
      );
    } else {
      // 如果有多个账号符合，显示账号选择弹出卡片
      this.showAccountSelectionPopup(trackType, matchedAccounts);
    }
  },

  // 跳转到文章列表页面（原有逻辑）
  navigateToArticleList: function (trackType, platformType, trackName) {
    // 显示加载提示
    wx.showLoading({
      title: "加载中...",
      mask: true,
    });

    // 跳转到文章列表页面，传递赛道类型和平台类型参数
    wx.navigateTo({
      url: `/pages/article-list/article-list?trackType=${trackType}&platformType=${platformType}`,
      success: function () {
        console.log(`跳转到${trackName}赛道的文章列表页面`);
        wx.hideLoading();
      },
      fail: function (err) {
        console.error("跳转失败:", err);
        wx.hideLoading();
        wx.showToast({
          title: "跳转失败，请重试",
          icon: "none",
        });
      },
    });
  },

  // 通过账号ID跳转到文章列表页面
  navigateToArticleListByAccount: function (accountId, accountName) {
    // 显示加载提示
    wx.showLoading({
      title: "加载中...",
      mask: true,
    });

    // 跳转到文章列表页面，传递账号ID参数
    wx.navigateTo({
      url: `/pages/article-list/article-list?accountId=${accountId}`,
      success: function () {
        console.log(`跳转到${accountName}的文章列表页面，账号ID：${accountId}`);
        wx.hideLoading();
      },
      fail: function (err) {
        console.error("跳转失败:", err);
        wx.hideLoading();
        wx.showToast({
          title: "跳转失败，请重试",
          icon: "none",
        });
      },
    });
  },

  // 显示账号选择弹出卡片
  showAccountSelectionPopup: function (trackType, matchedAccounts) {
    // 格式化账号数据用于显示
    const formattedAccounts = matchedAccounts.map((account) => {
      return {
        accountId: account.accountId,
        accountNickname:
          account.accountNickname || account.originalAccountId || "未命名账号",
        platform: getPlatformName(account.platform),
        status: account.status,
        auditStatus: account.auditStatus,
        statusText: this.getAccountStatusText(account),
        originalData: account,
      };
    });

    this.setData({
      showAccountPopup: true,
      selectedTrackType: trackType,
      matchedAccounts: formattedAccounts,
    });
  },

  // 获取账号状态文本
  getAccountStatusText: function (account) {
    if (account.status === 0) {
      return "已禁用";
    } else if (account.status === 1) {
      return accountUtils.getAuditStatusText(account.auditStatus);
    }
    return "未知状态";
  },

  // 点击账号选择弹出卡片中的账号项
  onAccountItemTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const account = this.data.matchedAccounts[index];

    // 检查账号状态
    if (account.status === 0) {
      // 如果是禁用状态，弹出提示框
      wx.showModal({
        title: "账号已禁用",
        content: "该账号已被禁用，请联系管理员处理",
        showCancel: false,
        confirmText: "知道了",
      });
      return;
    }

    // 关闭弹出卡片
    this.hideAccountSelectionPopup();

    // 跳转到文章列表页面
    this.navigateToArticleListByAccount(
      account.accountId,
      account.accountNickname
    );
  },

  // 隐藏账号选择弹出卡片
  hideAccountSelectionPopup: function () {
    this.setData({
      showAccountPopup: false,
      selectedTrackType: null,
      matchedAccounts: [],
    });
  },

  // 点击弹出卡片外部蒙层
  onPopupMaskTap: function () {
    this.hideAccountSelectionPopup();
  },

  // 跳转到今日数据页面
  goTodayData: function () {
    wx.navigateTo({
      url: "/pages/data-center/data-center",
      success: function () {
        console.log("跳转到数据中心页面");
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

  // 跳转到结算收益页面
  goSettlement: function () {
    console.log("点击了结算收益按钮");
    wx.navigateTo({
      url: "/pages/earnings-settlement/earnings-settlement",
      success: function () {
        console.log("跳转到收益结算页面成功");
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
