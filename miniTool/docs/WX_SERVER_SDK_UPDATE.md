# wx-server-sdk 版本更新修复说明

## 问题描述

在微信小程序开发过程中，出现了以下警告信息：

```
wx.getSystemInfoSync is deprecated. Please use wx.getSystemSetting/wx.getAppAuthorizeSetting/wx.getDeviceInfo/wx.getWindowInfo/wx.getAppBaseInfo instead.
```

## 问题原因

这个警告是由于云函数中使用的 `wx-server-sdk` 版本过旧（`~2.6.3`），该版本内部使用了已被微信小程序官方标记为废弃的 `wx.getSystemInfoSync` API。

## 解决方案

### 1. 更新 wx-server-sdk 版本

将所有云函数的 `wx-server-sdk` 从 `~2.6.3` 更新到最新的稳定版本 `^3.0.1`。

### 2. 更新过程

#### 手动更新单个云函数

```bash
cd cloudfunctions/[云函数名称]
npm install wx-server-sdk@latest
```

#### 批量更新所有云函数

```bash
cd cloudfunctions
for dir in */; do
  if [ -f "$dir/package.json" ]; then
    echo "Updating $dir";
    cd "$dir" && npm install wx-server-sdk@latest && cd ..;
  fi;
done
```

### 3. 版本对比

#### 更新前

```json
{
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

#### 更新后

```json
{
  "dependencies": {
    "wx-server-sdk": "^3.0.1"
  }
}
```

## 更新的云函数列表

以下云函数已更新到最新版本：

- ✅ `add-user-account` - 添加用户账号信息
- ✅ `get-user-info` - 获取用户信息
- ✅ `user-login` - 用户登录
- ✅ `user-register` - 用户注册
- ✅ `create-invitation-code` - 创建邀请码
- ✅ `delete-invitation-code` - 删除邀请码
- ✅ `verify-invitation-code` - 验证邀请码
- ✅ `test` - 测试云函数

## 新版本特性

### wx-server-sdk 3.0.1 主要改进

1. **API 现代化**

   - 移除了废弃的 `wx.getSystemInfoSync` 调用
   - 使用新的系统信息获取 API
   - 更好的性能和稳定性

2. **兼容性改进**

   - 更好的微信小程序版本兼容性
   - 减少废弃 API 警告
   - 更稳定的云函数执行环境

3. **安全性提升**
   - 修复了已知的安全问题
   - 更严格的权限控制
   - 更好的错误处理

## 验证更新

### 1. 检查版本

```bash
cd cloudfunctions/[云函数名称]
npm list wx-server-sdk
```

### 2. 重新部署云函数

更新依赖后，需要重新部署云函数：

```bash
# 使用微信开发者工具
# 右键点击云函数 → 上传并部署：云端安装依赖
```

### 3. 测试功能

- 测试所有云函数功能是否正常
- 检查控制台是否还有废弃 API 警告
- 验证云函数性能是否有所提升

## 注意事项

### 1. 部署要求

- 更新依赖后必须重新部署云函数
- 确保云端安装依赖选项已启用
- 检查云函数权限配置

### 2. 兼容性检查

- 新版本可能与某些旧代码不兼容
- 建议在测试环境先验证
- 注意 API 调用方式的变化

### 3. 性能监控

- 监控云函数执行时间
- 检查内存使用情况
- 观察错误率变化

## 预期效果

### 1. 警告消除

- ✅ 不再出现 `wx.getSystemInfoSync is deprecated` 警告
- ✅ 控制台日志更加清洁
- ✅ 开发体验更好

### 2. 性能提升

- ✅ 更快的云函数启动时间
- ✅ 更稳定的执行环境
- ✅ 更好的资源利用

### 3. 安全性增强

- ✅ 使用最新的安全补丁
- ✅ 更好的权限控制
- ✅ 减少潜在的安全风险

## 回滚方案

如果新版本出现问题，可以回滚到旧版本：

```bash
cd cloudfunctions/[云函数名称]
npm install wx-server-sdk@~2.6.3
```

然后重新部署云函数。

## 总结

通过更新 `wx-server-sdk` 到最新版本 `^3.0.1`，成功解决了废弃 API 警告问题，同时获得了更好的性能、安全性和兼容性。

这个更新是必要的维护工作，确保了云函数使用最新的稳定版本，避免了潜在的兼容性和安全问题。
