# update-user-account 云函数

## 功能描述

更新用户账号数据的云函数，支持更新指定用户的指定账号信息。

## 参数说明

### 输入参数

- `userId` (string, 必填): 用户 ID
- `accountId` (string, 必填): 要更新的账号 ID
- `updateFields` (object, 必填): 要更新的字段和值

### updateFields 可更新字段

- `trackType` (string): 追踪类型
- `platform` (string): 平台名称
- `phoneNumber` (string): 手机号码
- `accountNickname` (string): 账号昵称
- `originalAccountId` (string): 原始账号 ID
- `registerDate` (string): 注册日期
- `isViolation` (boolean): 是否违规
- `screenshotUrl` (string): 截图 URL
- `status` (number): 账号状态 (0-禁用，1-启用)
- `auditStatus` (number): 审核状态 (0-待审核，1-已通过，2-未通过)
- `currentAccountEarnings` (number): 当前账号收益
- `lastPostTime` (string): 最后发文时间

## 返回数据

### 成功返回

```json
{
  "success": true,
  "message": "账号信息更新成功",
  "userInfo": {
    "userId": "用户ID",
    "nickname": "用户昵称",
    "phone": "用户手机号",
    "userLevel": "用户等级",
    "userType": "用户类型",
    "status": "用户状态",
    "registerTimestamp": "注册时间",
    "lastLoginTimestamp": "最后登录时间",
    "inviteCode": "邀请码",
    "accounts": "账号数组"
  },
  "accountData": "更新后的账号数据",
  "updatedFields": "更新的字段"
}
```

### 失败返回

```json
{
  "success": false,
  "error": "错误信息"
}
```

## 使用示例

```javascript
// 调用云函数
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
    console.log("更新成功:", res.result);
  })
  .catch((err) => {
    console.error("更新失败:", err);
  });
```

## 注意事项

1. 只能更新允许的字段，敏感字段如 `accountId`、`createTimestamp` 等不允许更新
2. 更新 `platform` 或 `originalAccountId` 时会检查是否与其他账号重复
3. 手机号格式会自动验证
4. 注册日期会自动验证和格式化
5. 更新成功后会自动添加 `lastUpdateTimestamp` 字段
6. **不检查用户状态**：允许更新被禁用账号的状态，以便重新启用账号
