# 获取账号结算信息云函数总结

## 云函数信息

- **函数名**: `get-account-settlement-info`
- **功能**: 根据用户 ID 和时间范围获取账号结算信息
- **创建时间**: 2024 年
- **状态**: 已创建，待部署

## 功能描述

该云函数用于获取用户在指定时间范围内的账号结算信息。主要功能包括：

1. **查询现有收益记录**: 检查用户账号的 earnings 数组，查找符合时间范围的收益记录
2. **自动更新结算状态**: 根据当前时间自动更新收益记录的结算状态
3. **创建新收益记录**: 如果没有找到匹配的记录，根据 USER_INFO_DATABASE_SCHEMA.md 规范创建新的收益记录
4. **返回结算信息**: 返回所有账号的结算信息，包括账号基本信息和收益数据

## 请求参数

| 参数名    | 类型   | 必填 | 说明         |
| --------- | ------ | ---- | ------------ |
| userId    | String | ✅   | 用户 ID      |
| startTime | String | ✅   | 结算开始时间 |
| endTime   | String | ✅   | 结算结束时间 |

## 返回值结构

### 成功响应

```javascript
{
  success: true,
  message: "获取账号结算信息成功",
  settlementInfo: [
    {
      accountId: String,
      accountNickname: String,
      platform: Number,
      trackType: Number,
      earnings: [
        {
          startTime: Date,
          endTime: Date,
          monthlyPostCount: Number,
          settlementTime: Date,
          settlementStatus: Number,
          settlementMethod: Number,
          transferOrderNo: String,
          accountEarnings: Number,
          settlementEarnings: Number,
          settlementImageUrl: String,
          transferImageUrl: String
        }
      ]
    }
  ],
  queryParams: {
    userId: String,
    startTime: Date,
    endTime: Date
  }
}
```

## 核心业务逻辑

### 1. 参数验证

- 验证 userId 不为空
- 验证 startTime 和 endTime 不为空
- 验证时间格式正确
- 验证开始时间早于结束时间

### 2. 用户查询

- 根据 userId 查询 user-info 集合
- 检查用户是否存在

### 3. 账号处理

- 遍历用户的所有账号
- 为每个账号创建结算信息对象

### 4. 收益记录处理

- **有 earnings 数组**: 查找时间范围精确匹配的记录
  - 找到匹配记录 → 自动更新结算状态后返回
  - 未找到匹配记录 → 创建新记录
- **无 earnings 数组**: 创建新的收益记录

### 5. 结算状态自动更新

- **当前时间在时间区间内**: 设置为未结算状态 (0)
- **当前时间超过时间范围**: 设置为待结算状态 (1)
- **已经是已结算状态**: 不进行处理
- **当前时间早于开始时间**: 保持原有状态

### 6. 新收益记录初始化

根据 USER_INFO_DATABASE_SCHEMA.md 规范，新记录包含以下字段：

- `startTime`: 传入的开始时间
- `endTime`: 传入的结束时间
- `monthlyPostCount`: 0
- `settlementTime`: null
- `settlementStatus`: 根据时间区间自动确定 (0-未结算 或 1-待结算)
- `settlementMethod`: null
- `transferOrderNo`: null
- `accountEarnings`: 0
- `settlementEarnings`: 0
- `settlementImageUrl`: null
- `transferImageUrl`: null

## 时间范围判断逻辑

采用精确匹配逻辑：

```javascript
// 检查时间范围是否精确匹配
return (
  earningStartTime.getTime() === startDate.getTime() &&
  earningEndTime.getTime() === endDate.getTime()
);
```

这意味着只有收益记录的时间范围与查询时间范围完全一致，才会被包含在结果中。

## 文件结构

```
miniTool/cloudfunctions/get-account-settlement-info/
├── index.js              # 云函数主文件
├── package.json          # 依赖配置
├── config.json           # 云函数配置
└── README.md             # 说明文档

miniTool/scripts/clouddeploy/
└── deploy-get-account-settlement-info.sh  # 部署脚本

miniTool/docs/
└── GET_ACCOUNT_SETTLEMENT_INFO_SUMMARY.md  # 本文档
```

## 部署说明

1. 进入云函数目录: `cd miniTool/cloudfunctions/get-account-settlement-info`
2. 安装依赖: `npm install`
3. 部署云函数: `wx cloud deploy --env cloud1-8g0b5g5g5g5g5g`

或使用部署脚本:

```bash
./miniTool/scripts/clouddeploy/deploy-get-account-settlement-info.sh
```

## 使用示例

```javascript
// 调用云函数
wx.cloud
  .callFunction({
    name: "get-account-settlement-info",
    data: {
      userId: "user123",
      startTime: "2024-01-01T00:00:00.000Z",
      endTime: "2024-01-31T23:59:59.999Z",
    },
  })
  .then((res) => {
    console.log("结算信息:", res.result.settlementInfo);
  })
  .catch((err) => {
    console.error("获取失败:", err);
  });
```

## 注意事项

1. **时间格式**: 支持 ISO 8601 格式的时间字符串
2. **数据一致性**: 严格按照 USER_INFO_DATABASE_SCHEMA.md 规范创建新记录
3. **错误处理**: 包含完整的参数验证和错误处理机制
4. **性能考虑**: 一次性返回所有账号的结算信息，避免多次调用
5. **数据完整性**: 确保返回的数据结构完整，便于前端处理
