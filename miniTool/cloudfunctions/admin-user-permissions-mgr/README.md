# admin-user-permissions-mgr 云函数

## 功能描述

管理员用户权限管理云函数，用于更新用户和账号的状态信息，支持以下三种操作类型：

1. **更新用户状态** (operationType: 1) - 更新用户的启用/禁用状态
2. **更新账号状态** (operationType: 2) - 更新指定账号的启用/禁用状态
3. **更新账号审核状态** (operationType: 3) - 更新指定账号的审核状态，审核未通过时自动禁用账号

## 请求参数

```javascript
{
  operationType: Number,  // 必填，操作类型：1-更新用户状态，2-更新账号状态，3-更新账号审核状态
  userId: String,         // 必填，用户ID
  accountId: String,      // 可选，账号ID（操作类型2和3时必填）
  statusValue: Number     // 必填，状态值（根据操作类型不同含义不同）
}
```

### 参数说明

#### operationType - 操作类型
- `1`: 更新用户状态
- `2`: 更新账号状态
- `3`: 更新账号审核状态

#### statusValue - 状态值
根据操作类型不同，状态值的含义如下：

**操作类型1（更新用户状态）：**
- `0`: 禁用用户
- `1`: 启用用户

**操作类型2（更新账号状态）：**
- `0`: 禁用账号
- `1`: 启用账号

**操作类型3（更新账号审核状态）：**
- `0`: 待审核
- `1`: 审核通过
- `2`: 审核未通过（会自动禁用账号）

## 返回值

### 成功响应

```javascript
{
  success: true,
  message: "操作成功",
  data: Object,           // 操作结果详情
  operationType: Number,  // 操作类型
  userId: String,         // 用户ID
  accountId: String,      // 账号ID（如果有）
  statusValue: Number,    // 状态值
  timestamp: Date,        // 操作时间戳
  openid: String,         // 调用者 openid
  appid: String,          // 小程序 appid
  unionid: String         // 用户 unionid
}
```

### 错误响应

```javascript
{
  success: false,
  message: String,        // 错误信息
  code: Number,           // 错误码
  error: String           // 详细错误信息（仅开发环境）
}
```

## 操作结果数据结构

### 1. 更新用户状态 (operationType: 1)

```javascript
{
  operationType: "updateUserStatus",
  userId: String,
  oldStatus: Number,              // 原状态
  newStatus: Number,              // 新状态
  updateCount: Number,            // 更新记录数
  userInfo: {
    userId: String,
    nickname: String,
    phone: String,
    userLevel: Number,
    userType: Number,
    registerTimestamp: Date,
    totalAccounts: Number         // 总账号数
  }
}
```

### 2. 更新账号状态 (operationType: 2)

```javascript
{
  operationType: "updateAccountStatus",
  userId: String,
  accountId: String,
  oldStatus: Number,              // 原账号状态
  newStatus: Number,              // 新账号状态
  updateCount: Number,            // 更新记录数
  userInfo: {
    userId: String,
    nickname: String,
    phone: String,
    userLevel: Number,
    userType: Number,
    registerTimestamp: Date
  },
  accountInfo: {
    accountId: String,
    trackType: Number,
    platform: Number,
    accountNickname: String,
    phoneNumber: String,
    auditStatus: Number,
    createTimestamp: Date
  }
}
```

### 3. 更新账号审核状态 (operationType: 3)

```javascript
{
  operationType: "updateAccountAuditStatus",
  userId: String,
  accountId: String,
  oldAuditStatus: Number,         // 原审核状态
  newAuditStatus: Number,         // 新审核状态
  oldAccountStatus: Number,       // 原账号状态
  newAccountStatus: Number,       // 新账号状态
  updateCount: Number,            // 更新记录数
  autoDisabled: Boolean,          // 是否自动禁用了账号
  userInfo: {
    userId: String,
    nickname: String,
    phone: String,
    userLevel: Number,
    userType: Number,
    registerTimestamp: Date
  },
  accountInfo: {
    accountId: String,
    trackType: Number,
    platform: Number,
    accountNickname: String,
    phoneNumber: String,
    status: Number,
    createTimestamp: Date
  }
}
```

## 业务逻辑说明

### 1. 用户状态更新
- 直接更新用户的 `status` 字段
- 同时更新 `lastUpdateTimestamp` 为当前时间
- 返回用户基础信息和账号统计

### 2. 账号状态更新
- 使用聚合管道精确定位指定账号
- 使用位置操作符 `$` 更新数组中的特定账号
- 同时更新 `lastUpdateTimestamp` 为当前时间
- 返回用户信息和账号详情

### 3. 账号审核状态更新
- 更新账号的 `auditStatus` 字段
- **特殊逻辑**：如果审核状态设为未通过(2)，自动将账号状态设为禁用(0)
- 同时更新 `lastUpdateTimestamp` 为当前时间
- 返回详细的状态变更信息

## 性能优化特性

### 1. 聚合查询优化
- 使用 MongoDB 聚合管道进行精确查询
- 利用 `$match` 进行索引优化的条件筛选
- 使用 `$filter` 筛选特定账号，避免返回无关数据
- 通过 `$project` 只返回需要的字段

### 2. 原子性更新
- 使用 MongoDB 的原子更新操作
- 利用位置操作符 `$` 精确更新数组元素
- 确保数据一致性和并发安全

### 3. 索引建议

为提高查询和更新性能，建议创建以下索引：

```javascript
// 用户ID索引
db.getCollection('user-info').createIndex({ "userId": 1 })

// 账号ID复合索引
db.getCollection('user-info').createIndex({ 
  "userId": 1, 
  "accounts.accountId": 1 
})

// 用户状态索引
db.getCollection('user-info').createIndex({ "status": 1 })

// 账号状态复合索引
db.getCollection('user-info').createIndex({ 
  "accounts.status": 1,
  "accounts.auditStatus": 1 
})
```

## 错误码说明

- `400`: 参数错误
- `500`: 服务器内部错误

## 使用示例

### 更新用户状态

```javascript
// 禁用用户
wx.cloud.callFunction({
  name: 'admin-user-permissions-mgr',
  data: {
    operationType: 1,
    userId: 'user123',
    statusValue: 0  // 禁用
  }
}).then(res => {
  console.log('用户状态更新结果:', res.result.data)
})

// 启用用户
wx.cloud.callFunction({
  name: 'admin-user-permissions-mgr',
  data: {
    operationType: 1,
    userId: 'user123',
    statusValue: 1  // 启用
  }
})
```

### 更新账号状态

```javascript
// 禁用账号
wx.cloud.callFunction({
  name: 'admin-user-permissions-mgr',
  data: {
    operationType: 2,
    userId: 'user123',
    accountId: 'AC00001',
    statusValue: 0  // 禁用
  }
}).then(res => {
  console.log('账号状态更新结果:', res.result.data)
})

// 启用账号
wx.cloud.callFunction({
  name: 'admin-user-permissions-mgr',
  data: {
    operationType: 2,
    userId: 'user123',
    accountId: 'AC00001',
    statusValue: 1  // 启用
  }
})
```

### 更新账号审核状态

```javascript
// 审核通过
wx.cloud.callFunction({
  name: 'admin-user-permissions-mgr',
  data: {
    operationType: 3,
    userId: 'user123',
    accountId: 'AC00001',
    statusValue: 1  // 审核通过
  }
}).then(res => {
  console.log('审核结果:', res.result.data)
})

// 审核未通过（会自动禁用账号）
wx.cloud.callFunction({
  name: 'admin-user-permissions-mgr',
  data: {
    operationType: 3,
    userId: 'user123',
    accountId: 'AC00001',
    statusValue: 2  // 审核未通过
  }
}).then(res => {
  console.log('审核结果:', res.result.data)
  console.log('是否自动禁用:', res.result.data.autoDisabled)
})
```

## 注意事项

1. **参数验证**: 所有必填参数都会进行严格验证
2. **状态值验证**: 不同操作类型对应的状态值范围不同，会进行验证
3. **数据一致性**: 使用原子操作确保数据更新的一致性
4. **审核逻辑**: 审核未通过时会自动禁用账号，这是业务逻辑要求
5. **错误处理**: 详细的错误信息帮助定位问题
6. **日志记录**: 所有操作都会记录在云函数日志中
7. **权限控制**: 建议在前端或网关层添加管理员权限验证

## 版本历史

- **v1.0**: 初始版本，支持用户状态、账号状态、账号审核状态的更新操作