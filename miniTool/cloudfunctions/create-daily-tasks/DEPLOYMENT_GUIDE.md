# create-daily-tasks 云函数部署指南

## 📋 部署前检查

### 1. 自动检查

运行部署状态检查脚本：

```bash
node check-deployment.js
```

### 2. 手动检查清单

- [ ] `package.json` 文件存在且配置正确
- [ ] `index.js` 文件存在且语法正确
- [ ] `node_modules` 目录存在
- [ ] `wx-server-sdk` 依赖已安装
- [ ] `config.json` 文件存在

## 🚀 部署方法

### 方法一：使用部署脚本（推荐）

```bash
# 从项目根目录运行
./scripts/clouddeploy/deploy-create-daily-tasks.sh
```

### 方法二：手动部署

```bash
# 1. 进入云函数目录
cd cloudfunctions/create-daily-tasks

# 2. 安装依赖（如果未安装）
npm install

# 3. 检查语法
node -c index.js

# 4. 使用微信开发者工具部署
wx cloud functions deploy create-daily-tasks --env production
```

### 方法三：使用微信开发者工具 GUI

1. 打开微信开发者工具
2. 导入项目
3. 在云开发控制台中
4. 选择 `create-daily-tasks` 云函数
5. 点击"上传并部署"

## 🔧 依赖管理

### 安装依赖

```bash
npm install
```

### 更新依赖

```bash
npm update
```

### 检查依赖

```bash
npm list
```

### 清理依赖

```bash
rm -rf node_modules package-lock.json
npm install
```

## 🧪 测试

### 本地测试

```bash
# 运行测试脚本
node test.js
```

### 云函数测试

1. 在微信开发者工具中
2. 打开云函数调试面板
3. 选择 `create-daily-tasks`
4. 输入测试参数：

```json
{
  "userId": "test_user_id"
}
```

## 📊 监控和日志

### 查看日志

1. 微信开发者工具 → 云开发
2. 云函数 → create-daily-tasks
3. 日志标签页

### 性能监控

1. 云开发控制台
2. 云函数监控
3. 查看调用次数、耗时等指标

## 🛠️ 故障排除

### 常见问题

#### 1. 依赖安装失败

```bash
# 清理缓存
npm cache clean --force
# 重新安装
npm install
```

#### 2. 语法错误

```bash
# 检查语法
node -c index.js
```

#### 3. 部署失败

- 检查网络连接
- 确认云开发环境配置
- 查看错误日志

#### 4. 云函数调用失败

- 检查参数格式
- 确认用户权限
- 查看云函数日志

### 调试技巧

#### 1. 本地调试

```bash
# 运行检查脚本
node check-deployment.js

# 运行测试脚本
node test.js
```

#### 2. 日志调试

在云函数中添加详细日志：

```javascript
console.log("调试信息:", data);
```

#### 3. 错误处理

确保云函数有完善的错误处理：

```javascript
try {
  // 业务逻辑
} catch (error) {
  console.error("错误:", error);
  return {
    success: false,
    error: error.message,
  };
}
```

## 📝 版本管理

### 版本号规范

- 主版本号：重大功能更新
- 次版本号：新功能添加
- 修订号：Bug 修复

### 更新记录

在 `README.md` 中记录：

- 版本号
- 更新内容
- 修复的问题
- 新增功能

## 🔒 安全注意事项

### 1. 参数验证

确保所有输入参数都经过验证：

```javascript
if (!userId) {
  return {
    success: false,
    error: "缺少必要参数",
  };
}
```

### 2. 权限控制

检查用户权限：

```javascript
// 验证用户身份
const userResult = await db
  .collection("user-info")
  .where({
    userId: userId,
  })
  .get();
```

### 3. 数据安全

- 避免在日志中输出敏感信息
- 使用参数化查询防止注入
- 限制数据库操作权限

## 📞 支持

### 联系方式

- 开发者：AI Assistant
- 项目：media-mini-tool
- 文档：`docs/CREATE_DAILY_TASKS_NEW_ACCOUNT_INITIALIZATION.md`

### 相关文档

- [云函数开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)
- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [wx-server-sdk 文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions/wx-server-sdk.html)

---

**最后更新**: 2024-01-15  
**版本**: 1.0.0  
**状态**: ✅ 已准备就绪
