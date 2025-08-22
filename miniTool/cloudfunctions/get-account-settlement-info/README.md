# 获取账号结算信息云函数

## 功能描述

根据用户 ID 和结算时间范围，获取用户所有账号的结算信息。如果账号已有 earnings 数组且包含符合时间范围的记录，则返回现有数据并自动更新结算状态；否则创建新的收益记录。

## 请求参数

| 参数名    | 类型   | 必填 | 说明         |
| --------- | ------ | ---- | ------------ |
| userId    | String | ✅   | 用户 ID      |
| startTime | String | ✅   | 结算开始时间 |
| endTime   | String | ✅   | 结算结束时间 |

## 返回值

### 成功响应

```javascript
{
  success: true,
  message: "获取账号结算信息成功",
  settlementInfo: [
    {
      accountId: "AC00001",
      accountNickname: "账号昵称",
      platform: 1,
      trackType: 1,
      earnings: [
        {
          startTime: "2024-01-01T00:00:00.000Z",
          endTime: "2024-01-31T23:59:59.999Z",
          monthlyPostCount: 0,
          settlementTime: null,
          settlementStatus: 0,
          settlementMethod: null,
          transferOrderNo: null,
          accountEarnings: 0,
          settlementEarnings: 0,
          settlementImageUrl: null,
          transferImageUrl: null
        }
      ]
    }
  ],
  queryParams: {
    userId: "user123",
    startTime: "2024-01-01T00:00:00.000Z",
    endTime: "2024-01-31T23:59:59.999Z"
  }
}
```

### 失败响应

```javascript
{
  success: false,
  message: "错误信息",
  error: Error对象
}
```

## 业务逻辑

1. **参数验证**: 检查 userId、startTime、endTime 是否有效
2. **时间验证**: 验证时间格式，确保开始时间早于结束时间
3. **用户查询**: 根据 userId 查询用户信息
4. **账号遍历**: 遍历用户的所有账号
5. **收益记录检查**:
   - 如果账号有 earnings 数组，查找符合时间范围的记录
   - 如果找到匹配记录，自动更新结算状态后返回
   - 如果没有找到，创建新的收益记录
6. **结算状态自动更新**:
   - 当前时间在时间区间内 → 未结算状态 (0)
   - 当前时间超过时间范围 → 待结算状态 (1)
   - 已经是已结算状态 → 不处理
7. **数据返回**: 返回所有账号的结算信息

## 注意事项

- 时间参数支持 ISO 8601 格式字符串
- 收益记录的时间范围判断采用精确匹配逻辑
- 结算状态会根据当前时间自动更新
- 新创建的收益记录状态根据时间区间自动确定
- 所有数值字段默认为 0，可选字段默认为 null
