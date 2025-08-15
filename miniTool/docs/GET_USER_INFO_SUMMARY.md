# get-user-info 云函数实现总结

## 概述

为你的微信小程序项目新增了一个 `get-user-info` 云函数，用于根据用户的 openid 获取用户信息。

## 实现内容

### 1. 云函数核心文件

#### `cloudfunctions/get-user-info/index.js`

- **主要功能**：根据 openid 查询用户信息
- **支持模式**：
  - 不传 openid：获取当前用户信息
  - 传入 openid：获取指定用户信息
- **安全特性**：
  - 过滤敏感信息（如密码）
  - 验证用户状态
  - 完善的错误处理

#### `cloudfunctions/get-user-info/config.json`

- 云函数配置文件
- 设置 API 权限

#### `cloudfunctions/get-user-info/package.json`

- 依赖管理文件
- 包含 `wx-server-sdk` 依赖

### 2. 小程序端工具函数

#### `miniprogram/utils/userInfoUtils.js`

提供了便捷的用户信息获取方法：

- `getCurrentUserInfo()` - 获取当前用户信息
- `getUserInfoByOpenId(openid)` - 根据 openid 获取指定用户信息
- `refreshUserInfo()` - 刷新并更新本地用户信息
- `validateUserInfo(userInfo)` - 验证用户信息完整性
- `formatUserInfo(userInfo)` - 格式化用户信息显示

### 3. 部署脚本

#### `scripts/clouddeploy/deploy-get-user-info.sh`

- 自动化部署脚本
- 包含依赖安装和云函数部署

## 功能特性

### ✅ 核心功能

1. **灵活查询** - 支持查询当前用户或指定用户
2. **状态验证** - 检查用户是否存在和状态是否正常
3. **安全过滤** - 不返回敏感信息（密码等）
4. **错误处理** - 完善的错误处理和提示

### ✅ 返回信息

```javascript
{
  success: true,
  userInfo: {
    userId: "string",           // 用户ID（openid）
    nickname: "string",         // 用户昵称
    phone: "string",           // 手机号
    userLevel: 1,              // 用户等级
    userType: 1,               // 用户类型
    status: 1,                 // 用户状态
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
  }
}
```

## 使用示例

### 1. 获取当前用户信息

```javascript
const userInfoUtils = require("../../utils/userInfoUtils");

const result = await userInfoUtils.getCurrentUserInfo();
if (result.success) {
  console.log("用户信息：", result.userInfo);
} else {
  console.error("获取失败：", result.error);
}
```

### 2. 获取指定用户信息

```javascript
const targetOpenId = "xxx";
const userResult = await userInfoUtils.getUserInfoByOpenId(targetOpenId);
if (userResult.success) {
  console.log("用户信息：", userResult.userInfo);
}
```

### 3. 刷新用户信息

```javascript
const refreshResult = await userInfoUtils.refreshUserInfo();
if (refreshResult.success) {
  console.log("用户信息已更新");
}
```

## 部署步骤

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

## 错误处理

### 常见错误类型

1. **用户不存在** - 查询的 openid 在数据库中不存在
2. **用户被禁用** - 用户状态不为 1（启用状态）
3. **缺少参数** - 没有提供必要的参数
4. **网络错误** - 云函数调用失败

### 错误响应格式

```javascript
{
  success: false,
  error: "错误描述",
  userId: "相关用户ID",
  openid: "当前用户openid",
  appid: "小程序appid",
  unionid: "用户unionid"
}
```

## 安全考虑

### ✅ 已实现的安全措施

1. **敏感信息过滤** - 不返回密码等敏感数据
2. **状态验证** - 只返回状态正常的用户信息
3. **参数验证** - 验证输入参数的完整性
4. **错误信息控制** - 不暴露系统内部信息

### 🔄 可扩展的安全措施

1. **权限控制** - 可以添加更细粒度的权限验证
2. **访问频率限制** - 防止恶意调用
3. **数据脱敏** - 对敏感字段进行脱敏处理

## 性能优化建议

### 1. 缓存策略

- 对频繁查询的用户信息进行本地缓存
- 设置合理的缓存过期时间
- 在用户信息更新时清除缓存

### 2. 调用优化

- 避免频繁调用云函数
- 批量获取用户信息（如需要）
- 使用本地存储减少网络请求

## 集成建议

### 1. 在现有页面中使用

可以在需要用户信息的页面中集成：

```javascript
// 在页面的 onLoad 或 onShow 中
const userInfoUtils = require("../../utils/userInfoUtils");

onLoad: function() {
  this.loadUserInfo();
},

loadUserInfo: async function() {
  const result = await userInfoUtils.getCurrentUserInfo();
  if (result.success) {
    this.setData({
      userInfo: result.userInfo
    });
  }
}
```

### 2. 与登录状态管理集成

可以与现有的登录状态管理结合使用：

```javascript
// 在登录成功后刷新用户信息
const userInfoUtils = require("../../utils/userInfoUtils");

// 登录成功后
await userInfoUtils.refreshUserInfo();
```

## 总结

新增的 `get-user-info` 云函数提供了：

- ✅ **完整的用户信息查询功能**
- ✅ **安全的敏感信息过滤**
- ✅ **便捷的小程序端工具函数**
- ✅ **完善的错误处理机制**
- ✅ **自动化部署脚本**

这个云函数可以很好地满足你根据 openid 获取用户信息的需求，并且提供了良好的扩展性和安全性。
