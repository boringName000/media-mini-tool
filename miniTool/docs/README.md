# 项目文档索引

## 概述

本文件夹包含项目的所有技术文档，按功能模块分类管理。

## 文档分类

### 🔐 用户认证与登录

- **[LOGIN_IMPLEMENTATION_SUMMARY.md](./LOGIN_IMPLEMENTATION_SUMMARY.md)** - 小程序登录状态检查机制实现总结
- **[DUPLICATE_CLEANUP_SUMMARY.md](./DUPLICATE_CLEANUP_SUMMARY.md)** - 重复实现清理总结（isLoggedIn 函数）

### 👤 用户管理

- **[GET_USER_INFO_SUMMARY.md](./GET_USER_INFO_SUMMARY.md)** - get-user-info 云函数实现总结
- **[ACCOUNT_ID_DESIGN_OPTIONS.md](./ACCOUNT_ID_DESIGN_OPTIONS.md)** - 账号 ID 设计方案对比

### 📝 账号管理

- **[ADD_USER_ACCOUNT_SUMMARY.md](./ADD_USER_ACCOUNT_SUMMARY.md)** - add-user-account 云函数实现总结
- **[POSTS_DATA_STRUCTURE.md](./POSTS_DATA_STRUCTURE.md)** - 文章数据结构扩展说明
- **[REGISTER_DATE_VALIDATION_SUMMARY.md](./REGISTER_DATE_VALIDATION_SUMMARY.md)** - 注册时间验证实现总结

### 🖼️ 文件上传与存储

- **[CLOUD_STORAGE_UPLOAD.md](./CLOUD_STORAGE_UPLOAD.md)** - 云存储上传功能实现说明
- **[UPLOAD_ERROR_HANDLING.md](./UPLOAD_ERROR_HANDLING.md)** - 上传失败错误处理说明

### 🎨 UI/UX 修复

- **[IMAGE_BUTTON_UI_FIX.md](./IMAGE_BUTTON_UI_FIX.md)** - 图片按钮 UI 修复说明
- **[IMAGE_HTTP_WARNING_FIX.md](./IMAGE_HTTP_WARNING_FIX.md)** - 图片 HTTP 协议警告修复说明
- **[CSS_SELECTOR_WARNING_FIX.md](./CSS_SELECTOR_WARNING_FIX.md)** - CSS 选择器警告修复说明
- **[SHARED_ARRAY_BUFFER_WARNING_FIX.md](./SHARED_ARRAY_BUFFER_WARNING_FIX.md)** - SharedArrayBuffer 警告修复说明

### 🔧 代码优化

- **[CODE_OPTIMIZATION_SUMMARY.md](./CODE_OPTIMIZATION_SUMMARY.md)** - 代码重复逻辑清理总结
- **[VARIABLE_INITIALIZATION_ERROR_FIX.md](./VARIABLE_INITIALIZATION_ERROR_FIX.md)** - 变量初始化错误修复说明
- **[DATA_FORMAT_OPTIMIZATION.md](./DATA_FORMAT_OPTIMIZATION.md)** - 数据格式优化修复说明
- **[DATE_FORMAT_OPTIMIZATION.md](./DATE_FORMAT_OPTIMIZATION.md)** - 日期格式优化修复说明

### 🛠️ 开发环境

- **[GITIGNORE_EXPLANATION.md](./GITIGNORE_EXPLANATION.md)** - .gitignore 文件配置说明
- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - 云数据库设置和使用指南
- **[WX_SERVER_SDK_UPDATE.md](./WX_SERVER_SDK_UPDATE.md)** - wx-server-sdk 版本更新修复说明

## 快速查找

### 按问题类型查找

#### 登录相关

- 登录状态检查 → [LOGIN_IMPLEMENTATION_SUMMARY.md](./LOGIN_IMPLEMENTATION_SUMMARY.md)
- 重复代码清理 → [DUPLICATE_CLEANUP_SUMMARY.md](./DUPLICATE_CLEANUP_SUMMARY.md)

#### 账号管理

- 添加账号功能 → [ADD_USER_ACCOUNT_SUMMARY.md](./ADD_USER_ACCOUNT_SUMMARY.md)
- 账号 ID 设计 → [ACCOUNT_ID_DESIGN_OPTIONS.md](./ACCOUNT_ID_DESIGN_OPTIONS.md)
- 文章数据结构 → [POSTS_DATA_STRUCTURE.md](./POSTS_DATA_STRUCTURE.md)
- 注册时间验证 → [REGISTER_DATE_VALIDATION_SUMMARY.md](./REGISTER_DATE_VALIDATION_SUMMARY.md)

#### 文件上传

- 云存储上传 → [CLOUD_STORAGE_UPLOAD.md](./CLOUD_STORAGE_UPLOAD.md)
- 上传错误处理 → [UPLOAD_ERROR_HANDLING.md](./UPLOAD_ERROR_HANDLING.md)

#### UI 问题

- 按钮样式修复 → [IMAGE_BUTTON_UI_FIX.md](./IMAGE_BUTTON_UI_FIX.md)
- 图片协议警告 → [IMAGE_HTTP_WARNING_FIX.md](./IMAGE_HTTP_WARNING_FIX.md)
- CSS 选择器警告 → [CSS_SELECTOR_WARNING_FIX.md](./CSS_SELECTOR_WARNING_FIX.md)

#### 开发环境

- Git 配置 → [GITIGNORE_EXPLANATION.md](./GITIGNORE_EXPLANATION.md)
- 数据库设置 → [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- SDK 更新 → [WX_SERVER_SDK_UPDATE.md](./WX_SERVER_SDK_UPDATE.md)

### 按时间顺序查找

#### 早期开发阶段

1. [DATABASE_SETUP.md](./DATABASE_SETUP.md) - 数据库基础设置
2. [LOGIN_IMPLEMENTATION_SUMMARY.md](./LOGIN_IMPLEMENTATION_SUMMARY.md) - 登录机制实现
3. [DUPLICATE_CLEANUP_SUMMARY.md](./DUPLICATE_CLEANUP_SUMMARY.md) - 代码清理

#### 功能开发阶段

4. [GET_USER_INFO_SUMMARY.md](./GET_USER_INFO_SUMMARY.md) - 用户信息获取
5. [ACCOUNT_ID_DESIGN_OPTIONS.md](./ACCOUNT_ID_DESIGN_OPTIONS.md) - 账号 ID 设计
6. [ADD_USER_ACCOUNT_SUMMARY.md](./ADD_USER_ACCOUNT_SUMMARY.md) - 账号添加功能
7. [POSTS_DATA_STRUCTURE.md](./POSTS_DATA_STRUCTURE.md) - 文章数据结构

#### 优化完善阶段

8. [REGISTER_DATE_VALIDATION_SUMMARY.md](./REGISTER_DATE_VALIDATION_SUMMARY.md) - 时间验证
9. [CLOUD_STORAGE_UPLOAD.md](./CLOUD_STORAGE_UPLOAD.md) - 文件上传
10. [CODE_OPTIMIZATION_SUMMARY.md](./CODE_OPTIMIZATION_SUMMARY.md) - 代码优化

#### 问题修复阶段

11. [IMAGE_BUTTON_UI_FIX.md](./IMAGE_BUTTON_UI_FIX.md) - UI 修复
12. [IMAGE_HTTP_WARNING_FIX.md](./IMAGE_HTTP_WARNING_FIX.md) - 协议警告
13. [CSS_SELECTOR_WARNING_FIX.md](./CSS_SELECTOR_WARNING_FIX.md) - CSS 警告
14. [UPLOAD_ERROR_HANDLING.md](./UPLOAD_ERROR_HANDLING.md) - 错误处理
15. [WX_SERVER_SDK_UPDATE.md](./WX_SERVER_SDK_UPDATE.md) - SDK 更新
16. [VARIABLE_INITIALIZATION_ERROR_FIX.md](./VARIABLE_INITIALIZATION_ERROR_FIX.md) - 变量初始化错误修复
17. [DATA_FORMAT_OPTIMIZATION.md](./DATA_FORMAT_OPTIMIZATION.md) - 数据格式优化修复
18. [SHARED_ARRAY_BUFFER_WARNING_FIX.md](./SHARED_ARRAY_BUFFER_WARNING_FIX.md) - SharedArrayBuffer 警告修复
19. [DATE_FORMAT_OPTIMIZATION.md](./DATE_FORMAT_OPTIMIZATION.md) - 日期格式优化修复

## 文档维护

### 添加新文档

1. 在 `docs/` 文件夹中创建新的 `.md` 文件
2. 使用清晰的命名规范：`功能模块_具体内容.md`
3. 更新本索引文件，添加文档链接和说明

### 文档命名规范

- 使用英文命名
- 单词间用下划线连接
- 使用大写字母
- 以 `.md` 结尾

### 文档结构建议

每个文档应包含：

1. 问题描述
2. 解决方案
3. 实现细节
4. 测试验证
5. 总结

## 注意事项

- 所有文档都使用 Markdown 格式
- 保持文档的及时更新
- 定期检查和清理过时的文档
- 重要变更要及时记录

---

_最后更新：2024 年 12 月_
