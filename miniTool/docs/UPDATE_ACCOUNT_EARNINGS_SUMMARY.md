# 更新账号收益信息云函数实现总结

## 📋 **功能概述**

创建了 `update-account-earnings` 云函数，用于更新指定用户在指定时间范围内的账号收益信息。

## 🔧 **核心功能**

### **1. 参数验证**

- ✅ **用户 ID 验证**: 确保用户存在
- ✅ **账号 ID 验证**: 确保账号存在
- ✅ **时间格式验证**: 验证开始时间和结束时间格式
- ✅ **更新字段验证**: 验证要更新的字段是否在允许范围内

### **2. 数据查找与更新**

- ✅ **用户查询**: 从 `user-info` 集合中查找指定用户
- ✅ **账号定位**: 在用户的 `accounts` 数组中查找指定账号
- ✅ **时间匹配**: 严格匹配时间范围，查找对应的收益记录
- ✅ **自动创建**: 如果指定时间范围没有收益记录，自动创建新的

### **3. 字段安全更新**

- ✅ **允许字段**: 只允许更新指定的 9 个字段
- ✅ **字段验证**: 验证每个字段的类型和值范围
- ✅ **时间保护**: 防止 `startTime` 和 `endTime` 被意外修改

## 📊 **允许更新的字段**

| 字段名               | 类型   | 验证规则   | 说明           |
| -------------------- | ------ | ---------- | -------------- |
| `monthlyPostCount`   | number | ≥ 0        | 月发布文章数   |
| `settlementTime`     | Date   | 有效日期   | 结算时间       |
| `settlementStatus`   | number | 0,1,2      | 结算状态       |
| `settlementMethod`   | number | 数字类型   | 结算方式       |
| `transferOrderNo`    | string | 字符串类型 | 转账订单号     |
| `accountEarnings`    | number | ≥ 0        | 账号收益       |
| `settlementEarnings` | number | ≥ 0        | 结算收益       |
| `settlementImageUrl` | string | 字符串类型 | 结算单图片 URL |
| `transferImageUrl`   | string | 字符串类型 | 转账截图 URL   |

## 🔄 **数据流程**

### **1. 参数接收与验证**

```javascript
const { userId, accountId, startTime, endTime, updateFields } = event;
```

### **2. 用户和账号查找**

```javascript
// 查找用户
const userResult = await db
  .collection("user-info")
  .where({ userId: userId })
  .get();

// 查找账号
const accountIndex = accounts.findIndex(
  (account) => account.accountId === accountId
);
```

### **3. 收益记录处理**

```javascript
// 查找匹配时间范围的收益记录
let earningIndex = -1;
for (let i = 0; i < earnings.length; i++) {
  const earning = earnings[i];
  const earningStartTime = new Date(earning.startTime);
  const earningEndTime = new Date(earning.endTime);

  // 严格匹配时间范围
  if (
    earningStartTime.getTime() === startDate.getTime() &&
    earningEndTime.getTime() === endDate.getTime()
  ) {
    earningIndex = i;
    break;
  }
}

// 如果没有找到，创建新的收益记录
if (earningIndex === -1) {
  const newEarning = createNewEarning(startDate, endDate);
  earnings.push(newEarning);
  earningIndex = earnings.length - 1;
}
```

### **4. 数据更新**

```javascript
// 更新收益记录
const updatedEarning = {
  ...earnings[earningIndex],
  ...updateFields,
  // 确保时间字段不被覆盖
  startTime: earnings[earningIndex].startTime,
  endTime: earnings[earningIndex].endTime,
};

// 更新数据库
const updateResult = await db
  .collection("user-info")
  .where({ userId: userId })
  .update({
    data: {
      accounts: accounts,
      lastUpdateTimestamp: new Date(),
    },
  });
```

## 🛡️ **安全机制**

### **1. 字段白名单**

```javascript
const allowedFields = [
  "monthlyPostCount",
  "settlementTime",
  "settlementStatus",
  "settlementMethod",
  "transferOrderNo",
  "accountEarnings",
  "settlementEarnings",
  "settlementImageUrl",
  "transferImageUrl",
];
```

### **2. 字段值验证**

```javascript
function validateEarningFields(earning) {
  // 验证 monthlyPostCount
  if (
    earning.monthlyPostCount !== undefined &&
    (typeof earning.monthlyPostCount !== "number" ||
      earning.monthlyPostCount < 0)
  ) {
    return { valid: false, message: "月发布文章数必须是大于等于0的数字" };
  }

  // 验证 settlementStatus
  if (
    earning.settlementStatus !== undefined &&
    ![0, 1, 2].includes(earning.settlementStatus)
  ) {
    return {
      valid: false,
      message: "结算状态必须是0(未结算)、1(待结算)或2(已结算)",
    };
  }

  // ... 其他字段验证
}
```

### **3. 时间字段保护**

```javascript
const updatedEarning = {
  ...earnings[earningIndex],
  ...updateFields,
  // 确保时间字段不被覆盖
  startTime: earnings[earningIndex].startTime,
  endTime: earnings[earningIndex].endTime,
};
```

## 📝 **使用示例**

### **调用云函数**

```javascript
wx.cloud.callFunction({
  name: "update-account-earnings",
  data: {
    userId: "user123",
    accountId: "account456",
    startTime: "2024-01-01T00:00:00.000Z",
    endTime: "2024-01-31T23:59:59.999Z",
    updateFields: {
      monthlyPostCount: 15,
      accountEarnings: 2000,
      settlementEarnings: 1800,
      settlementStatus: 2,
      settlementTime: "2024-02-01T10:00:00.000Z",
    },
  },
  success: (res) => {
    if (res.result.success) {
      console.log("更新成功:", res.result.updatedEarning);
    } else {
      console.error("更新失败:", res.result.message);
    }
  },
});
```

### **返回结果**

```javascript
{
  success: true,
  message: "更新账号收益信息成功",
  updatedEarning: {
    startTime: "2024-01-01T00:00:00.000Z",
    endTime: "2024-01-31T23:59:59.999Z",
    monthlyPostCount: 15,
    accountEarnings: 2000,
    settlementEarnings: 1800,
    settlementStatus: 2,
    settlementTime: "2024-02-01T10:00:00.000Z",
    // ... 其他字段
  },
  queryParams: {
    userId: "user123",
    accountId: "account456",
    startTime: "2024-01-01T00:00:00.000Z",
    endTime: "2024-01-31T23:59:59.999Z",
    updateFields: { /* 更新的字段 */ }
  }
}
```

## ✅ **功能特点**

1. **严格时间匹配**: 只更新指定时间范围内的收益记录
2. **字段验证**: 验证所有更新字段的类型和值
3. **自动创建**: 如果指定时间范围没有收益记录，会自动创建
4. **数据安全**: 只允许更新指定的字段，防止误操作
5. **状态管理**: 自动更新用户信息的最后修改时间
6. **错误处理**: 完善的参数验证和错误提示

## 🎯 **应用场景**

- **结算操作**: 更新账号的结算状态和收益信息
- **数据修正**: 修正收益数据中的错误信息
- **状态更新**: 更新结算状态、结算时间等
- **图片上传**: 更新结算单和转账截图 URL

该云函数为结算功能提供了完整的数据更新能力，确保数据的准确性和安全性！🚀
