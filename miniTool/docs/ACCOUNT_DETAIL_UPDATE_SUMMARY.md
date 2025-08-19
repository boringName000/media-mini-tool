# 账号详情页面更新功能实现总结

## 功能概述

在 `account-detail.js` 页面中集成了 `update-user-account` 云函数，实现了用户账号信息的在线编辑和更新功能。

## 可更新字段

### 1. 基本信息字段

- `trackType`: 赛道类型
- `phoneNumber`: 手机号码
- `accountNickname`: 账号昵称
- `registerDate`: 注册日期（只读显示，不可修改）
- `isViolation`: 是否违规
- `screenshotUrl`: 截图 URL

### 2. 字段验证规则

- **赛道类型**: 必选，从预定义列表中选择
- **手机号码**: 必填，格式验证（1[3-9]xxxxxxxxx）
- **账号昵称**: 必填，不能为空
- **注册日期**: 只读显示，不允许修改
- **违规状态**: 布尔值，默认 false
- **截图**: 可选，支持上传和预览

## 更新逻辑

### 1. 智能更新检测

```javascript
// 只更新发生变化的字段
if (this.data.phoneNumber !== this.data.accountInfo.phoneNumber) {
  updateFields.phoneNumber = this.data.phoneNumber;
}
```

### 2. 用户 ID 获取

```javascript
// 从全局登录状态获取用户ID
const app = getApp();
const userId = app.globalData.loginResult?.userId;
```

### 3. 云函数调用

```javascript
wx.cloud.callFunction({
  name: "update-user-account",
  data: {
    userId: userId,
    accountId: this.data.accountInfo.accountId,
    updateFields: updateFields,
  },
});
```

## 用户体验优化

### 1. 加载状态

- 提交时显示加载提示
- 防止重复提交
- 网络错误处理

### 2. 反馈机制

- 成功更新后显示成功提示
- 错误信息友好展示
- 自动返回上一页

### 3. 数据同步

- 更新成功后同步本地数据
- 保持页面状态一致性

## 安全特性

### 1. 权限验证

- 检查用户登录状态
- 验证用户 ID 有效性
- 确保只能更新自己的账号

### 2. 数据验证

- 前端表单验证
- 云函数端二次验证
- 字段格式检查

### 3. 错误处理

- 网络错误处理
- 云函数调用失败处理
- 用户友好的错误提示

## 使用流程

### 1. 页面加载

1. 检查登录状态
2. 初始化赛道类型列表
3. 解析传入的账号数据
4. 填充表单字段

### 2. 用户编辑

1. 修改需要更新的字段
2. 实时验证输入格式
3. 清除错误提示

### 3. 提交更新

1. 验证表单完整性
2. 检测变更字段
3. 调用云函数更新
4. 处理响应结果

### 4. 结果处理

1. 更新本地数据
2. 显示操作结果
3. 自动返回上一页

## 技术实现

### 1. 数据绑定

- 使用微信小程序的数据绑定机制
- 实时同步表单状态
- 支持双向数据流

### 2. 云函数集成

- 调用 `update-user-account` 云函数
- 传递必要的参数
- 处理返回结果

### 3. 状态管理

- 全局登录状态管理
- 本地数据缓存
- 页面状态同步

## 注意事项

1. **用户 ID 获取**: 确保从正确的来源获取用户 ID
2. **字段验证**: 前后端都需要进行数据验证
3. **错误处理**: 提供友好的错误提示
4. **数据同步**: 更新成功后同步本地数据
5. **用户体验**: 提供加载状态和操作反馈

## 扩展功能

### 1. 可添加的字段

- `platform`: 平台信息
- `originalAccountId`: 原始账号 ID
- `status`: 账号状态
- `auditStatus`: 审核状态
- `registerDate`: 注册日期（当前为只读，可考虑开放编辑权限）

### 2. 可优化的功能

- 批量更新多个账号
- 历史记录查看
- 操作日志记录
- 数据备份恢复
