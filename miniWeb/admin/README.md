# 永贯创作者管理中心

基于 Vue 3 + Element Plus 构建的管理端 Web 应用，用于管理微信小程序的用户、账号、任务等数据。

## 功能特性

- 🔐 **管理员登录认证**
- 📊 **数据统计仪表盘**
- 👥 **用户管理** - 查看、编辑用户信息
- 📱 **账号管理** - 审核、管理用户创作账号
- 📝 **任务管理** - 创建、分发每日文章任务
- 🌐 **微信云开发集成** - 调用云函数操作云数据库
- 📱 **响应式设计** - 支持桌面端和移动端访问

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **构建工具**: Vite
- **样式预处理**: Sass/SCSS
- **云服务**: 微信云开发 (CloudBase)

## 项目结构

```
miniWeb/admin/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 公共组件
│   ├── layout/            # 布局组件
│   ├── router/            # 路由配置
│   ├── stores/            # 状态管理
│   ├── styles/            # 全局样式
│   ├── utils/             # 工具函数
│   ├── views/             # 页面组件
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── index.html             # HTML 模板
├── package.json           # 项目配置
├── vite.config.js         # Vite 配置
└── README.md              # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
cd miniWeb/admin
npm install
```

### 2. 配置云开发

在 `src/utils/cloudbase.js` 中配置你的云开发环境：

```javascript
const config = {
  env: 'your-env-id',  // 替换为你的环境ID
  region: 'ap-shanghai'  // 替换为你的地域
}
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 查看应用

### 4. 构建生产版本

```bash
npm run build
```

构建产物将生成在 `dist` 目录中

## 部署到微信云开发静态网站

### 1. 构建项目

```bash
npm run build
```

### 2. 上传到云开发

将 `dist` 目录中的所有文件上传到微信云开发的静态网站托管中。

### 3. 配置域名

在微信云开发控制台中配置自定义域名（可选）。

## 页面说明

### 登录页面 (`/login`)
- 管理员账号密码登录
- 登录状态持久化
- 登录后跳转到仪表盘

### 仪表盘 (`/dashboard`)
- 数据统计概览
- 快速操作入口
- 系统状态监控

### 用户管理 (`/users`)
- 用户列表查看
- 用户信息编辑
- 用户状态管理
- 搜索和筛选功能

### 账号管理 (`/accounts`)
- 创作账号审核
- 账号信息管理
- 批量操作功能
- 违规状态管理

### 任务管理 (`/tasks`)
- 每日任务创建
- 任务状态监控
- 任务重置和删除
- 任务统计分析

## 云函数接口

项目需要以下云函数支持：

### 用户管理相关
- `admin-get-users` - 获取用户列表
- `admin-update-user` - 更新用户信息
- `admin-delete-user` - 删除用户

### 账号管理相关
- `admin-get-accounts` - 获取账号列表
- `admin-approve-account` - 审核通过账号
- `admin-reject-account` - 审核拒绝账号
- `admin-update-account` - 更新账号信息
- `admin-batch-approve-accounts` - 批量审核通过
- `admin-batch-reject-accounts` - 批量审核拒绝

### 任务管理相关
- `admin-get-daily-tasks` - 获取每日任务列表
- `admin-create-daily-tasks` - 创建每日任务
- `admin-delete-task` - 删除任务
- `admin-reset-task` - 重置任务
- `admin-batch-delete-tasks` - 批量删除任务

### 统计相关
- `admin-get-dashboard-stats` - 获取仪表盘统计数据

## 开发说明

### 添加新页面

1. 在 `src/views/` 中创建新的 Vue 组件
2. 在 `src/router/index.js` 中添加路由配置
3. 在 `src/layout/index.vue` 中添加菜单项

### 调用云函数

使用封装好的 `callCloudFunction` 方法：

```javascript
import { callCloudFunction } from '@/utils/cloudbase'

const result = await callCloudFunction('function-name', {
  param1: 'value1',
  param2: 'value2'
})
```

### 状态管理

使用 Pinia 进行状态管理：

```javascript
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
```

## 注意事项

1. **权限控制**: 所有页面都需要登录后才能访问
2. **错误处理**: 统一的错误提示和处理机制
3. **响应式设计**: 支持桌面端和移动端访问
4. **数据安全**: 敏感操作需要二次确认
5. **性能优化**: 大列表使用分页加载

## TODO 功能

- [ ] 数据导出功能
- [ ] 操作日志记录
- [ ] 权限角色管理
- [ ] 消息通知系统
- [ ] 数据可视化图表
- [ ] 批量导入功能
- [ ] 系统配置管理
- [ ] API 接口文档

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码变更
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License