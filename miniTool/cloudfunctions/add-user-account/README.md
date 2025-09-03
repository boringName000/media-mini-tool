# add-user-account 云函数

## 功能描述

添加用户账号信息的云函数，将账号信息存储到用户数据的账号数组中。

## 主要功能

1. **添加账号信息** - 将新账号信息添加到用户的账号数组中
2. **生成唯一账号 ID** - 自动生成唯一的账号标识符
3. **数据验证** - 验证账号信息的完整性和格式
4. **重复检查** - 防止在同一平台下添加重复的账号
5. **状态管理** - 设置账号状态和审核状态

## 账号 ID 设计

### ID 生成规则

```
AC + 账号索引（5位数字，从00001开始）
```

**示例**：

- 第 1 个账号: `AC00001`
- 第 2 个账号: `AC00002`
- 第 10 个账号: `AC00010`
- 第 100 个账号: `AC00100`

### ID 特点

- **简单直观**：以"AC"开头，后跟 5 位数字索引
- **长度固定**：统一 7 位长度，便于存储和显示
- **递增有序**：按添加顺序递增，便于管理
- **易于理解**：可以直接看出是第几个账号
- **生成简单**：逻辑简单，不容易出错

## 接口参数

### 输入参数

```javascript
{
  trackType: "object",      // 赛道类型对象
  platform: "object",       // 平台对象
  phoneNumber: "string",    // 注册手机号
  accountNickname: "string", // 账号昵称
  accountId: "string",      // 用户输入的原始账号ID
  registerDate: "string",   // 注册日期（可选）
  isViolation: boolean,     // 是否违规（可选，默认false）
  screenshotUrl: "string"   // 截图URL（可选，默认空字符串）
}
```

### 返回结果

#### 成功响应

```javascript
{
  success: true,
  message: "账号信息添加成功",
  accountData: {
    accountId: "string",           // 生成的唯一账号ID
    trackType: "object",           // 赛道类型
    platform: "object",            // 平台信息
    phoneNumber: "string",         // 手机号
    accountNickname: "string",     // 账号昵称
    originalAccountId: "string",   // 原始账号ID
    registerDate: "string",        // 注册日期
    isViolation: boolean,          // 是否违规
    screenshotUrl: "string",       // 截图URL
    createTimestamp: Date,         // 创建时间
    status: 1,                     // 账号状态（1=启用）
    auditStatus: 0,                // 审核状态（0=待审核）
    dailyPostCount: 0,             // 每日发文数量
    totalPosts: 0,                 // 总发文数量
    lastPostTime: null             // 最后发文时间
  },
  totalAccounts: 5,                // 用户总账号数
  event: "object",                 // 原始请求参数
  openid: "string",                // 用户openid
  appid: "string",                 // 小程序appid
  unionid: "string"                // 用户unionid
}
```

#### 失败响应

```javascript
{
  success: false,
  error: "错误信息",
  event: "object",
  openid: "string",
  appid: "string",
  unionid: "string"
}
```

## 数据结构

### 账号数据结构

```javascript
{
  accountId: "string",           // 唯一账号ID（系统生成）
  trackType: "object",           // 赛道类型对象
  platform: "object",            // 平台对象
  phoneNumber: "string",         // 注册手机号
  accountNickname: "string",     // 账号昵称
  originalAccountId: "string",   // 用户输入的原始账号ID
  registerDate: "string",        // 注册日期
  isViolation: boolean,          // 是否违规
  screenshotUrl: "string",       // 截图URL
  createTimestamp: Date,         // 创建时间戳
  status: 1,                     // 账号状态：0-禁用，1-启用
  auditStatus: 0,                // 审核状态：0-待审核，1-已通过，2-未通过
  dailyPostCount: 0,             // 每日发文数量
  posts: [],                     // 已发布的文章数据数组
  lastPostTime: null             // 最后发文时间
}
```

### 用户数据结构更新

```javascript
{
  // ... 原有用户信息
  accounts: [                    // 账号数组
    {
      // 账号1信息
    },
    {
      // 账号2信息
    }
  ],
  lastUpdateTimestamp: Date      // 最后更新时间
}
```

## 使用示例

### 1. 在小程序中调用

```javascript
const accountUtils = require("../../utils/accountUtils");

// 准备账号数据
const accountData = {
  trackType: { type: "FOOD_TRACK", name: "美食赛道", icon: "🍔" },
  platform: { type: "WECHAT_MP", name: "公众号", icon: "📰" },
  phoneNumber: "13800138000",
  accountNickname: "美食达人",
  accountId: "food_lover_123",
  registerDate: "2024-01-15",
  isViolation: false,
  screenshotUrl: "https://example.com/screenshot.jpg",
};

// 添加账号
const result = await accountUtils.addUserAccount(accountData);

if (result.success) {
  console.log("账号添加成功:", result.accountData);
  console.log("生成的账号ID:", result.accountData.accountId);
  console.log("总账号数:", result.totalAccounts);
} else {
  console.error("添加失败:", result.error);
}
```

### 2. 直接调用云函数

```javascript
wx.cloud
  .callFunction({
    name: "add-user-account",
    data: {
      trackType: { type: "FOOD_TRACK", name: "美食赛道" },
      platform: { type: "WECHAT_MP", name: "公众号" },
      phoneNumber: "13800138000",
      accountNickname: "美食达人",
      accountId: "food_lover_123",
      registerDate: "2024-01-15",
    },
  })
  .then((res) => {
    if (res.result.success) {
      console.log("账号添加成功:", res.result.accountData);
    } else {
      console.error("添加失败:", res.result.error);
    }
  })
  .catch((err) => {
    console.error("调用失败:", err);
  });
```

## 错误处理

### 常见错误

1. **参数不完整**

   ```javascript
   {
     success: false,
     error: "请填写完整的账号信息"
   }
   ```

2. **手机号格式错误**

   ```javascript
   {
     success: false,
     error: "请输入正确的手机号格式"
   }
   ```

3. **用户不存在**

   ```javascript
   {
     success: false,
     error: "用户不存在，请先登录"
   }
   ```

4. **用户被禁用**

   ```javascript
   {
     success: false,
     error: "用户账号已被禁用"
   }
   ```

5. **账号重复**

   ```javascript
   {
     success: false,
     error: "该平台下已存在相同的账号ID"
   }
   ```

6. **数据库操作失败**
   ```javascript
   {
     success: false,
     error: "账号信息添加失败，请稍后重试"
   }
   ```

## 安全考虑

### ✅ 已实现的安全措施

1. **用户身份验证** - 验证用户登录状态
2. **数据验证** - 验证输入数据的完整性和格式
3. **重复检查** - 防止添加重复账号
4. **状态检查** - 只允许正常状态的用户添加账号

### 🔄 可扩展的安全措施

1. **权限控制** - 可以添加更细粒度的权限验证
2. **频率限制** - 防止恶意添加大量账号
3. **数据加密** - 对敏感信息进行加密存储

## 部署说明

### 1. 安装依赖

```bash
cd cloudfunctions/add-user-account
npm install
```

### 2. 部署云函数

```bash
# 使用部署脚本
./scripts/clouddeploy/deploy-add-user-account.sh

# 或手动部署
wx cloud functions deploy add-user-account --env your-env-id
```

## 数据库要求

云函数依赖 `user-info` 集合，需要支持以下操作：

- 查询用户信息：`where({ userId: openid })`
- 更新用户信息：`update({ data: { accounts: [...], lastUpdateTimestamp: ... } })`

## 注意事项

1. **账号 ID 唯一性** - 生成的账号 ID 具有很高的唯一性，但理论上仍可能存在冲突
2. **数据一致性** - 建议在应用层添加额外的重复检查
3. **性能考虑** - 账号数组会随着账号数量增长，建议定期清理或分页处理
4. **备份策略** - 重要账号数据建议定期备份
5. **监控告警** - 建议添加异常监控和告警机制

## 扩展功能

### 可扩展的功能

1. **账号分类** - 按赛道或平台对账号进行分类
2. **账号标签** - 为账号添加自定义标签
3. **账号统计** - 统计账号的发文数量、粉丝数等
4. **账号同步** - 与第三方平台同步账号信息
5. **批量操作** - 支持批量添加或更新账号
