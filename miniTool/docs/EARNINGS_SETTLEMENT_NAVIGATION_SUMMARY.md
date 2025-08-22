# 收益结算页面到结算页面跳转功能实现

## 📋 **功能概述**

实现了从 `earnings-settlement` 页面跳转到 `settlement` 页面，并传递时间区间参数的功能。

## 🔄 **跳转流程**

### **1. 收益结算页面 (`earnings-settlement.js`)**

#### **时间计算逻辑**

- **上半月**: 1 号 00:00:00 到 15 号 23:59:59.999
- **下半月**: 16 号 00:00:00 到 月末 23:59:59.999

#### **新增函数**

```javascript
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
}

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
}
```

#### **跳转参数**

```javascript
// 跳转到结算页面，并传递时间区间参数
wx.navigateTo({
  url: `/pages/settlement/settlement?period=${encodeURIComponent(
    monthlyEarnings.title
  )}&startTime=${encodeURIComponent(
    startTime.toISOString()
  )}&endTime=${encodeURIComponent(endTime.toISOString())}&year=${
    monthlyEarnings.year
  }&month=${monthlyEarnings.month}&periodType=${monthlyEarnings.period}`,
  // ...
});
```

### **2. 结算页面 (`settlement.js`)**

#### **参数接收**

```javascript
onLoad: function (options) {
  // 处理从earnings-settlement页面传递过来的参数
  if (options.period) {
    const period = decodeURIComponent(options.period);
    const startTime = options.startTime ? decodeURIComponent(options.startTime) : null;
    const endTime = options.endTime ? decodeURIComponent(options.endTime) : null;
    const year = options.year ? parseInt(options.year) : null;
    const month = options.month ? parseInt(options.month) : null;
    const periodType = options.periodType || null;

    // 存储时间范围信息
    this.setData({
      currentSettlementPeriod: period,
      settlementTimeRange: {
        startTime: startTime,
        endTime: endTime,
        year: year,
        month: month,
        periodType: periodType
      },
      // ...
    });

    // 调用云函数获取结算数据
    if (startTime && endTime) {
      this.loadSettlementData(startTime, endTime);
    }
  }
}
```

#### **云函数调用**

```javascript
// 加载结算数据
loadSettlementData: function (startTime, endTime) {
  const app = getApp();
  const userId = app.globalData.loginResult?.userId;

  // 调用云函数获取账号结算信息
  wx.cloud.callFunction({
    name: 'get-account-settlement-info',
    data: {
      userId: userId,
      startTime: startTime,
      endTime: endTime
    },
    success: (res) => {
      if (res.result.success) {
        this.processSettlementData(res.result.settlementInfo);
      }
    },
    // ...
  });
}
```

#### **数据处理**

```javascript
// 处理结算数据
processSettlementData: function (settlementInfo) {
  // 转换云函数返回的数据格式为页面需要的格式
  const accountList = settlementInfo.map(account => {
    const earnings = account.earnings && account.earnings.length > 0 ? account.earnings[0] : null;

    return {
      accountId: account.accountId,
      platformEnum: account.platform,
      platform: this.getPlatformName(account.platform),
      platformIcon: this.getPlatformIcon(account.platform),
      accountName: account.accountNickname,
      trackTypeEnum: account.trackType,
      trackType: this.getTrackTypeName(account.trackType),
      trackIcon: this.getTrackTypeIcon(account.trackType),
      status: earnings ? earnings.settlementStatus : SettlementStatusEnum.PENDING,
      settlementPeriod: this.data.currentSettlementPeriod,
      lastSettlementTime: earnings && earnings.settlementTime ?
        new Date(earnings.settlementTime).toLocaleDateString() : "未结算",
      articlesCount: earnings ? earnings.monthlyPostCount : 0,
      accountEarnings: earnings ? earnings.accountEarnings : 0,
      settlementEarnings: earnings ? earnings.settlementEarnings : 0,
    };
  });

  this.setData({
    settlementAccountList: accountList,
  });

  this.calculateSettlementStats();
}
```

## 📊 **数据统计更新**

### **统计计算**

```javascript
// 计算结算统计数据
calculateSettlementStats: function () {
  const accountList = this.data.settlementAccountList;

  const totalAccounts = accountList.length;
  const pendingAccounts = accountList.filter((item) => isPending(item.status)).length;
  const settledAccounts = accountList.filter((item) => isSettled(item.status)).length;

  // 计算本期已结算收益（从实际数据计算）
  const settledEarnings = accountList
    .filter((item) => isSettled(item.status))
    .reduce((total, item) => total + (item.settlementEarnings || 0), 0);

  // 计算总账号收益
  const totalAccountEarnings = accountList.reduce((total, item) =>
    total + (item.accountEarnings || 0), 0);

  this.setData({
    settlementStats: {
      totalAccounts,
      pendingAccounts,
      settledAccounts,
      settledEarnings,
      totalAccountEarnings,
    },
  });
}
```

## 🎨 **UI 更新**

### **结算页面统计区域**

```xml
<!-- 收益统计 -->
<view class="earnings-row">
  <view class="earnings-item">
    <text class="earnings-label">总账号收益：</text>
    <text class="earnings-number">¥{{settlementStats.totalAccountEarnings}}</text>
  </view>
  <view class="earnings-item">
    <text class="earnings-label">本期已结算收益：</text>
    <text class="earnings-number">¥{{settlementStats.settledEarnings}}</text>
  </view>
</view>
```

## 🔧 **技术要点**

### **1. 时间格式**

- **传递格式**: ISO 8601 字符串 (`toISOString()`)
- **接收处理**: `decodeURIComponent()` 解码
- **云函数格式**: 支持标准 JavaScript Date 构造函数格式

### **2. 参数传递**

- **URL 编码**: 使用 `encodeURIComponent()` 确保特殊字符正确传递
- **参数解析**: 在目标页面使用 `decodeURIComponent()` 解码
- **类型转换**: 数字参数使用 `parseInt()` 转换

### **3. 数据流程**

1. **收益结算页面**: 计算时间区间 → 跳转传递参数
2. **结算页面**: 接收参数 → 调用云函数 → 处理数据 → 更新 UI
3. **云函数**: 根据时间区间查询/创建收益记录 → 返回结算信息

### **4. 错误处理**

- **参数验证**: 检查必要参数是否存在
- **网络错误**: 显示加载状态和错误提示
- **数据格式**: 验证云函数返回数据格式

## ✅ **功能验证**

### **测试场景**

1. **上半月结算**: 点击"1 月上半月收益结算" → 传递 1 月 1 日-1 月 15 日时间区间
2. **下半月结算**: 点击"1 月下半月收益结算" → 传递 1 月 16 日-1 月 31 日时间区间
3. **参数传递**: 验证所有参数正确传递到结算页面
4. **数据加载**: 验证云函数调用和数据展示

### **预期结果**

- ✅ 时间区间参数正确传递
- ✅ 云函数成功调用并返回数据
- ✅ 结算页面正确显示账号列表和统计信息
- ✅ 收益数据准确计算和显示

## 📝 **总结**

成功实现了从收益结算页面到结算页面的跳转功能，包括：

1. **时间区间计算**: 准确计算上半月和下半月的时间范围
2. **参数传递**: 完整传递时间参数和期间信息
3. **数据获取**: 调用云函数获取指定时间区间的结算数据
4. **UI 更新**: 显示总账号收益和已结算收益统计
5. **错误处理**: 完善的参数验证和错误提示机制

该功能为用户提供了完整的收益结算流程，从时间选择到数据查看的一站式体验。
