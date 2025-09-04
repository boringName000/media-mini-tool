# update-account-posts 云函数

## 功能描述

更新用户账号的文章数据，支持添加新文章或更新现有文章。

## 请求参数

| 参数名          | 类型   | 必填 | 说明     |
| --------------- | ------ | ---- | -------- |
| `userId`        | String | ✅   | 用户 ID  |
| `accountId`     | String | ✅   | 账号 ID  |
| `articleId`     | String | ✅   | 文章 ID  |
| `title`         | String | ✅   | 文章标题 |
| `trackType`     | Number | ✅   | 赛道类型 |
| `callbackUrl`   | String | ✅   | 回传地址 |
| `viewCount`     | Number | ✅   | 浏览量   |
| `dailyEarnings` | Number | ✅   | 当日收益 |

## 返回值

### 成功响应

```javascript
{
  "success": true,
  "message": "文章添加成功", // 或 "文章更新成功"
  "data": {
    "operationType": "add", // 或 "update"
    "postData": {
      "articleId": "ART1_20241201_001",
      "title": "美食探店分享",
      "trackType": 1,
      "publishTime": "2024-12-01T10:00:00.000Z",
      "callbackUrl": "https://example.com/callback/123"
    },
    "accountId": "AC00001",
    "totalPosts": 5,
    "dailyTasksUpdated": true,
    "updatedTaskCount": 1
  },
  "event": {...},
  "openid": "...",
  "appid": "...",
  "unionid": "..."
}
```

### 失败响应

```javascript
{
  "success": false,
  "message": "错误信息",
  "event": {...},
  "openid": "...",
  "appid": "...",
  "unionid": "..."
}
```

## 功能特性

### 1. 智能操作

- **添加新文章**: 如果文章 ID 不存在，则添加新文章
- **更新现有文章**: 如果文章 ID 已存在，则更新文章信息

### 2. 数据验证

- 验证用户 ID、账号 ID、文章 ID 的有效性
- 验证赛道类型为有效数字
- 验证回传地址为有效 URL 格式
- 检查用户和账号状态

### 3. 自动更新

- 自动设置发布时间为服务器时间
- **每日任务状态更新**: 检查文章 ID 是否匹配每日任务，自动更新任务状态为已完成
- 更新账号的 `lastPostTime` 字段
- **账号收益更新**: 自动更新账号的 `currentAccountEarnings` 字段为当前文章的 `dailyEarnings` 值
- 更新用户的 `lastUpdateTimestamp` 字段

### 4. 数据结构

#### 文章数据结构

```javascript
{
  articleId: "string",           // 文章唯一标识符
  title: "string",               // 文章标题
  trackType: number,             // 赛道类型
  publishTime: Date,             // 发布时间（服务器时间）
  callbackUrl: "string",         // 回传地址
  viewCount: number,             // 浏览量
  dailyEarnings: number          // 当日收益
}
```

## 使用示例

### 添加新文章

```javascript
wx.cloud.callFunction({
  name: "update-account-posts",
  data: {
    userId: "user123",
    accountId: "AC00001",
    articleId: "ART1_20241201_001",
    title: "美食探店分享",
    trackType: 1,
    callbackUrl: "https://example.com/callback/123",
    viewCount: 1500,
    dailyEarnings: 95.5,
  },
});
```

### 更新现有文章

```javascript
wx.cloud.callFunction({
  name: "update-account-posts",
  data: {
    userId: "user123",
    accountId: "AC00001",
    articleId: "ART1_20241201_001", // 已存在的文章ID
    title: "更新后的文章标题", // 更新文章标题
    trackType: 2, // 更新赛道类型
    callbackUrl: "https://example.com/callback/456", // 更新回传地址
  },
});
```

## 错误处理

### 常见错误

- `用户ID不能为空`: userId 参数缺失
- `账号ID不能为空`: accountId 参数缺失
- `文章ID不能为空`: articleId 参数缺失
- `文章标题不能为空`: title 参数缺失
- `赛道类型不能为空`: trackType 参数缺失
- `回传地址不能为空`: callbackUrl 参数缺失
- `浏览量不能为空`: viewCount 参数缺失
- `当日收益不能为空`: dailyEarnings 参数缺失
- `用户不存在`: 指定的用户 ID 不存在
- `账号不存在`: 指定的账号 ID 不存在
- `用户账号已被禁用`: 用户状态不为正常
- `账号已被禁用`: 账号状态不为正常
- `赛道类型必须是有效的数字`: trackType 格式错误
- `回传地址格式不正确`: callbackUrl 不是有效 URL
- `浏览量必须是有效的非负整数`: viewCount 格式错误
- `当日收益必须是有效的非负数`: dailyEarnings 格式错误

## 账号收益自动更新

### 功能说明

当添加或更新文章时，系统会自动将账号的 `currentAccountEarnings` 字段更新为当前文章的 `dailyEarnings` 值。

### 更新逻辑

1. **收益同步**: 每次更新文章时，将文章的 `dailyEarnings` 值同步到账号的 `currentAccountEarnings` 字段
2. **实时更新**: 确保账号的当前收益始终反映最新文章的收益数据
3. **数据一致性**: 保持文章收益和账号收益的数据一致性

### 使用场景

- 用户发布新文章并填写当日收益时，账号的当前收益会自动更新
- 用户修改已有文章的收益时，账号的当前收益也会同步更新
- 便于快速查看账号的最新收益情况

## 每日任务自动更新

### 功能说明

当添加或更新文章时，系统会自动检查该文章 ID 是否与账号的每日任务匹配，如果匹配则自动更新任务状态。

### 更新逻辑

1. **匹配检查**: 遍历账号的 `dailyTasks` 数组，查找 `articleId` 匹配的任务
2. **状态更新**: 如果找到匹配的未完成任务（`isCompleted: false`），自动将 `isCompleted` 设置为 `true`
3. **日志记录**: 记录任务状态更新的操作日志
4. **返回信息**: 在返回结果中包含任务更新状态

### 返回字段说明

- `dailyTasksUpdated`: 布尔值，表示是否有每日任务被更新
- `updatedTaskCount`: 数字，表示更新的任务数量（通常为 0 或 1）

### 示例场景

```javascript
// 用户完成每日任务，提交文章
const result = await wx.cloud.callFunction({
  name: "update-account-posts",
  data: {
    userId: "user123",
    accountId: "AC00001",
    articleId: "ART1_20241201_001", // 这个ID与每日任务匹配
    title: "美食探店分享",
    trackType: 1,
    callbackUrl: "https://example.com/callback/123",
  },
});

// 返回结果
{
  "success": true,
  "message": "文章添加成功，每日任务状态已更新",
  "data": {
    "operationType": "add",
    "dailyTasksUpdated": true,
    "updatedTaskCount": 1,
    // ... 其他字段
  }
}
```

## 注意事项

1. **时间字段**: 发布时间自动使用服务器时间，确保时间一致性
2. **数据完整性**: 所有必填字段都会进行验证
3. **状态检查**: 会检查用户和账号的状态，只有正常状态才能操作
4. **重复处理**: 相同 articleId 的文章会被更新而不是重复添加
5. **关联更新**: 会自动更新相关的统计字段
6. **每日任务同步**: 当文章 ID 与每日任务匹配时，自动更新任务状态为已完成
