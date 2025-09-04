# User-Info 数据库结构体规范

## 概述

本文档基于现有云函数代码分析，定义了 `user-info` 数据库中实际存在的字段结构，包括字段含义、数据类型、默认值，以及相关云函数的返回值规范。所有用户信息、账号信息、登录注册相关的云函数都基于此数据库。

## 数据库集合：user-info

### 主键字段

- `_id`: ObjectId (MongoDB 自动生成)
- `userId`: String (用户唯一标识符，使用微信 openid)

### 用户基础信息字段

| 字段名                | 类型   | 必填 | 默认值   | 说明                                     |
| --------------------- | ------ | ---- | -------- | ---------------------------------------- |
| `nickname`            | String | ✅   | -        | 用户昵称                                 |
| `phone`               | String | ✅   | -        | 用户手机号                               |
| `password`            | String | ✅   | -        | 用户密码（注意：实际项目中应该加密存储） |
| `status`              | Number | ✅   | 1        | 用户状态：1-正常，0-禁用                 |
| `userLevel`           | Number | ✅   | 1        | 用户等级，默认 1 级                      |
| `userType`            | Number | ✅   | 1        | 用户类型：1-普通用户，999-管理员         |
| `registerTimestamp`   | Date   | ✅   | 当前时间 | 注册时间                                 |
| `lastLoginTimestamp`  | Date   | ❌   | null     | 最后登录时间                             |
| `lastUpdateTimestamp` | Date   | ❌   | null     | 最后更新时间                             |
| `inviteCode`          | String | ❌   | null     | 邀请码                                   |

### 账号信息字段

| 字段名     | 类型  | 必填 | 默认值 | 说明         |
| ---------- | ----- | ---- | ------ | ------------ |
| `accounts` | Array | ❌   | []     | 用户账号数组 |

#### accounts 数组中的每个账号对象结构：

| 字段名                   | 类型    | 必填 | 默认值   | 说明                                   |
| ------------------------ | ------- | ---- | -------- | -------------------------------------- |
| `accountId`              | String  | ✅   | -        | 账号唯一标识符（格式：AC + 5 位数字）  |
| `trackType`              | Number  | ✅   | -        | 赛道类型                               |
| `platform`               | Number  | ✅   | -        | 平台类型                               |
| `phoneNumber`            | String  | ✅   | -        | 账号关联手机号                         |
| `accountNickname`        | String  | ✅   | -        | 账号昵称                               |
| `originalAccountId`      | String  | ✅   | -        | 原始账号 ID（用户输入的账号 ID）       |
| `registerDate`           | Date    | ❌   | null     | 账号注册日期                           |
| `isViolation`            | Boolean | ✅   | false    | 是否违规                               |
| `screenshotUrl`          | String  | ❌   | ""       | 账号截图 URL                           |
| `createTimestamp`        | Date    | ✅   | 当前时间 | 创建时间                               |
| `status`                 | Number  | ✅   | 1        | 账号状态：1-正常，0-禁用               |
| `auditStatus`            | Number  | ✅   | 0        | 审核状态：0-待审核，1-已通过，2-未通过 |
| `lastPostTime`           | Date    | ❌   | null     | 最后发文时间                           |
| `currentAccountEarnings` | Number  | ✅   | 0        | 当前账号收益                           |
| `posts`                  | Array   | ✅   | []       | 已发布的文章数据数组                   |
| `earnings`               | Array   | ✅   | []       | 收益数据数组                           |
| `dailyTasks`             | Array   | ✅   | []       | 每日任务数组                           |

#### posts 数组中的每个文章对象结构：

| 字段名          | 类型   | 必填 | 默认值 | 说明           |
| --------------- | ------ | ---- | ------ | -------------- |
| `articleId`     | String | ✅   | -      | 文章唯一标识符 |
| `title`         | String | ✅   | -      | 文章标题       |
| `trackType`     | Number | ✅   | -      | 赛道类型       |
| `publishTime`   | Date   | ✅   | -      | 发布时间       |
| `callbackUrl`   | String | ✅   | -      | 回传地址       |
| `viewCount`     | Number | ✅   | 0      | 浏览量         |
| `dailyEarnings` | Number | ✅   | 0      | 当日收益       |

#### earnings 数组中的每个收益对象结构：

| 字段名               | 类型   | 必填 | 默认值 | 说明                                   |
| -------------------- | ------ | ---- | ------ | -------------------------------------- |
| `startTime`          | Date   | ✅   | -      | 开始时间                               |
| `endTime`            | Date   | ✅   | -      | 结束时间                               |
| `monthlyPostCount`   | Number | ✅   | 0      | 月发布文章数                           |
| `settlementTime`     | Date   | ❌   | null   | 结算时间                               |
| `settlementStatus`   | Number | ✅   | 0      | 结算状态：0-未结算，1-待结算，2-已结算 |
| `settlementMethod`   | Number | ❌   | null   | 结算方式                               |
| `transferOrderNo`    | String | ❌   | null   | 转账订单号                             |
| `accountEarnings`    | Number | ✅   | 0      | 账号收益                               |
| `settlementEarnings` | Number | ✅   | 0      | 结算收益                               |
| `settlementImageUrl` | String | ❌   | null   | 结算单图片 URL                         |
| `transferImageUrl`   | String | ❌   | null   | 转账截图 URL                           |

#### dailyTasks 数组中的每个任务对象结构：

| 字段名         | 类型    | 必填 | 默认值 | 说明                                |
| -------------- | ------- | ---- | ------ | ----------------------------------- |
| `articleId`    | String  | ✅   | -      | 文章唯一标识符                      |
| `articleTitle` | String  | ✅   | -      | 文章标题                            |
| `trackType`    | Number  | ✅   | -      | 赛道类型                            |
| `platformType` | Number  | ✅   | -      | 平台类型                            |
| `downloadUrl`  | String  | ✅   | -      | 文章下载地址                        |
| `taskTime`     | Date    | ✅   | -      | 文章任务时间                        |
| `isCompleted`  | Boolean | ✅   | false  | 是否完成（通过检查 posts 数组判断） |

## 云函数返回值规范

### 1. 用户注册 (user-register)

**请求参数：**

```javascript
{
  nickname: String,
  phone: String,
  password: String,
  inviteCode: String
}
```

**返回值：**

```javascript
{
  success: Boolean,
  userId: String,
  nickname: String,
  phone: String,
  registerTimestamp: Date,
  userLevel: Number,
  userType: Number,
  deleteInvitation: Object,
  event: Object,
  openid: String,
  appid: String,
  unionid: String
}
```

### 2. 用户登录 (user-login)

**请求参数：**

```javascript
{
  openid: String (可选),
  phone: String (可选),
  password: String (可选)
}
```

**返回值：**

```javascript
{
  success: Boolean,
  message: String,
  userId: String,
  nickname: String,
  phone: String,
  userLevel: Number,
  userType: Number,
  status: Number,
  registerTimestamp: Date,
  lastLoginTimestamp: Date,
  openid: String,
  appid: String,
  unionid: String
}
```

### 3. 获取用户信息 (get-user-info)

**请求参数：**

```javascript
{
  openid: String(可选);
}
```

**返回值：**

```javascript
{
  success: Boolean,
  message: String,
  userInfo: {
    userId: String,
    nickname: String,
    phone: String,
    userLevel: Number,
    userType: Number,
    status: Number,
    registerTimestamp: Date,
    lastLoginTimestamp: Date,
    inviteCode: String,
    accounts: Array
  },
  queryContext: {
    targetOpenId: String,
    currentOpenId: String,
    isSelfQuery: Boolean,
    appid: String,
    unionid: String
  }
}
```

### 4. 添加用户账号 (add-user-account)

**请求参数：**

```javascript
{
  trackType: Number,
  platform: Number,
  phoneNumber: String,
  accountNickname: String,
  accountId: String,
  registerDate: String (可选),
  isViolation: Boolean (可选),
  screenshotUrl: String (可选)
}
```

**返回值：**

```javascript
{
  success: Boolean,
  message: String,
  accountData: {
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
    status: Number,
    auditStatus: Number,
    currentAccountEarnings: Number,
    posts: Array,
    lastPostTime: Date
  },
  totalAccounts: Number,
  event: Object,
  openid: String,
  appid: String,
  unionid: String
}
```

### 5. 更新用户账号 (update-user-account)

**请求参数：**

```javascript
{
  userId: String,
  accountId: String,
  updateFields: {
    trackType: Number (可选),
    platform: Number (可选),
    phoneNumber: String (可选),
    accountNickname: String (可选),
    originalAccountId: String (可选),
    registerDate: Date (可选),
    isViolation: Boolean (可选),
    screenshotUrl: String (可选),
    status: Number (可选),
    auditStatus: Number (可选),
    currentAccountEarnings: Number (可选),
    lastPostTime: Date (可选)
  }
}
```

**返回值：**

```javascript
{
  success: Boolean,
  message: String,
  userInfo: {
    userId: String,
    nickname: String,
    phone: String,
    userLevel: Number,
    userType: Number,
    status: Number,
    registerTimestamp: Date,
    lastLoginTimestamp: Date,
    inviteCode: String,
    accounts: Array
  },
  accountData: Object,
  updatedFields: Object,
  event: Object,
  openid: String,
  appid: String,
  unionid: String
}
```

### 6. 更新用户账号文章 (update-account-posts)

**请求参数：**

```javascript
{
  userId: String,
  accountId: String,
  articleId: String,
  title: String,
  trackType: Number,
  callbackUrl: String
}
```

**返回值：**

```javascript
{
  success: Boolean,
  message: String,
  data: {
    operationType: String, // "add" 或 "update"
    postData: {
      articleId: String,
      title: String,
      trackType: Number,
      publishTime: Date,
      callbackUrl: String
    },
    accountId: String,
    totalPosts: Number
  },
  event: Object,
  openid: String,
  appid: String,
  unionid: String
}
```

## 字段验证规则

### 用户基础信息验证

- `nickname`: 必填，长度不能少于 2 位
- `phone`: 必填，必须是有效的手机号格式 `/^1[3-9]\d{9}$/`
- `password`: 必填，长度不能少于 6 位
- `status`: 只能是 0 或 1
- `userLevel`: 必须是非负整数
- `userType`: 只能是 1 或 999

### 账号信息验证

- `accountId`: 必填，不能为空，格式为 "AC" + 5 位数字
- `platform`: 必填，必须是有效的平台枚举值
- `trackType`: 必填，必须是有效的赛道枚举值
- `accountNickname`: 必填，不能为空
- `phoneNumber`: 必填，必须是有效的手机号格式
- `originalAccountId`: 必填，不能为空
- `status`: 只能是 0 或 1
- `auditStatus`: 只能是 0、1 或 2
- `currentAccountEarnings`: 必须是非负数
- `registerDate`: 如果提供，必须是有效的日期格式，不能大于当前时间，不能过于久远（超过 10 年）
- `dailyTasks`: 必须是数组类型，数组中的每个元素必须是有效的任务对象

### 文章信息验证

- `articleId`: 必填，不能为空，必须是唯一的文章标识符
- `trackType`: 必填，必须是有效的赛道枚举值
- `publishTime`: 必填，必须是有效的日期格式，不能大于当前时间
- `callbackUrl`: 必填，必须是有效的 URL 格式
- `viewCount`: 必须是非负整数
- `dailyEarnings`: 必须是非负数

### 每日任务验证

- `articleId`: 必填，不能为空，必须是有效的文章标识符
- `articleTitle`: 必填，不能为空，文章标题长度不能超过 200 字符
- `trackType`: 必填，必须是有效的赛道枚举值
- `platformType`: 必填，必须是有效的平台枚举值
- `downloadUrl`: 必填，必须是有效的 URL 格式
- `taskTime`: 必填，必须是有效的日期格式，不能大于当前时间
- `isCompleted`: 必填，必须是布尔值（true/false）

### 收益信息验证

- `startTime`: 必填，必须是有效的日期格式
- `endTime`: 必填，必须是有效的日期格式，且不能早于 startTime
- `monthlyPostCount`: 必须是非负整数
- `settlementTime`: 如果提供，必须是有效的日期格式
- `settlementStatus`: 只能是 0、1 或 2（0-未结算，1-待结算，2-已结算）
- `settlementMethod`: 如果提供，必须是有效的结算方式枚举值
- `transferOrderNo`: 如果提供，不能为空字符串
- `accountEarnings`: 必须是非负数
- `settlementEarnings`: 必须是非负数
- `settlementImageUrl`: 如果提供，必须是有效的 URL 格式
- `transferImageUrl`: 如果提供，必须是有效的 URL 格式

## 注意事项

1. **时间字段**: 所有时间字段都使用 `Date` 类型，在数据库中存储为 `ISODate`
2. **数组字段**: `accounts`、`posts` 和 `earnings` 字段都是数组类型
3. **布尔字段**: `isViolation` 使用 `Boolean` 类型
4. **枚举字段**: `platform`、`trackType`、`status`、`auditStatus`、`userType`、`userLevel`、`isSettled`、`settlementMethod` 使用 `Number` 类型
5. **可选字段**: 标记为 ❌ 的字段在创建时可以不提供，会使用默认值
6. **必填字段**: 标记为 ✅ 的字段在创建时必须提供
7. **账号 ID 生成**: 系统自动生成账号 ID，格式为 "AC" + 5 位数字（从 00001 开始）
8. **重复检查**: 同一平台下不能存在相同的 `originalAccountId`

## 版本历史

- **v1.0**: 基于现有云函数代码分析，整理实际存在的数据库字段结构
- **v1.1**: 新增 earnings 收益数据数组字段结构
- **v1.2**: 新增 posts 文章数据数组字段结构
- **v1.3**: 在 posts 数组中新增 callbackUrl 回传地址字段
- **v1.4**: 在 accounts 数组中新增 dailyTasks 每日任务数组字段结构
- **v1.5**: 在 dailyTasks 数组中新增 isCompleted 是否完成字段
- **v1.6**: 简化 posts 数组结构，删除未使用的 title、downloadUrl、platform 字段
- **v1.7**: 新增 update-account-posts 云函数，支持添加和更新用户账号文章
- **v1.8**: 在 dailyTasks 数组中新增 articleTitle、trackType、platformType、downloadUrl 字段
- **v1.9**: 在 posts 数组中新增 viewCount 浏览量、dailyEarnings 当日收益字段，在 accounts 数组中新增 currentAccountEarnings 当前账号收益字段，删除 dailyPostCount 字段
