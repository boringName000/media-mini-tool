# get-user-info 云函数

## 功能描述

获取用户信息的云函数，支持根据 openid 查询用户信息。

## 主要功能

1. **获取当前用户信息** - 根据当前用户的 openid 获取用户信息
2. **获取指定用户信息** - 根据传入的 openid 获取指定用户信息
3. **用户状态验证** - 检查用户是否存在和状态是否正常
4. **安全过滤** - 返回用户信息时不包含敏感数据（如密码）
5. **每日任务更新** - 自动调用 create-daily-tasks 云函数更新每日任务数据

## 接口参数

### 输入参数

```javascript
{
  openid: "string"; // 可选，要查询的用户 openid，不传则查询当前用户
}
```

### 返回结果

#### 成功响应

```javascript
{
  success: true,
  message: "获取用户信息成功",
  userInfo: {
    userId: "string",           // 用户ID（openid）
    nickname: "string",         // 用户昵称
    phone: "string",           // 手机号
    userLevel: 1,              // 用户等级
    userType: 1,               // 用户类型
    status: 1,                 // 用户状态（1=启用）
    registerTimestamp: Date,   // 注册时间
    lastLoginTimestamp: Date,  // 最后登录时间
    inviteCode: "string"       // 邀请码
  },
  queryContext: {
    targetOpenId: "string",    // 查询的目标 openid
    currentOpenId: "string",   // 当前用户的 openid
    isSelfQuery: true,         // 是否是查询自己的信息
    appid: "string",           // 小程序 appid
    unionid: "string"          // 用户 unionid
  },
  dailyTasksUpdate: {          // 每日任务更新结果
    success: true,             // 更新是否成功
    message: "string",         // 更新结果消息
    data: {                    // 更新结果数据
      totalTasksCreated: 0,    // 新创建的任务数量
      totalTasksSkipped: 0,    // 跳过的任务数量
      totalTasksContinued: 0,  // 继续使用的任务数量
      updatedAccounts: []      // 更新的账号列表
    }
  }
}
```

#### 失败响应

```javascript
{
  success: false,
  error: "错误信息",
  userId: "string",           // 查询的用户ID（如果相关）
  openid: "string",           // 当前用户 openid
  appid: "string",            // 小程序 appid
  unionid: "string"           // 用户 unionid
}
```

## 使用示例

### 1. 在小程序中调用

```javascript
// 获取当前用户信息
const userInfoUtils = require("../../utils/userInfoUtils");

// 方法1：获取当前用户信息
const result = await userInfoUtils.getCurrentUserInfo();
if (result.success) {
  console.log("用户信息：", result.userInfo);
} else {
  console.error("获取失败：", result.error);
}

// 方法2：根据 openid 获取指定用户信息
const targetOpenId = "xxx";
const userResult = await userInfoUtils.getUserInfoByOpenId(targetOpenId);
if (userResult.success) {
  console.log("用户信息：", userResult.userInfo);
} else {
  console.error("获取失败：", userResult.error);
}

// 方法3：刷新并更新本地用户信息
const refreshResult = await userInfoUtils.refreshUserInfo();
if (refreshResult.success) {
  console.log("用户信息已更新");
} else {
  console.error("更新失败：", refreshResult.error);
}
```

### 2. 直接调用云函数

```javascript
// 获取当前用户信息
wx.cloud
  .callFunction({
    name: "get-user-info",
    data: {},
  })
  .then((res) => {
    if (res.result.success) {
      console.log("用户信息：", res.result.userInfo);
    } else {
      console.error("获取失败：", res.result.error);
    }
  })
  .catch((err) => {
    console.error("调用失败：", err);
  });

// 获取指定用户信息
wx.cloud
  .callFunction({
    name: "get-user-info",
    data: {
      openid: "要查询的用户openid",
    },
  })
  .then((res) => {
    if (res.result.success) {
      console.log("用户信息：", res.result.userInfo);
    } else {
      console.error("获取失败：", res.result.error);
    }
  })
  .catch((err) => {
    console.error("调用失败：", err);
  });
```

## 错误处理

### 常见错误

1. **用户不存在**

   ```javascript
   {
     success: false,
     error: "用户不存在",
     userId: "查询的用户ID"
   }
   ```

2. **用户账号被禁用**

   ```javascript
   {
     success: false,
     error: "用户账号已被禁用",
     userId: "用户ID",
     status: 0
   }
   ```

3. **缺少用户标识**
   ```javascript
   {
     success: false,
     error: "缺少用户标识"
   }
   ```

### 每日任务更新错误

每日任务更新失败不会影响主流程，但会在日志中记录错误信息：

```javascript
// 每日任务更新失败时的返回值
{
  success: true,
  message: "获取用户信息成功",
  userInfo: { /* 用户信息 */ },
  queryContext: { /* 查询上下文 */ },
  dailyTasksUpdate: null  // 更新失败时为 null
}
```

## 安全考虑

1. **敏感信息过滤** - 返回的用户信息不包含密码等敏感数据
2. **状态验证** - 只返回状态正常的用户信息
3. **权限控制** - 可以扩展添加权限验证逻辑

## 部署说明

### 1. 安装依赖

```bash
cd cloudfunctions/get-user-info
npm install
```

### 2. 部署云函数

```bash
# 使用部署脚本
./scripts/clouddeploy/deploy-get-user-info.sh

# 或手动部署
wx cloud functions deploy get-user-info --env your-env-id
```

## 数据库要求

云函数依赖 `user-info` 集合，用户数据结构应包含：

```javascript
{
  userId: "string",           // 用户ID（openid）
  nickname: "string",         // 昵称
  phone: "string",           // 手机号
  password: "string",        // 密码（不会返回）
  userLevel: 1,              // 用户等级
  userType: 1,               // 用户类型
  status: 1,                 // 状态（1=启用）
  registerTimestamp: Date,   // 注册时间
  lastLoginTimestamp: Date,  // 最后登录时间
  inviteCode: "string"       // 邀请码
}
```

## 注意事项

1. **性能考虑** - 建议对频繁调用的用户信息进行缓存
2. **错误处理** - 调用时应该处理网络错误和业务错误
3. **权限扩展** - 可以根据需要添加更细粒度的权限控制
4. **数据同步** - 用户信息更新后需要同步更新本地缓存
5. **每日任务更新** - 每次获取用户信息时会自动更新每日任务状态
6. **容错处理** - 每日任务更新失败不会影响用户信息获取
