# admin-user-permissions-query 云函数

## 功能描述

用户权限查询云函数，用于查询不同状态的用户和账号信息，支持以下三种查询类型：

1. **查询禁用用户** (queryType: 1) - 查询用户状态为禁用的用户信息和账号信息
2. **查询禁用账号** (queryType: 2) - 查询账号状态为禁用的用户信息和账号信息  
3. **查询待审核账号** (queryType: 3) - 查询审核状态为待审核的用户信息和账号信息

## 请求参数

```javascript
{
  queryType: Number  // 必填，查询类型：1-禁用用户，2-禁用账号，3-待审核账号
}
```

### 参数说明

- `queryType`: 查询枚举类型
  - `1`: 查询禁用用户（用户 status = 0）
  - `2`: 查询禁用账号（账号 status = 0）
  - `3`: 查询待审核账号（账号 auditStatus = 0）

## 返回值

### 成功响应

```javascript
{
  success: true,
  message: "查询成功",
  data: Array,        // 查询结果数组
  queryType: Number,  // 查询类型
  total: Number,      // 结果总数
  timestamp: Date,    // 查询时间戳
  openid: String,     // 调用者 openid
  appid: String,      // 小程序 appid
  unionid: String     // 用户 unionid
}
```

### 错误响应

```javascript
{
  success: false,
  message: String,    // 错误信息
  code: Number,       // 错误码
  error: String       // 详细错误信息（仅开发环境）
}
```

## 查询结果数据结构

### 1. 禁用用户查询 (queryType: 1)

返回完整的用户信息，包含统计数据：

```javascript
{
  _id: ObjectId,
  userId: String,
  nickname: String,
  phone: String,
  status: Number,                    // 用户状态（0-禁用）
  userLevel: Number,
  userType: Number,
  registerTimestamp: Date,
  lastLoginTimestamp: Date,
  lastUpdateTimestamp: Date,
  inviteCode: String,
  accounts: Array,                   // 完整账号数组
  totalAccounts: Number,             // 总账号数
  activeAccounts: Number,            // 正常账号数
  disabledAccounts: Number,          // 禁用账号数
  pendingAuditAccounts: Number       // 待审核账号数
}
```

### 2. 禁用账号查询 (queryType: 2)

返回用户基础信息 + 禁用账号详情：

```javascript
{
  _id: ObjectId,
  userId: String,
  nickname: String,
  phone: String,
  status: Number,                    // 用户状态
  userLevel: Number,
  userType: Number,
  registerTimestamp: Date,
  lastLoginTimestamp: Date,
  // 账号详细信息
  accountId: String,
  trackType: Number,
  platform: Number,
  phoneNumber: String,
  accountNickname: String,
  originalAccountId: String,
  registerDate: Date,
  isViolation: Boolean,
  screenshotUrl: String,
  createTimestamp: Date,
  accountStatus: Number,             // 账号状态（0-禁用）
  auditStatus: Number,
  lastPostTime: Date,
  currentAccountEarnings: Number,
  totalPosts: Number,                // 发布文章总数
  totalRejectPosts: Number,          // 拒绝文章总数
  totalDailyTasks: Number            // 每日任务总数
}
```

### 3. 待审核账号查询 (queryType: 3)

返回用户基础信息 + 待审核账号详情：

```javascript
{
  _id: ObjectId,
  userId: String,
  nickname: String,
  phone: String,
  status: Number,                    // 用户状态
  userLevel: Number,
  userType: Number,
  registerTimestamp: Date,
  lastLoginTimestamp: Date,
  // 账号详细信息
  accountId: String,
  trackType: Number,
  platform: Number,
  phoneNumber: String,
  accountNickname: String,
  originalAccountId: String,
  registerDate: Date,
  isViolation: Boolean,
  screenshotUrl: String,
  createTimestamp: Date,
  accountStatus: Number,
  auditStatus: Number,               // 审核状态（0-待审核）
  lastPostTime: Date,
  currentAccountEarnings: Number,
  totalPosts: Number,                // 发布文章总数
  totalRejectPosts: Number,          // 拒绝文章总数
  totalDailyTasks: Number,           // 每日任务总数
  daysSinceCreation: Number          // 创建天数
}
```

## 性能优化特性

### 1. 聚合查询优化

- 使用 MongoDB 聚合管道进行高效查询
- 利用 `$match` 进行索引优化的条件筛选
- 使用 `$unwind` 展开嵌套数组进行精确匹配
- 通过 `$project` 只返回需要的字段，减少网络传输

### 2. 索引建议

为提高查询性能，建议在以下字段上创建索引：

```javascript
// 用户状态索引
db.getCollection('user-info').createIndex({ "status": 1 })

// 账号状态索引
db.getCollection('user-info').createIndex({ "accounts.status": 1 })

// 账号审核状态索引
db.getCollection('user-info').createIndex({ "accounts.auditStatus": 1 })



// 复合索引优化
db.getCollection('user-info').createIndex({ 
  "accounts.status": 1, 
  "accounts.createTimestamp": -1 
})
```

### 3. 查询优化策略

- **禁用用户查询**: 直接匹配用户状态，返回完整用户信息和统计数据
- **禁用账号查询**: 先匹配有禁用账号的用户，再展开筛选，避免全表扫描
- **待审核账号查询**: 按创建时间正序排列，优先处理较早的申请

## 错误码说明

- `400`: 参数错误
- `500`: 服务器内部错误

## 使用示例

### 查询禁用用户

```javascript
// 小程序端调用
wx.cloud.callFunction({
  name: 'admin-user-permissions-query',
  data: {
    queryType: 1
  }
}).then(res => {
  console.log('禁用用户列表:', res.result.data)
})
```

### 查询禁用账号

```javascript
wx.cloud.callFunction({
  name: 'admin-user-permissions-mgr',
  data: {
    queryType: 2
  }
}).then(res => {
  console.log('禁用账号列表:', res.result.data)
})
```

### 查询待审核账号

```javascript
wx.cloud.callFunction({
  name: 'admin-user-permissions-mgr',
  data: {
    queryType: 3
  }
}).then(res => {
  console.log('待审核账号列表:', res.result.data)
})
```

## 注意事项

1. **数据量**: 对于大量数据，建议前端实现分页加载
2. **缓存策略**: 可考虑在前端缓存查询结果，避免频繁请求
3. **监控告警**: 建议监控待审核账号数量，及时处理审核请求
4. **日志记录**: 所有查询操作都会记录在云函数日志中

## 版本历史

- **v1.0**: 初始版本，支持三种查询类型的用户权限管理