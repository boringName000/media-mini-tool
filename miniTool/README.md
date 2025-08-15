# 媒体小程序工具 (Media Mini Tool)

## 项目概述

这是一个微信小程序项目，用于管理用户的多个社交媒体账号，支持账号添加、数据统计、收益结算等功能。

## 项目结构

```
miniTool/
├── docs/                    # 📚 项目文档
│   ├── README.md           # 文档索引
│   ├── 用户认证与登录/      # 登录相关文档
│   ├── 用户管理/           # 用户管理文档
│   ├── 账号管理/           # 账号管理文档
│   ├── 文件上传与存储/      # 文件上传文档
│   ├── UI/UX 修复/         # 界面修复文档
│   ├── 代码优化/           # 代码优化文档
│   └── 开发环境/           # 开发环境文档
├── cloudfunctions/          # ☁️ 云函数
│   ├── add-user-account/   # 添加用户账号
│   ├── get-user-info/      # 获取用户信息
│   ├── user-login/         # 用户登录
│   ├── user-register/      # 用户注册
│   └── ...                 # 其他云函数
├── miniprogram/            # 📱 小程序代码
│   ├── pages/              # 页面文件
│   ├── components/         # 组件文件
│   ├── utils/              # 工具函数
│   ├── config/             # 配置文件
│   └── ...                 # 其他文件
├── scripts/                # 🔧 部署脚本
└── ...                     # 其他配置文件
```

## 快速开始

### 1. 环境准备

- 微信开发者工具
- 云开发环境
- Node.js (用于云函数)

### 2. 项目设置

1. 克隆项目到本地
2. 在微信开发者工具中打开项目
3. 配置云开发环境
4. 部署云函数

### 3. 开发指南

详细的开发文档请查看 [docs/README.md](./docs/README.md)

## 主要功能

### 🔐 用户管理

- 用户注册和登录
- 登录状态管理
- 用户信息获取

### 📝 账号管理

- 多平台账号添加
- 账号信息管理
- 文章数据统计

### 📊 数据统计

- 账号使用统计
- 文章发布统计
- 收益数据统计

### 💰 收益结算

- 收益数据录入
- 结算申请
- 结算状态跟踪

## 技术栈

- **前端**: 微信小程序原生开发
- **后端**: 微信云开发
- **数据库**: 云数据库
- **存储**: 云存储
- **部署**: 云函数

## 文档导航

📚 **完整文档请查看**: [docs/README.md](./docs/README.md)

### 快速查找

- **登录问题** → [docs/LOGIN_IMPLEMENTATION_SUMMARY.md](./docs/LOGIN_IMPLEMENTATION_SUMMARY.md)
- **账号管理** → [docs/ADD_USER_ACCOUNT_SUMMARY.md](./docs/ADD_USER_ACCOUNT_SUMMARY.md)
- **文件上传** → [docs/CLOUD_STORAGE_UPLOAD.md](./docs/CLOUD_STORAGE_UPLOAD.md)
- **UI 修复** → [docs/IMAGE_BUTTON_UI_FIX.md](./docs/IMAGE_BUTTON_UI_FIX.md)

## 开发规范

### 代码规范

- 使用 ES6+ 语法
- 遵循微信小程序开发规范
- 保持代码注释完整

### 文档规范

- 所有技术文档放在 `docs/` 目录
- 使用 Markdown 格式
- 及时更新文档

### 提交规范

- 使用清晰的提交信息
- 重要变更需要更新文档
- 定期代码审查

## 部署说明

### 云函数部署

```bash
# 使用部署脚本
./scripts/clouddeploy/deploy-all-cloud-functions.sh

# 或手动部署
cd cloudfunctions/[云函数名称]
npm install
wx cloud functions deploy [云函数名称]
```

### 小程序发布

1. 在微信开发者工具中预览
2. 上传代码
3. 提交审核
4. 发布上线

## 常见问题

### 开发环境问题

- 查看 [docs/WX_SERVER_SDK_UPDATE.md](./docs/WX_SERVER_SDK_UPDATE.md)
- 查看 [docs/GITIGNORE_EXPLANATION.md](./docs/GITIGNORE_EXPLANATION.md)

### 功能问题

- 登录问题 → [docs/LOGIN_IMPLEMENTATION_SUMMARY.md](./docs/LOGIN_IMPLEMENTATION_SUMMARY.md)
- 上传问题 → [docs/UPLOAD_ERROR_HANDLING.md](./docs/UPLOAD_ERROR_HANDLING.md)
- UI 问题 → [docs/CSS_SELECTOR_WARNING_FIX.md](./docs/CSS_SELECTOR_WARNING_FIX.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request
5. 更新相关文档

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题，请查看相关文档或提交 Issue。

---

_最后更新：2024 年 12 月_
