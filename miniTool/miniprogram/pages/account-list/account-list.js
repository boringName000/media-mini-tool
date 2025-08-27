// 账号列表页面
const { getAccountList } = require("../../config/accounts");
const userInfoUtils = require("../../utils/userInfoUtils");
const authUtils = require("../../utils/authUtils");
const platformUtils = require("../../utils/platformUtils");
const trackTypeUtils = require("../../utils/trackTypeUtils");
const timeUtils = require("../../utils/timeUtils");
const accountUtils = require("../../utils/accountUtils");

Page({
  data: {
    accountList: [],
    loading: true,
    refreshing: false,
    stats: {
      totalCount: 0,
      approvedCount: 0,
      pendingCount: 0,
    },
  },

  onLoad: function (options) {
    console.log("账号列表页面加载");

    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }
  },

  onShow: function () {
    // 每次页面显示时都刷新数据，确保数据最新
    console.log("账号列表页面显示，刷新数据");
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
        const platformIcon = platformUtils.getPlatformIcon(account.platform);

        // 获取赛道类型信息
        const trackTypeName = trackTypeUtils.getTrackTypeName(
          account.trackType
        );
        const trackTypeIcon = trackTypeUtils.getTrackTypeIcon(
          account.trackType
        );

        return {
          // 基本信息
          accountId: account.accountId,
          accountName: account.accountNickname,
          platform: account.platform,
          platformIcon: platformIcon,
          trackType: trackTypeName,
          trackTypeEnum: account.trackType,
          trackTypeIcon: trackTypeIcon,

          // 审核状态 - 使用 accountUtils 统一处理
          auditStatus: account.auditStatus || 0,
          auditStatusText: accountUtils.getAuditStatusText(
            account.auditStatus || 0
          ),
          auditStatusColor: accountUtils.getAuditStatusColor(
            account.auditStatus || 0
          ),

          // 其他信息
          totalPostCount: (account.posts && account.posts.length) || 0,
          registerTime: timeUtils.formatTime(
            account.registerDate,
            "YYYY-MM-DD"
          ),
          isViolation: account.isViolation || false,
          phoneNumber: account.phoneNumber || "",
          screenshotUrl: account.screenshotUrl || "",

          // 保留原始数据用于详情页面
          originalAccountData: account,
        };
      });

      this.setData({
        accountList,
        loading: false,
        refreshing: false,
      });

      // 计算统计数据
      this.calculateStats(accountList);

      console.log("账号列表加载完成:", accountList);
    } catch (error) {
      console.error("加载账号列表失败:", error);
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

  // 计算统计数据
  calculateStats: function (accountList) {
    const totalCount = accountList.length;
    const approvedCount = accountList.filter(
      (item) => item.auditStatus === 1
    ).length;
    const pendingCount = accountList.filter(
      (item) => item.auditStatus === 0
    ).length;

    this.setData({
      stats: {
        totalCount,
        approvedCount,
        pendingCount,
      },
    });
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

  // 点击账号项
  onAccountTap: function (e) {
    const { index } = e.currentTarget.dataset;
    const account = this.data.accountList[index];

    console.log("点击账号:", account);

    // 使用原始账号数据，确保详情页面能获取到完整信息
    const accountData = account.originalAccountData || account;

    // 跳转到账号详情页面
    wx.navigateTo({
      url: `/pages/account-detail/account-detail?accountData=${encodeURIComponent(
        JSON.stringify(accountData)
      )}`,
      success: function () {
        console.log("跳转到账号详情页面");
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

  // 编辑账号
  onEditAccount: function (e) {
    const { index } = e.currentTarget.dataset;
    const account = this.data.accountList[index];

    console.log("编辑账号:", account);

    wx.showToast({
      title: "编辑功能开发中",
      icon: "none",
      duration: 2000,
    });
  },
});
