// 账号列表页面
const { getAccountList } = require("../../config/accounts");

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
    const authUtils = require("../../utils/authUtils");
    if (!authUtils.requireLogin(this)) {
      return;
    }

    this.loadAccountList();
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.loadAccountList();
  },

  // 加载账号列表
  loadAccountList: function () {
    this.setData({
      loading: true,
    });

    // 模拟从服务器获取数据
    setTimeout(() => {
      // 获取基础账号数据
      const baseAccounts = getAccountList();

      // 为每个账号添加额外信息（模拟数据）
      const accountList = baseAccounts.map((account, index) => {
        return {
          ...account,
          // 审核状态：0-待审核，1-已通过，2-未通过
          auditStatus: index % 3,
          auditStatusText: ["待审核", "已通过", "未通过"][index % 3],
          auditStatusColor: ["#f39c12", "#27ae60", "#e74c3c"][index % 3],
          // 每日发文数量
          dailyPostCount: Math.floor(Math.random() * 10) + 1,
          // 注册时间（模拟）
          registerTime: this.generateRandomDate(),
          // 是否违规
          isViolation: Math.random() > 0.8,
          // 注册手机号（模拟）
          phoneNumber: `138${String(
            Math.floor(Math.random() * 100000000)
          ).padStart(8, "0")}`,
          // 截图URL（模拟，部分账号有截图）
          screenshotUrl:
            Math.random() > 0.3
              ? "https://via.placeholder.com/300x200/007aff/ffffff?text=Screenshot"
              : "",
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
    }, 1000);
  },

  // 生成随机日期（最近一年内）
  generateRandomDate: function () {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    const randomTime =
      oneYearAgo.getTime() +
      Math.random() * (now.getTime() - oneYearAgo.getTime());
    const randomDate = new Date(randomTime);

    return randomDate.toISOString().split("T")[0];
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

    // 跳转到账号详情页面
    wx.navigateTo({
      url: `/pages/account-detail/account-detail?accountData=${encodeURIComponent(
        JSON.stringify(account)
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
