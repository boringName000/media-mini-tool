const authUtils = require("../../utils/authUtils");

Page({
  data: {
    // 收益统计数据
    totalAccountEarnings: 0,
    totalSettlementEarnings: 0,

    // 月度收益列表（根据用户注册时间动态生成）
    monthlyEarningsList: [],
  },

  onLoad: function (options) {
    // 检查登录状态
    if (!authUtils.requireLogin(this)) {
      return;
    }
  },

  onShow: function () {
    // 页面显示时刷新数据，确保每次进入都是最新数据
    this.loadEarningsData();
  },

  // 加载收益数据
  loadEarningsData: function () {
    this.generateMonthlyEarningsList();
    this.calculateEarningsStats();
  },

  // 计算收益统计数据
  calculateEarningsStats: function () {
    // 从 app 全局数据获取用户账号数据
    const app = getApp();
    const loginResult = app.globalData.loginResult;

    if (!loginResult || !loginResult.accounts) {
      console.warn("未获取到用户账号数据");
      this.setData({
        totalAccountEarnings: "0.00",
        totalSettlementEarnings: "0.00",
      });
      return;
    }

    const accounts = loginResult.accounts || [];
    let totalAccountEarnings = 0;
    let totalSettlementEarnings = 0;

    // 遍历所有账号的收益数据
    accounts.forEach((account) => {
      if (account.earnings && Array.isArray(account.earnings)) {
        account.earnings.forEach((earning) => {
          // 累加账号收益
          if (earning.accountEarnings) {
            totalAccountEarnings += parseFloat(earning.accountEarnings) || 0;
          }

          // 累加结算收益
          if (earning.settlementEarnings) {
            totalSettlementEarnings +=
              parseFloat(earning.settlementEarnings) || 0;
          }
        });
      }
    });

    console.log("收益统计计算:", {
      totalAccountEarnings,
      totalSettlementEarnings,
      accountsCount: accounts.length,
    });

    this.setData({
      totalAccountEarnings: totalAccountEarnings.toFixed(2),
      totalSettlementEarnings: totalSettlementEarnings.toFixed(2),
    });
  },

  // 根据用户注册时间生成月度收益列表
  generateMonthlyEarningsList: function () {
    // 从 app 全局数据获取用户注册时间
    const app = getApp();
    const loginResult = app.globalData.loginResult;

    if (!loginResult || !loginResult.registerTimestamp) {
      console.warn("未获取到用户注册时间，使用默认时间");
      // 如果没有注册时间，使用默认时间（2025年1月）
      const defaultRegisterDate = new Date("2025-01-01");
      this.generateEarningsListFromDate(defaultRegisterDate);
      return;
    }

    // 使用用户真实的注册时间
    const userRegisterDate = new Date(loginResult.registerTimestamp);
    console.log("使用用户注册时间生成收益列表:", userRegisterDate);

    this.generateEarningsListFromDate(userRegisterDate);
  },

  // 根据指定日期生成收益列表
  generateEarningsListFromDate: function (userRegisterDate) {
    // 从 app 全局数据获取用户账号数据
    const app = getApp();
    const loginResult = app.globalData.loginResult;

    if (!loginResult || !loginResult.accounts) {
      console.warn("未获取到用户账号数据");
      this.setData({
        monthlyEarningsList: [],
      });
      return;
    }

    const accounts = loginResult.accounts || [];
    const monthlyEarningsList = [];
    let id = 1;

    // 从注册月份开始，生成到当前月份的月度收益条目
    let currentMonth = new Date(
      userRegisterDate.getFullYear(),
      userRegisterDate.getMonth(),
      1
    );
    const currentDate = new Date();

    while (currentMonth <= currentDate) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const monthName = this.getMonthName(month);

      // 生成上半月收益条目
      monthlyEarningsList.push({
        id: id++,
        title: `${monthName}上半月收益结算`,
        year: year,
        month: month,
        period: "first",
      });

      // 生成下半月收益条目
      monthlyEarningsList.push({
        id: id++,
        title: `${monthName}下半月收益结算`,
        year: year,
        month: month,
        period: "second",
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

    // 计算时间区间
    const startTime = this.calculatePeriodStartTime(monthlyEarnings);
    const endTime = this.calculatePeriodEndTime(monthlyEarnings);

    // 跳转到结算页面，并传递时间区间参数
    wx.navigateTo({
      url: `/pages/settlement/settlement?period=${encodeURIComponent(
        monthlyEarnings.title
      )}&startTime=${encodeURIComponent(
        startTime.toISOString()
      )}&endTime=${encodeURIComponent(endTime.toISOString())}&year=${
        monthlyEarnings.year
      }&month=${monthlyEarnings.month}&periodType=${monthlyEarnings.period}`,
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

  // 计算期间开始时间
  calculatePeriodStartTime: function (monthlyEarnings) {
    const year = monthlyEarnings.year;
    const month = monthlyEarnings.month;

    if (monthlyEarnings.period === "first") {
      // 上半月：1号 00:00:00
      return new Date(year, month - 1, 1, 0, 0, 0, 0);
    } else {
      // 下半月：16号 00:00:00
      return new Date(year, month - 1, 16, 0, 0, 0, 0);
    }
  },

  // 计算期间结束时间
  calculatePeriodEndTime: function (monthlyEarnings) {
    const year = monthlyEarnings.year;
    const month = monthlyEarnings.month;

    if (monthlyEarnings.period === "first") {
      // 上半月：15号 23:59:59.999
      return new Date(year, month - 1, 15, 23, 59, 59, 999);
    } else {
      // 下半月：月末 23:59:59.999
      return new Date(year, month, 0, 23, 59, 59, 999);
    }
  },
});
