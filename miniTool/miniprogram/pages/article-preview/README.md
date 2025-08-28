# 文章预览页面

## 功能说明

文章预览页面用于展示 HTML 格式的文章内容，支持以下功能：

- **纯 HTML 渲染**：直接渲染原始 HTML 内容，不做任何修改
- **文件路径加载**：支持通过文件路径直接加载文件内容
- **图片预览**：支持图片点击预览
- **懒加载**：图片懒加载优化性能
- **文本选择**：支持文本选择和复制
- **复制功能**：一键复制原始 HTML 内容
- 错误处理和重试机制
- 响应式设计

## 技术实现

### 使用 mp-html 组件

本页面使用 [mp-html](https://jin-yufeng.github.io/mp-html/) 组件来渲染 HTML 内容，具有以下特点：

1. **完整的 HTML 支持**：支持所有 HTML 标签和属性
2. **完整的 CSS 样式支持**：支持所有 CSS 样式，包括复杂选择器
3. **图片功能**：支持图片预览、懒加载、长按菜单
4. **视频支持**：支持视频播放和暂停
5. **表格支持**：支持表格滚动和样式
6. **锚点支持**：支持页面内锚点跳转
7. **事件绑定**：支持点击、长按等事件
8. **性能优化**：内置懒加载和性能优化

### 纯 HTML 渲染器

本页面实现了一个纯 HTML 渲染器，具有以下特点：

#### 1. 零修改渲染

- 直接渲染传入的原始 HTML 内容
- 保持原始 HTML 的完整性和样式
- 通过 tagStyle 配置确保样式正确显示

#### 2. 智能样式处理

- **完全还原**：保持原始 HTML 文件内容不变
- **nth-of-type 支持**：自动处理 `nth-of-type(5n+X)` 等选择器
- **颜色循环**：将 CSS 选择器转换为内联样式实现颜色循环
- **智能转换**：支持常见的 nth-of-type 模式（5n+1, 3n+1, 4n+1）

#### 3. 通用性

- 支持任何格式的 HTML 内容
- 不针对特定内容类型
- 适用于各种 HTML 文件
- **完全还原**：100% 还原原始 HTML 文件内容
- **兼容性增强**：处理小程序不支持的 CSS 选择器

#### 4. 功能特性

- 图片点击预览
- 图片懒加载
- 文本选择
- 表格滚动
- 视频播放
- 锚点跳转

### 样式优先级策略

#### 1. 优先级顺序（从高到低）

1. **原始 HTML 内联样式** (最高优先级)

   ```html
   <h1 style="color: blue;">标题</h1>
   <!-- 保持蓝色 -->
   ```

2. **tagStyle 基础样式** (基础样式)

   ```javascript
   tagStyle: {
     h1: "color: #ffffff; background-color: #ff595e;";
   }
   ```

3. **预处理函数** (无修改)
   - 完全保持原始 HTML 内容不变
   - 不进行任何内容修改或增强

#### 2. 实际效果示例

| HTML 内容                                      | 原始内容 | tagStyle    | 最终效果     |
| ---------------------------------------------- | -------- | ----------- | ------------ |
| `<h1>标题</h1>`                                | 无样式   | ✅ 红色背景 | **红色背景** |
| `<h1 style="color: blue;">标题</h1>`           | 蓝色文字 | ❌ 被覆盖   | **蓝色文字** |
| `<strong>文字</strong>`                        | 无样式   | ✅ 基础样式 | **基础样式** |
| `<strong style="color: purple;">文字</strong>` | 紫色文字 | ❌ 被覆盖   | **保持紫色** |

### 支持的 HTML 内容类型

#### 1. 标准 HTML 标签

- **标题标签**：`<h1>`, `<h2>`, `<h3>`, `<h4>`
- **文本样式**：`<strong>`, `<em>`, `<code>`
- **结构元素**：`<p>`, `<blockquote>`, `<a>`, `<img>`
- **列表元素**：`<ul>`, `<ol>`, `<li>`
- **表格元素**：`<table>`, `<tr>`, `<td>`, `<th>`
- **媒体元素**：`<video>`, `<audio>`

#### 2. 自定义 CSS 类

- **标题类**：`class="title"`, `class="heading"`, `class="header"`
- **高亮类**：`class="highlight"`, `class="mark"`, `class="emphasize"`
- **代码类**：`class="code"`, `class="code-block"`
- **引用类**：`class="quote"`, `class="blockquote"`

#### 3. 样式处理

- **颜色循环**：strong 标签自动应用 5 种颜色
- **标题样式**：自动识别并应用红色背景
- **高亮样式**：自动识别并应用红色文字
- **代码样式**：自动识别并应用紫色背景
- **引用样式**：自动识别并应用粉色背景

### 文件加载方式

通过文件路径加载 HTML 文件内容：

```javascript
// 传递文件路径和文件名
wx.navigateTo({
  url: `/pages/article-preview/article-preview?filePath=${encodedPath}&fileName=${encodedName}`,
});
```

**优势：**

- 避免 URL 参数过长问题
- 支持大文件加载
- 更好的性能和稳定性
- 自动设置页面标题

### 主要特点

1. **纯渲染**：不修改原始 HTML 内容
2. **通用性**：支持任何 HTML 格式
3. **功能完整**：支持多媒体和交互功能
4. **性能优化**：内置懒加载和优化
5. **用户体验**：支持预览、选择、复制等功能
6. **文件支持**：支持通过文件路径加载

### 使用方法

#### 从 layout-tool 页面跳转

```javascript
// 读取文件后跳转
goToArticlePreviewWithFile: function (file) {
  const encodedPath = encodeURIComponent(file.path);
  const encodedName = encodeURIComponent(file.name);

  wx.navigateTo({
    url: `/pages/article-preview/article-preview?filePath=${encodedPath}&fileName=${encodedName}`,
  });
}
```

#### 直接设置 HTML 内容

```javascript
// 直接设置 HTML 内容，无需预处理
this.setData({
  articleContent: htmlContent,
});
```

### 配置说明

在 `article-preview.json` 中引入 mp-html 组件：

```json
{
  "usingComponents": {
    "mp-html": "/components/mp-html/index"
  }
}
```

在 `article-preview.wxml` 中使用组件：

```xml
<mp-html
  content="{{articleContent}}"
  selectable="{{true}}"
  copy-link="{{false}}"
  show-img-menu="{{true}}"
  preview-img="{{true}}"
  lazy-load="{{true}}"
  bindload="onHtmlLoad"
  bindready="onHtmlReady"
/>
```

### mp-html 组件特性

- **selectable**：支持文本选择
- **copy-link**：禁用链接复制（避免干扰）
- **show-img-menu**：显示图片长按菜单
- **preview-img**：支持图片点击预览
- **lazy-load**：图片懒加载
- **bindload**：加载完成事件
- **bindready**：渲染完成事件

## 页面参数

- `filePath`: 经过 URL 编码的文件路径
- `fileName`: 经过 URL 编码的文件名称

## 注意事项

1. 确保 `components/mp-html` 组件已正确安装
2. **必须传递文件路径**：通过 filePath 参数传递文件路径
3. **不修改原始内容**：直接渲染传入的 HTML
4. 支持完整的 HTML 标签，包括样式和脚本
5. **图片支持预览**：点击图片可全屏预览
6. **保持原始样式**：完全按照原始 HTML 的样式渲染
7. **自动设置标题**：使用文件名作为页面标题

## 兼容性

- 支持微信小程序基础库 2.0.0 及以上版本
- 兼容 iOS 和 Android 平台
- 支持完整的 CSS 样式
- 支持各种 HTML 内容格式
- 支持图片、视频、表格等多媒体内容
