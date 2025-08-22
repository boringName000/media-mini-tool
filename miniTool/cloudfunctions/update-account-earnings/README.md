# 更新账号收益信息云函数

## 功能描述

更新指定用户在指定时间范围内的账号收益信息。

## 入参说明

| 参数名       | 类型        | 必填 | 说明             |
| ------------ | ----------- | ---- | ---------------- |
| userId       | string      | 是   | 用户 ID          |
| accountId    | string      | 是   | 账号 ID          |
| startTime    | string/Date | 是   | 结算开始时间     |
| endTime      | string/Date | 是   | 结算结束时间     |
| updateFields | object      | 是   | 要更新的字段和值 |

### updateFields 字段说明

| 字段名             | 类型        | 说明                                    |
| ------------------ | ----------- | --------------------------------------- |
| monthlyPostCount   | number      | 月发布文章数                            |
| settlementTime     | string/Date | 结算时间                                |
| settlementStatus   | number      | 结算状态 (0-未结算, 1-待结算, 2-已结算) |
| settlementMethod   | number      | 结算方式                                |
| transferOrderNo    | string      | 转账订单号                              |
| accountEarnings    | number      | 账号收益                                |
| settlementEarnings | number      | 结算收益                                |
| settlementImageUrl | string      | 结算单图片 URL                          |
| transferImageUrl   | string      | 转账截图 URL                            |

## 出参说明

| 字段名         | 类型    | 说明             |
| -------------- | ------- | ---------------- |
| success        | boolean | 操作是否成功     |
| message        | string  | 操作结果消息     |
| updatedEarning | object  | 更新后的收益记录 |
| queryParams    | object  | 查询参数         |

## 使用示例

```javascript
// 调用云函数
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
    console.log("更新成功:", res.result);
  },
  fail: (err) => {
    console.error("更新失败:", err);
  },
});
```

## 功能特点

1. **严格时间匹配**: 只更新指定时间范围内的收益记录
2. **字段验证**: 验证所有更新字段的类型和值
3. **自动创建**: 如果指定时间范围没有收益记录，会自动创建
4. **数据安全**: 只允许更新指定的字段，防止误操作
5. **状态管理**: 自动更新用户信息的最后修改时间

## 错误处理

- 参数验证失败会返回详细的错误信息
- 用户或账号不存在会返回相应提示
- 数据库操作失败会返回错误详情

## 注意事项

1. 时间字段（startTime, endTime）不允许被更新
2. 所有数值字段必须大于等于 0
3. 结算状态只能是 0、1、2 三个值
4. 图片 URL 字段必须是有效的字符串格式
5. **重要**: 最终更新时会强制使用数据库服务时间覆盖 `settlementTime` 和 `lastUpdateTimestamp`，并强制设置 `settlementStatus` 为 2（已结算）
