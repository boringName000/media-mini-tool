# 管理端配置 - 上传文章功能

## 概述

在 `me` 页面新增了"管理端配置"按钮，点击后跳转到管理端配置页面，该页面提供上传文章功能，允许管理员上传文章文件到云存储。

## 功能特性

### 1. 页面导航

- **入口**: `me` 页面菜单列表中的"管理端配置"选项
- **图标**: ⚙️
- **描述**: 管理员功能配置
- **跳转**: 点击后跳转到 `/pages/admin-config/admin-config` 页面

### 2. 上传文章功能

#### 配置选择

- **赛道类型选择**: 下拉列表选择文章所属赛道
  - 数据来源: `config/trackType.js`
  - 包含所有已定义的赛道类型（美食、娱乐、旅游、书法等）
- **平台类型选择**: 下拉列表选择文章发布平台
  - 数据来源: `utils/platformUtils.js`
  - 包含微信公众号平台

#### 文件上传

- **文件选择**: 支持选择多个文件（最多 10 个）
- **支持格式**:
  - 文档格式: PDF、Word(.doc/.docx)、TXT、Markdown(.md)
  - 图片格式: JPG、JPEG、PNG、GIF
- **上传目标**: 云存储的 `admin-articles/` 目录
- **文件命名**: `时间戳_原文件名` 格式

#### 文件管理

- **文件预览**: 显示文件数量、总大小、文件类型统计
- **上传状态**: 实时显示每个文件的上传状态
  - ⏳ 待上传
  - 📤 上传中
  - ✅ 上传成功
  - ❌ 上传失败
- **文件操作**: 支持删除单个文件或清空所有文件

## 技术实现

### 1. 页面结构

```
miniTool/miniprogram/pages/admin-config/
├── admin-config.js      # 页面逻辑
├── admin-config.wxml    # 页面结构
├── admin-config.wxss    # 页面样式
└── admin-config.json    # 页面配置
```

### 2. 核心功能

#### 初始化配置选项

```javascript
// 初始化赛道类型选项
initTrackTypeOptions: function () {
  const options = trackTypeConfig.map(item => ({
    value: item.type,
    label: item.name,
    icon: item.icon
  }));

  this.setData({
    trackTypeOptions: options
  });
}

// 初始化平台类型选项
initPlatformOptions: function () {
  const options = [
    { value: PlatformEnum.XIAOHONGSHU, label: getPlatformName(PlatformEnum.XIAOHONGSHU) },
    { value: PlatformEnum.WECHAT_MP, label: getPlatformName(PlatformEnum.WECHAT_MP) },
    // ... 其他平台
  ];

  this.setData({
    platformOptions: options
  });
}
```

#### 文件上传逻辑

```javascript
// 上传文件到云存储
uploadFiles: function (files, startIndex) {
  const that = this;
  let uploadedCount = 0;
  let failedCount = 0;

  files.forEach((file, index) => {
    const cloudPath = `admin-articles/${Date.now()}_${file.name}`;

    // 更新文件状态为上传中
    that.updateFileStatus(startIndex + index, 'uploading');

    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: file.path,
      success: function (res) {
        that.updateFileStatus(startIndex + index, 'success', res.fileID);
        uploadedCount++;
      },
      fail: function (err) {
        that.updateFileStatus(startIndex + index, 'failed', null, err.errMsg);
        failedCount++;
      }
    });
  });
}
```

### 3. UI 设计

#### 页面布局

- **渐变标题栏**: 紫色渐变背景，白色文字
- **卡片式布局**: 白色背景，圆角设计，阴影效果
- **响应式设计**: 支持不同屏幕尺寸

#### 交互元素

- **下拉选择器**: 赛道类型和平台类型选择
- **上传按钮**: 渐变背景，上传状态反馈
- **文件列表**: 文件信息展示，状态图标，操作按钮
- **预览信息**: 文件统计信息展示

### 4. 数据流

```
用户选择文件 → 验证配置 → 上传到云存储 → 更新状态 → 显示结果
```

## 使用流程

### 1. 访问页面

1. 在 `me` 页面点击"管理端配置"菜单项
2. 跳转到管理端配置页面

### 2. 配置上传参数

1. 选择赛道类型（必选）
2. 选择平台类型（必选）

### 3. 上传文件

1. 点击"选择文章文件"按钮
2. 选择要上传的文件（最多 10 个）
3. 系统自动开始上传
4. 查看上传进度和结果

### 4. 管理文件

1. 查看文件预览信息
2. 删除不需要的文件
3. 清空所有文件重新选择

## 错误处理

### 1. 验证错误

- **未选择赛道类型**: 提示"请选择赛道类型"
- **未选择平台类型**: 提示"请选择平台类型"

### 2. 上传错误

- **文件选择失败**: 显示"选择文件失败"提示
- **上传失败**: 显示具体错误信息
- **网络错误**: 自动重试机制

### 3. 状态反馈

- **上传中**: 按钮显示"上传中..."，禁用状态
- **上传完成**: 显示成功/失败统计
- **文件状态**: 实时更新每个文件的上传状态

## 安全考虑

### 1. 文件限制

- **数量限制**: 单次最多 10 个文件
- **格式限制**: 只允许特定文件格式
- **大小限制**: 云存储默认限制

### 2. 路径安全

- **目录隔离**: 文件上传到专门的 `admin-articles/` 目录
- **文件名处理**: 使用时间戳避免文件名冲突

### 3. 权限控制

- **管理员功能**: 仅管理员可访问
- **用户验证**: 需要登录状态

## 扩展性

### 1. 功能扩展

- 支持更多文件格式
- 添加文件预览功能
- 支持批量操作
- 添加文件分类管理

### 2. 数据管理

- 文件元数据存储
- 上传历史记录
- 文件使用统计

### 3. 权限管理

- 细粒度权限控制
- 操作日志记录
- 审核流程集成

## 注意事项

1. **文件格式**: 确保上传的文件格式符合要求
2. **网络环境**: 大文件上传需要稳定的网络环境
3. **存储空间**: 注意云存储空间使用情况
4. **权限管理**: 确保只有管理员可以访问此功能

该功能为管理员提供了便捷的文章文件上传工具，支持多种文件格式和平台分类，具有良好的用户体验和错误处理机制。
