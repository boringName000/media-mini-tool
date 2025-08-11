# 云函数部署脚本

这个目录包含了所有云函数的部署脚本。

## 目录说明

`scripts/clouddeploy/` - 云函数部署脚本目录

- 专门用于云函数的部署和管理
- 包含批量部署和单独部署脚本
- 提供完整的部署流程自动化

## 脚本列表

### 1. `deploy-all-cloud-functions.sh`

**统一部署脚本（推荐使用）**

- 一次性部署所有云函数
- 自动安装依赖
- 批量部署，节省时间

### 2. `deploy-cloud-function.sh`

**测试云函数部署**

- 部署 `test` 云函数
- 用于用户数据测试功能

### 3. `deploy-create-invitation-code.sh`

**邀请码创建云函数部署**

- 部署 `create-invitation-code` 云函数
- 用于生成邀请码功能

### 4. `deploy-verify-invitation-code.sh`

**邀请码验证云函数部署**

- 部署 `verify-invitation-code` 云函数
- 用于验证邀请码有效性

### 5. `deploy-delete-invitation-code.sh`

**邀请码删除云函数部署**

- 部署 `delete-invitation-code` 云函数
- 用于删除邀请码功能

## 使用方法

### 部署所有云函数（推荐）

```bash
cd scripts/clouddeploy
./deploy-all-cloud-functions.sh
```

### 部署单个云函数

```bash
cd scripts/clouddeploy
./deploy-create-invitation-code.sh
```

## 前置条件

1. **微信开发者工具**

   - 已安装并登录
   - 已开通云开发服务

2. **数据库集合**

   - `user-info` - 用户信息集合
   - `invitation-code-mgr` - 邀请码管理集合

3. **项目环境**
   - Node.js 环境
   - npm 包管理器

## 注意事项

- 确保在项目根目录下运行脚本
- 确保网络连接正常
- 确保云开发服务正常
- 部署后需要在小程序中测试功能

## 云函数功能说明

| 云函数名称             | 功能描述     | 数据库集合          |
| ---------------------- | ------------ | ------------------- |
| test                   | 用户数据测试 | user-info           |
| create-invitation-code | 创建邀请码   | invitation-code-mgr |
| verify-invitation-code | 验证邀请码   | invitation-code-mgr |
| delete-invitation-code | 删除邀请码   | invitation-code-mgr |

## 项目结构

```
项目根目录/
├── scripts/
│   └── clouddeploy/           # 云函数部署脚本
│       ├── README.md
│       ├── deploy-all-cloud-functions.sh
│       ├── deploy-cloud-function.sh
│       ├── deploy-create-invitation-code.sh
│       ├── deploy-verify-invitation-code.sh
│       └── deploy-delete-invitation-code.sh
├── cloudfunctions/            # 云函数源码
│   ├── test/
│   ├── create-invitation-code/
│   ├── verify-invitation-code/
│   └── delete-invitation-code/
└── miniprogram/              # 小程序源码
```
