# admin-get-user-info 云函数

## 功能描述

管理员获取用户信息云函数，用于根据不同查询条件获取用户的完整数据信息。支持以下三种查询方式：

1. **按用户ID查询** - 精确匹配用户ID，返回单个用户信息
2. **按手机号查询** - 精确匹配手机号，可能返回单个用户信息
3. **按昵称查询** - 模糊匹配昵称，可能返回多个用户信息

## 请求参数

```javascript
{
  userId: String,    // 可选，用户ID（精确匹配）
  phone: String,     // 可选，手机号（精确匹配）
  nickname: String   // 可选，用户昵称（模糊匹配，不区分大小写）
}
```

### 参数说明

- **至少需要提供一个参数**：`userId`、`phone` 或 `nickname`
- **查询优先级**：如果同时提供多个参数，按 `userId` > `phone` > `nickname` 的优先级进行查询
- **模糊匹配**：昵称支持部分匹配和不区分大小写搜索
- **精确匹配**：用户ID和手机号必须完全匹配

## 返回值

### 成功响应

```javascript
{
  success: true,
  message: "查询成功",
  data: Array,              // 用户数据数组
  queryParams: {            // 查询参数
    userId: String,
    phone: String,
    nickname: String
  },
  total: Number,            // 结果总数
  queryType: String,        // 查询类型：userId/phone/nickname
  timestamp: Date,          // 查询时间戳
  openid: String,           // 调用者 openid
  appid: String,            // 小程序 appid
  unionid: String           // 用户 unionid
}
```

### 错误响应

```javascript
{
  success: false,
  message: String,          // 错误信息
  code: Number,             // 错误码
  error: String             // 详细错误信息（仅开发环境）
}
```

## 返回数据结构

### 用户信息结构

```javascript
{
  _id: ObjectId,
  userId: String,
  nickname: String,
  phone: String,
  // password 字段不会返回（安全考虑）
  status: Number,                    // 用户状态：1-正常，0-禁用
  userLevel: Number,                 // 用户等级
  userType: Number,                  // 用户类型：1-普通用户，999-管理员
  registerTimestamp: Date,           // 注册时间
  lastLoginTimestamp: Date,          // 最后登录时间
  lastUpdateTimestamp: Date,         // 最后更新时间
  inviteCode: String,                // 邀请码
  
  // 账号数组（完整数据）
  accounts: Array,
  
  // 统计信息
  totalAccounts: Number,             // 总账号数
  activeAccounts: Number,            // 正常账号数
  disabledAccounts: Number,          // 禁用账号数
  pendingAuditAccounts: Number,      // 待审核账号数
  approvedAccounts: Number,          // 已通过审核账号数
  rejectedAccounts: Number,          // 审核未通过账号数
  totalPosts: Number,                // 总发文数
  totalRejectPosts: Number           // 总拒绝文章数
}
```

### 账号信息结构（增强版）

每个账号对象包含完整的账号数据，并添加了统计信息：

```javascript
{
  // 基础账号信息
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
  status: Number,                    // 账号状态
  auditStatus: Number,               // 审核状态
  lastPostTime: Date,                // 最后发文时间
  currentAccountEarnings: Number,    // 当前账号收益
  
  // 完整数据数组
  posts: Array,                      // 已发布文章数组
  rejectPosts: Array,                // 已拒绝文章数组
  earnings: Array,                   // 收益数据数组
  dailyTasks: Array,                 // 每日任务数组
  
  // 统计信息（自动计算）
  totalPosts: Number,                // 发布文章总数
  totalRejectPosts: Number,          // 拒绝文章总数
  totalEarnings: Number,             // 收益记录总数
  completedTasks: Number,            // 完成任务数
  claimedTasks: Number,              // 已领取任务数
  lastPostTime: Number               // 最近发文时间戳
}
```

## 查询类型说明

### 1. 按用户ID查询 (queryType: "userId")

```javascript
// 精确匹配，通常返回0或1个结果
wx.cloud.callFunction({
  name: 'admin-get-user-info',
  data: {
    userId: 'oXYZ123456789'
  }
})
```

### 2. 按手机号查询 (queryType: "phone")

```javascript
// 精确匹配，通常返回0或1个结果
wx.cloud.callFunction({
  name: 'admin-get-user-info',
  data: {
    phone: '13800138000'
  }
})
```

### 3. 按昵称查询 (queryType: "nickname")

```javascript
// 模糊匹配，可能返回多个结果
wx.cloud.callFunction({
  name: 'admin-get-user-info',
  data: {
    nickname: '张三'  // 会匹配包含"张三"的所有昵称
  }
})
```

## 性能优化特性

### 1. 聚合管道优化

- 使用 MongoDB 聚合管道进行高效查询
- 利用 `$match` 进行索引优化的条件筛选
- 通过 `$project` 排除敏感字段（如密码）
- 使用聚合函数计算统计信息，减少客户端计算

### 2. 智能统计计算

- 在数据库层面计算各种统计信息
- 使用 `$size`、`$filter`、`$sum`、`$map` 等聚合操作符
- 避免在应用层进行大量数据处理

### 3. 索引建议

为提高查询性能，建议创建以下索引：

```javascript
// 用户ID索引（通常已存在）
db.getCollection('user-info').createIndex({ "userId": 1 })

// 手机号索引
db.getCollection('user-info').createIndex({ "phone": 1 })

// 昵称索引（支持模糊查询）
db.getCollection('user-info').createIndex({ "nickname": "text" })

// 复合索引
db.getCollection('user-info').createIndex({ 
  "status": 1, 
  "registerTimestamp": -1 
})
```

## 使用示例

### 查询指定用户

```javascript
// 按用户ID查询
wx.cloud.callFunction({
  name: 'admin-get-user-info',
  data: {
    userId: 'oXYZ123456789'
  }
}).then(res => {
  if (res.result.success && res.result.total > 0) {
    const user = res.result.data[0]
    console.log('用户信息:', user)
    console.log('账号数量:', user.totalAccounts)
    console.log('总发文数:', user.totalPosts)
  }
})
```

### 按手机号查询

```javascript
wx.cloud.callFunction({
  name: 'admin-get-user-info',
  data: {
    phone: '13800138000'
  }
}).then(res => {
  console.log('查询结果:', res.result.data)
})
```

### 按昵称模糊查询

```javascript
wx.cloud.callFunction({
  name: 'admin-get-user-info',
  data: {
    nickname: '张'  // 查找昵称包含"张"的所有用户
  }
}).then(res => {
  console.log('找到用户数量:', res.result.total)
  res.result.data.forEach(user => {
    console.log(`用户: ${user.nickname}, 手机: ${user.phone}`)
  })
})
```

## 安全特性

### 1. 数据安全
- **密码字段不返回**：确保用户密码不会被泄露
- **完整数据访问**：返回用户的所有非敏感信息

### 2. 查询安全
- **参数验证**：严格验证输入参数
- **错误处理**：详细的错误信息帮助调试

## 错误码说明

- `400`: 参数错误（未提供任何查询参数）
- `500`: 服务器内部错误

## 注意事项

1. **查询优先级**: 如果同时提供多个参数，按 userId > phone > nickname 优先级查询
2. **模糊匹配**: 昵称查询支持部分匹配，可能返回多个结果
3. **数据完整性**: 返回用户的完整数据，包括所有账号、文章、任务等信息
4. **性能考虑**: 对于大量数据，建议在前端实现分页显示
5. **权限控制**: 建议在调用前验证管理员权限
6. **敏感信息**: 密码字段已自动排除，确保数据安全

## 版本历史

- **v1.0**: 初始版本，支持按用户ID、手机号、昵称查询用户完整信息