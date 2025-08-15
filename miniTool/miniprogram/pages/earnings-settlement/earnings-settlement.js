const authUtils = require("../../utils/authUtils");

Page({
  data: {
    // 收益统计数据
    totalEarnings: 0,
    monthlyEarnings: 0,

    // 月度收益列表（根据用户注册时间动态生成）
    monthlyEarningsList: [],
  },

  onLoad: function (options) {
    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }

    this.generateMonthlyEarningsList();
    this.calculateEarningsStats();
  },

  onShow: function () {
    // 页面显示时刷新数据
    this.generateMonthlyEarningsList();
    this.calculateEarningsStats();
  },

  // 计算收益统计数据
  calculateEarningsStats: function () {
    const monthlyEarningsList = this.data.monthlyEarningsList || [];

    // 计算总收益（所有月度时间的本期总收益之和）
    const totalEarnings = monthlyEarningsList.reduce(
      (sum, item) => sum + (item.periodTotalEarnings || 0),
      0
    );

    // 模拟本月收益（这里可以根据实际需求调整）
    const monthlyEarnings = totalEarnings * 0.3; // 假设本月收益为总收益的30%

    this.setData({
      totalEarnings: totalEarnings.toFixed(2),
      monthlyEarnings: monthlyEarnings.toFixed(2),
    });
  },

  // 根据用户注册时间生成月度收益列表
  generateMonthlyEarningsList: function () {
    // 从工具文件获取用户注册时间戳
    const registerTimestamp = "1754742131987";
    const userRegisterDate = new Date(registerTimestamp);
    const currentDate = new Date();

    const monthlyEarningsList = [];
    let id = 1;

    // 从注册月份开始，生成到当前月份的月度收益条目
    let currentMonth = new Date(
      userRegisterDate.getFullYear(),
      userRegisterDate.getMonth(),
      1
    );

    while (currentMonth <= currentDate) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const monthName = this.getMonthName(month);

      // 生成上半月收益条目
      monthlyEarningsList.push({
        id: id++,
        title: `${monthName}上半月收益结算`,
        periodTotalEarnings:
          Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000, // 本期总收益
      });

      // 生成下半月收益条目
      monthlyEarningsList.push({
        id: id++,
        title: `${monthName}下半月收益结算`,
        periodTotalEarnings:
          Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000, // 本期总收益
      });

      // 移动到下一个月
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    this.setData({
      monthlyEarningsList: monthlyEarningsList,
    });
  },

  // 获取月份名称
  getMonthName: function (month) {
    const monthNames = [
      "1月",
      "2月",
      "3月",
      "4月",
      "5月",
      "6月",
      "7月",
      "8月",
      "9月",
      "10月",
      "11月",
      "12月",
    ];
    return monthNames[month - 1];
  },

  // 点击结算按钮
  onSettleTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const monthlyEarnings = this.data.monthlyEarningsList[index];

    // 跳转到结算页面，并传递月度收益信息
    wx.navigateTo({
      url: `/pages/settlement/settlement?period=${encodeURIComponent(
        monthlyEarnings.title
      )}`,
      success: function () {
        console.log("跳转到结算页面");
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
