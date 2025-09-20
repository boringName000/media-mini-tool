# admin-delete-account 云函数

## 功能描述
管理员删除指定用户的指定账户数据的云函数。

## 功能特性
- 删除指定用户的指定账号数据
- 参数验证和错误处理
- 安全的数据库操作
- 详细的操作日志和返回信息

## 请求参数
```javascript
{
  userId: String,    // 用户ID（必填）
  accountId: String  // 账号ID（必填，格式：AC + 5位数字）
}
```

## 返回值

### 成功响应
```javascript
{
  success: true,
  message: "账号删除成功",
  data: {
    userId: String,
    deletedAccount: {
      accountId: String,
      accountNickname: String,
      platform: Number,
      trackType: Number,
      phoneNumber: String,
      originalAccountId: String
    },
    remainingAccountsCount: Number
  },
  event: Object,
  openid: String,
  appid: String,
  unionid: String
}
```

### 失败响应
```javascript
{
  success: false,
  message: String,  // 错误信息
  event: Object,
  openid: String,
  appid: String,
  unionid: String
}
```

## 错误处理
- 参数为空验证
- 用户存在性检查
- 账号存在性检查
- 数据库操作异常处理

## 使用示例
```javascript
// 调用云函数
wx.cloud.callFunction({
  name: 'admin-delete-account',
  data: {
    userId: 'user123',
    accountId: 'AC00001'
  }
}).then(res => {
  console.log('删除结果:', res.result);
}).catch(err => {
  console.error('删除失败:', err);
});
```

## 注意事项
1. 此操作不可逆，删除后无法恢复
2. 删除账号会同时删除该账号下的所有相关数据（文章、收益、任务等）
3. 建议在删除前进行数据备份
4. 仅管理员权限可调用此函数