# 结算页面跳转参数传递实现总结

## 📋 **功能概述**

实现了从 `settlement` 页面点击结算按钮跳转到 `submit-settlement` 页面时，传递 `update-account-earnings` 云函数所需的所有参数。

## 🔄 **参数传递流程**

### **1. 结算页面 (`settlement.js`)**

#### **参数获取**
```javascript
// 获取用户ID
const app = getApp();
const userId = app.globalData.loginResult?.userId;

// 获取时间范围参数
const timeRange = this.data.settlementTimeRange;
```

#### **参数验证**
```javascript
// 验证用户登录状态
if (!userId) {
  wx.showToast({
    title: "用户未登录",
    icon: "none",
  });
  return;
}

// 验证时间参数
if (!timeRange || !timeRange.startTime || !timeRange.endTime) {
  wx.showToast({
    title: "时间参数错误",
    icon: "none",
  });
  return;
}
```

#### **跳转URL构建**
```javascript
wx.navigateTo({
  url: `/pages/submit-settlement/submit-settlement?accountId=${
    account.accountId
  }&accountName=${encodeURIComponent(
    account.accountName
  )}&period=${encodeURIComponent(account.settlementPeriod)}&userId=${userId}&startTime=${encodeURIComponent(timeRange.startTime)}&endTime=${encodeURIComponent(timeRange.endTime)}&year=${timeRange.year}&month=${timeRange.month}&periodType=${timeRange.periodType}`,
  // ...
});
```

### **2. 提交结算页面 (`submit-settlement.js`)**

#### **数据结构扩展**
```javascript
data: {
  // 页面数据
  accountId: "",
  accountName: "",
  settlementPeriod: "",
  // 云函数需要的参数
  userId: "",
  startTime: "",
  endTime: "",
  year: null,
  month: null,
  periodType: "",
  // ... 其他字段
}
```

#### **参数接收与处理**
```javascript
onLoad: function (options) {
  // 处理基础参数
  if (options.accountId) {
    this.setData({ accountId: options.accountId });
  }
  if (options.accountName) {
    this.setData({ accountName: decodeURIComponent(options.accountName) });
  }
  if (options.period) {
    this.setData({ settlementPeriod: decodeURIComponent(options.period) });
  }

  // 处理云函数需要的参数
  if (options.userId) {
    this.setData({ userId: options.userId });
  }
  if (options.startTime) {
    this.setData({ startTime: decodeURIComponent(options.startTime) });
  }
  if (options.endTime) {
    this.setData({ endTime: decodeURIComponent(options.endTime) });
  }
  if (options.year) {
    this.setData({ year: parseInt(options.year) });
  }
  if (options.month) {
    this.setData({ month: parseInt(options.month) });
  }
  if (options.periodType) {
    this.setData({ periodType: options.periodType });
  }
}
```

## 📊 **传递的参数列表**

### **基础参数**
| 参数名 | 类型 | 说明 | 来源 |
|--------|------|------|------|
| `accountId` | string | 账号ID | 结算页面账号数据 |
| `accountName` | string | 账号名称 | 结算页面账号数据 |
| `period` | string | 结算期间 | 结算页面期间信息 |

### **云函数必需参数**
| 参数名 | 类型 | 说明 | 来源 |
|--------|------|------|------|
| `userId` | string | 用户ID | 全局登录数据 |
| `startTime` | string | 开始时间 | 时间范围数据 |
| `endTime` | string | 结束时间 | 时间范围数据 |
| `year` | number | 年份 | 时间范围数据 |
| `month` | number | 月份 | 时间范围数据 |
| `periodType` | string | 期间类型 | 时间范围数据 |

## 🔧 **技术实现要点**

### **1. 参数编码**
```javascript
// URL编码特殊字符
encodeURIComponent(account.accountName)
encodeURIComponent(account.settlementPeriod)
encodeURIComponent(timeRange.startTime)
encodeURIComponent(timeRange.endTime)
```

### **2. 参数解码**
```javascript
// URL解码接收的参数
decodeURIComponent(options.accountName)
decodeURIComponent(options.period)
decodeURIComponent(options.startTime)
decodeURIComponent(options.endTime)
```

### **3. 类型转换**
```javascript
// 数字参数转换
parseInt(options.year)
parseInt(options.month)
```

### **4. 参数验证**
```javascript
// 验证必要参数存在
if (!userId) { /* 错误处理 */ }
if (!timeRange || !timeRange.startTime || !timeRange.endTime) { /* 错误处理 */ }
```

## 🎯 **应用场景**

### **完整的数据流**
1. **收益结算页面** → 选择时间区间 → 跳转到结算页面
2. **结算页面** → 显示账号列表 → 点击结算按钮
3. **提交结算页面** → 接收所有参数 → 调用云函数更新数据

### **云函数调用准备**
```javascript
// 在提交结算页面可以这样调用云函数
wx.cloud.callFunction({
  name: 'update-account-earnings',
  data: {
    userId: this.data.userId,
    accountId: this.data.accountId,
    startTime: this.data.startTime,
    endTime: this.data.endTime,
    updateFields: {
      // 用户填写的更新字段
      settlementStatus: 2,
      settlementTime: new Date().toISOString(),
      settlementMethod: 1,
      transferOrderNo: this.data.orderNumber,
      accountEarnings: parseFloat(this.data.accountEarnings),
      settlementEarnings: parseFloat(this.data.settlementEarnings),
      // ... 其他字段
    }
  }
});
```

## ✅ **功能特点**

1. **完整参数传递**: 传递了云函数所需的所有参数
2. **参数验证**: 在跳转前验证必要参数的存在
3. **编码安全**: 使用URL编码确保特殊字符正确传递
4. **类型处理**: 正确处理字符串和数字类型参数
5. **错误处理**: 完善的参数缺失错误提示

## 📝 **使用示例**

### **跳转URL示例**
```
/pages/submit-settlement/submit-settlement?accountId=ACC001&accountName=美食达人小红&period=2024年1月上半月&userId=user123&startTime=2024-01-01T00:00:00.000Z&endTime=2024-01-15T23:59:59.999Z&year=2024&month=1&periodType=first
```

### **接收参数示例**
```javascript
{
  accountId: "ACC001",
  accountName: "美食达人小红",
  settlementPeriod: "2024年1月上半月",
  userId: "user123",
  startTime: "2024-01-01T00:00:00.000Z",
  endTime: "2024-01-15T23:59:59.999Z",
  year: 2024,
  month: 1,
  periodType: "first"
}
```

该实现确保了从结算页面到提交结算页面的完整参数传递，为后续的云函数调用提供了所有必要的数据！🚀
