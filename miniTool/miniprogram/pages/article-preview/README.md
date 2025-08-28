# 文章预览页面

## 功能概述

文章预览页面是一个专门用于全屏展示 HTML 文章内容的页面，提供更好的阅读体验。

## 主要功能

### 1. 文章内容解析

- 自动提取 HTML 文档中的主要内容
- 智能识别 `body` 和 `article-content` 部分
- 支持多种 HTML 标签的渲染

### 2. 支持的 HTML 标签

- **标题标签**: `<h1>`, `<h2>`, `<h3>`
- **段落标签**: `<p>`
- **文本样式**: `<strong>`, `<b>`, `<em>`, `<i>`
- **图片标签**: `<img>`
- **容器标签**: `<div>`, `<section>`
- **换行处理**: 自动处理换行符

### 3. 页面特性

- **全屏显示**: 提供沉浸式的阅读体验
- **响应式设计**: 适配不同屏幕尺寸
- **加载状态**: 显示解析进度
- **错误处理**: 友好的错误提示
- **返回导航**: 便捷的返回功能

## 使用方法

### 从其他页面跳转

```javascript
// 对内容进行URL编码
const encodedContent = encodeURIComponent(htmlContent);

// 跳转到文章预览页面
wx.navigateTo({
  url: `/pages/article-preview/article-preview?content=${encodedContent}`,
});
```

### 页面参数

- `content`: 经过 URL 编码的 HTML 内容

## 技术实现

### HTML 解析逻辑

1. **内容提取**: 从完整的 HTML 文档中提取主要内容
2. **标签转换**: 将 HTML 标签转换为 rich-text 支持的格式
3. **样式处理**: 保持原有的样式和布局
4. **错误处理**: 提供友好的错误提示

### 样式特点

- 使用 `rich-text` 组件渲染 HTML 内容
- 支持文本选择功能
- 优化的字体和行间距
- 现代化的卡片式设计

## 文件结构

```
pages/article-preview/
├── article-preview.js    # 页面逻辑
├── article-preview.wxml  # 页面结构
├── article-preview.wxss  # 页面样式
├── article-preview.json  # 页面配置
└── README.md            # 说明文档
```

## 注意事项

1. **内容长度限制**: 由于 URL 参数长度限制，建议对超长内容进行分段处理
2. **编码处理**: 必须对 HTML 内容进行 URL 编码
3. **性能优化**: 对于大型 HTML 文档，建议在服务端进行预处理
4. **兼容性**: 主要支持微信小程序环境下的 rich-text 组件

## 更新日志

- **v1.0.0**: 初始版本，支持基本的 HTML 渲染功能
- 支持多种 HTML 标签
- 提供全屏阅读体验
- 完善的错误处理机制
