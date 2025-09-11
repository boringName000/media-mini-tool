# 管理后台文档

这里存放了管理后台项目的所有文档。

## 📚 文档列表

### 配置指南
- [CLOUDBASE_SETUP.md](./CLOUDBASE_SETUP.md) - 微信云开发 Web SDK 配置指南
  - 环境配置
  - 云函数创建
  - 权限说明
  - 部署流程

### 使用示例
- [cloudbase-usage-example.js](./cloudbase-usage-example.js) - 云开发使用示例代码
  - Vue组件中的使用方法
  - 云函数调用示例
  - 数据库操作示例
  - 错误处理示例

### 云函数示例
- [admin-login-cloudfunction.js](./admin-login-cloudfunction.js) - 管理员登录云函数示例
  - 管理员账号配置
  - 密码验证逻辑
  - Token生成机制
  - 安全建议

## 🚀 快速开始

1. 首先阅读 [CLOUDBASE_SETUP.md](./CLOUDBASE_SETUP.md) 了解如何配置云开发
2. 参考 [cloudbase-usage-example.js](./cloudbase-usage-example.js) 学习具体的使用方法
3. 根据指南创建必要的云函数
4. 开始开发你的管理后台功能

## 📝 文档规范

- 所有项目相关的文档都应该放在这个 `docs` 目录下
- 文档使用 Markdown 格式编写
- 代码示例使用 JavaScript 文件格式
- 文档命名使用大写字母和下划线（如：`CLOUDBASE_SETUP.md`）
- 示例代码文件使用小写字母和连字符（如：`cloudbase-usage-example.js`）

## 🔄 文档更新

当项目功能发生变化时，请及时更新相关文档，确保文档与代码保持同步。