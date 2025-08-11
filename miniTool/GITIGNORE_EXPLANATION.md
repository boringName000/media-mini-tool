# .gitignore 文件配置说明

## 概述

为微信小程序项目配置了完整的 `.gitignore` 文件，用于忽略不需要版本控制的文件和目录。

## 主要忽略内容

### 1. Node.js 相关文件

```
node_modules/          # npm 依赖包目录
npm-debug.log*         # npm 调试日志
yarn-debug.log*        # yarn 调试日志
yarn-error.log*        # yarn 错误日志
package-lock.json      # npm 锁定文件
yarn.lock             # yarn 锁定文件
```

### 2. 微信开发者工具相关

```
.idea/                # WebStorm IDE 配置
.vscode/              # VSCode IDE 配置
*.swp                 # Vim 临时文件
*.swo                 # Vim 临时文件
*~                    # 编辑器备份文件
project.private.config.json  # 微信开发者工具私有配置（包含敏感信息）
```

### 3. 云函数相关

```
cloudfunctions/*/node_modules/    # 云函数依赖包
cloudfunctions/*/package-lock.json # 云函数锁定文件
cloudfunctions/*/.upload/         # 云函数上传临时文件
```

### 4. 系统文件

```
# macOS
.DS_Store             # macOS 系统文件
.DS_Store?            # macOS 系统文件
._*                   # macOS 隐藏文件
.Spotlight-V100       # macOS Spotlight 索引
.Trashes              # macOS 回收站

# Windows
Thumbs.db             # Windows 缩略图缓存
ehthumbs.db           # Windows 缩略图缓存
Desktop.ini           # Windows 桌面配置
$RECYCLE.BIN/         # Windows 回收站

# Linux
*~                    # Linux 备份文件
.fuse_hidden*         # Linux 隐藏文件
.directory            # Linux 目录配置
.Trash-*              # Linux 回收站
```

### 5. 小程序特定文件

```
dist/                 # 构建输出目录
build/                # 构建输出目录
miniprogram_npm/      # 小程序 npm 构建目录
.tmp/                 # 临时文件
.cache/               # 缓存文件
.upload/              # 上传临时文件
.upload_temp/         # 上传临时文件
preview/              # 预览文件
debug/                # 调试文件
```

### 6. 云开发相关

```
cloudbase/            # 云开发本地调试文件
.tcb/                 # 腾讯云开发配置
.local/               # 本地调试文件
```

## 当前项目中已存在的忽略文件

根据项目结构检查，以下文件/目录将被忽略：

### ✅ 系统文件

- `.DS_Store` (根目录和 cloudfunctions 目录)
- `.vscode/` (IDE 配置目录)

### ✅ 云函数相关

- `cloudfunctions/*/node_modules/` (所有云函数的依赖包)
- `cloudfunctions/*/package-lock.json` (所有云函数的锁定文件)

### ✅ 云开发相关

- `.cloudbase/` (云开发配置目录)

### ✅ 微信开发者工具

- `project.private.config.json` (私有配置文件，包含敏感信息)

## 建议操作

### 1. 清理已提交的忽略文件

如果这些文件已经被提交到 Git 仓库，建议清理：

```bash
# 删除已跟踪的忽略文件
git rm -r --cached .DS_Store
git rm -r --cached .vscode/
git rm -r --cached .cloudbase/
git rm -r --cached cloudfunctions/*/node_modules/
git rm --cached cloudfunctions/*/package-lock.json
git rm --cached project.private.config.json

# 提交清理
git add .gitignore
git commit -m "添加 .gitignore 文件并清理忽略的文件"
```

### 2. 验证忽略效果

```bash
# 检查哪些文件被忽略
git status --ignored

# 检查 .gitignore 是否生效
git check-ignore .DS_Store
git check-ignore .vscode/
git check-ignore cloudfunctions/user-login/node_modules/
```

## 注意事项

### 1. 敏感信息保护

- `project.private.config.json` 包含微信开发者工具的私有配置，可能包含敏感信息
- 建议检查该文件内容，确保没有暴露 API 密钥等敏感信息

### 2. 依赖管理

- 云函数的 `node_modules/` 和 `package-lock.json` 被忽略
- 部署时需要重新安装依赖：`npm install`

### 3. 团队协作

- 确保团队成员都了解 `.gitignore` 的配置
- 新成员克隆项目后需要重新安装依赖

## 自定义配置

如果需要保留某些被忽略的文件，可以在 `.gitignore` 中添加例外：

```gitignore
# 忽略所有 .log 文件
*.log

# 但不忽略重要的日志文件
!important.log
```

## 总结

这个 `.gitignore` 文件配置涵盖了：

- ✅ Node.js 依赖和日志文件
- ✅ 各种 IDE 配置文件
- ✅ 系统生成的临时文件
- ✅ 微信小程序特定的构建和缓存文件
- ✅ 云函数和云开发相关文件
- ✅ 敏感配置文件

可以有效保持 Git 仓库的整洁，避免提交不必要的文件。
