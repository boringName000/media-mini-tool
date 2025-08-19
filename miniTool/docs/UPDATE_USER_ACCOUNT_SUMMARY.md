# update-user-account 云函数实现总结

## 功能概述

新增了 `update-user-account` 云函数，用于更新用户账号数据。该云函数支持传入用户 ID、账号 ID 和要更新的字段，然后更新指定账号的数据并返回用户全量数据和更新后的账号数据。

## 核心功能

### 1. 参数验证

- 验证必填参数：`userId`、`accountId`、`updateFields`
- 验证 `updateFields` 必须是非空对象
- 验证可更新的字段列表，防止更新敏感字段

### 2. 数据验证

- 验证用户是否存在（不检查用户状态，允许更新被禁用账号）
- 验证账号是否存在
- 验证手机号格式（如果更新手机号）
- 验证注册日期格式和合理性（如果更新注册日期）
- 检查账号重复性（如果更新平台或原始账号 ID）

### 3. 数据更新

- 更新指定账号的字段
- 自动添加 `lastUpdateTimestamp` 时间戳
- 更新用户信息的 `lastUpdateTimestamp`

### 4. 返回数据

- 返回完整的用户信息（包含所有账号）
- 返回更新后的账号数据
- 返回更新的字段信息

## 可更新字段列表

```javascript
const allowedFields = [
  "trackType", // 追踪类型
  "platform", // 平台名称
  "phoneNumber", // 手机号码
  "accountNickname", // 账号昵称
  "originalAccountId", // 原始账号ID
  "registerDate", // 注册日期
  "isViolation", // 是否违规
  "screenshotUrl", // 截图URL
  "status", // 账号状态
  "auditStatus", // 审核状态
  "dailyPostCount", // 每日发文数量
  "lastPostTime", // 最后发文时间
];
```

## 安全特性

1. **字段白名单**：只允许更新指定的字段，防止更新敏感数据
2. **重复检查**：更新平台或账号 ID 时检查是否与其他账号重复
3. **格式验证**：自动验证手机号和日期格式
4. **状态检查**：确保用户和账号状态正常

## 使用示例

### 调用云函数

```javascript
wx.cloud
  .callFunction({
    name: "update-user-account",
    data: {
      userId: "user_openid",
      accountId: "AC00001",
      updateFields: {
        accountNickname: "新昵称",
        phoneNumber: "13800138000",
        status: 1,
      },
    },
  })
  .then((res) => {
    if (res.result.success) {
      console.log("更新成功:", res.result.userInfo);
      console.log("账号数据:", res.result.accountData);
    } else {
      console.error("更新失败:", res.result.error);
    }
  })
  .catch((err) => {
    console.error("调用失败:", err);
  });
```

### 返回数据示例

```json
{
  "success": true,
  "message": "账号信息更新成功",
  "userInfo": {
    "userId": "user_openid",
    "nickname": "用户昵称",
    "phone": "用户手机号",
    "userLevel": "用户等级",
    "userType": "用户类型",
    "status": 1,
    "registerTimestamp": "2024-01-01T00:00:00.000Z",
    "lastLoginTimestamp": "2024-01-01T00:00:00.000Z",
    "inviteCode": "INVITE123",
    "accounts": [...]
  },
  "accountData": {
    "accountId": "AC00001",
    "trackType": "追踪类型",
    "platform": "平台名称",
    "phoneNumber": "13800138000",
    "accountNickname": "新昵称",
    "originalAccountId": "原始账号ID",
    "registerDate": "2024-01-01T00:00:00.000Z",
    "isViolation": false,
    "screenshotUrl": "",
    "status": 1,
    "auditStatus": 0,
    "dailyPostCount": 0,
    "posts": [],
    "lastPostTime": null,
    "createTimestamp": "2024-01-01T00:00:00.000Z",
    "lastUpdateTimestamp": "2024-01-01T00:00:00.000Z"
  },
  "updatedFields": {
    "accountNickname": "新昵称",
    "phoneNumber": "13800138000",
    "status": 1
  }
}
```

## 部署信息

- 云函数名称：`update-user-account`
- 部署脚本：`miniTool/scripts/clouddeploy/deploy-update-user-account.sh`
- 配置文件：`miniTool/cloudfunctions/update-user-account/config.json`
- 依赖：`wx-server-sdk ~2.6.3`

## 注意事项

1. 确保在调用前用户已登录
2. 更新敏感字段时会进行额外的验证
3. 更新成功后会自动刷新时间戳
4. 返回的数据包含完整的用户信息和更新后的账号数据
5. **支持状态更新**：可以更新被禁用账号的状态，实现账号的重新启用
