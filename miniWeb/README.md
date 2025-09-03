# 文章预览创作者工具

这是一个专为微信小程序设计的文章预览工具，使用原生 HTML、CSS 和 JavaScript 构建，无需任何外部依赖。主要用于接收小程序发送的 HTML 内容并实时预览渲染效果。

## 🚀 核心特性

- **轻量简洁**: 无外部依赖，加载速度快
- **实时预览**: 接收小程序 HTML 内容并实时渲染
- **复制功能**: 支持复制标题和内容到剪贴板
- **微信集成**: 专为微信小程序 WebView 设计
- **响应式**: 支持各种设备尺寸

## 📁 项目结构

```
miniWeb/
├── index.html              # 主入口文件（包含所有样式和脚本）
├── pages/                  # 页面文件夹（保留结构，当前未使用）
├── start-server.sh         # 启动脚本
└── README.md               # 项目说明文档
```

## 🎯 功能特性

### 1. 文章预览

- **HTML 渲染**: 实时显示从小程序接收的 HTML 内容
- **内容解析**: 自动解析 HTML 标签并显示实际效果
- **安全过滤**: 基础的安全过滤，防止 XSS 攻击

### 2. 复制功能

- **复制标题**: 复制从小程序接收的页面标题
- **复制内容**: 复制从小程序接收的 HTML 内容
- **智能提示**: 根据内容状态显示相应的提示信息

### 3. 微信小程序集成

- **双向通信**: 使用 postMessage API 实现数据交换
- **自动接收**: 自动接收小程序发送的 HTML 内容
- **状态通知**: 通知小程序页面加载完成

## 🛠️ 使用方法

### 1. 直接使用

直接在浏览器中打开 `index.html` 文件即可查看效果。

### 2. 本地服务器

推荐使用本地服务器来避免 CORS 问题：

```bash
# 使用启动脚本
cd miniWeb
./start-server.sh

# 或手动启动
python3 -m http.server 8000
```

然后在浏览器中访问：

- **主页面**: `http://localhost:8000/index.html`

### 3. 微信小程序集成

在微信小程序中使用 WebView 组件打开此页面：

```xml
<web-view src="https://your-domain.com/miniWeb/index.html"></web-view>
```

## 🔗 微信小程序通信

### 通信原理

使用 `postMessage` API 实现微信小程序和 Web 页面的双向通信：

1. **Web 页面 → 小程序**: 使用 `window.parent.postMessage()`
2. **小程序 → Web 页面**: 小程序通过 WebView 的 `postMessage` 方法发送消息

### 消息格式

#### 从小程序接收的消息：

```javascript
{
  type: "SET_HTML_CONTENT",
  content: "HTML内容字符串",
  fileName: "文件名",
  fileSize: "文件大小",
  timestamp: 时间戳
}
```

#### 发送到小程序的消息：

```javascript
{
  type: "MESSAGE_TYPE",
  content: "消息内容",
  timestamp: 时间戳
}
```

### 支持的消息类型

#### 从小程序接收：

- `SET_HTML_CONTENT`: 设置 HTML 内容（主要消息类型）
- `SET_TITLE`: 设置页面标题
- `GET_CONTENT`: 获取当前内容

#### 发送到小程序：

- `PAGE_READY`: 页面加载完成通知
- `HTML_CONTENT_UPDATE`: HTML 内容更新通知

### 使用示例

#### 在微信小程序中发送 HTML 内容：

```javascript
// 发送HTML内容到Web页面
webView.postMessage({
  data: {
    type: "SET_HTML_CONTENT",
    content: "<h1>文章标题</h1><p>这是文章内容...</p>",
    fileName: "示例文章",
    fileSize: "2.5 KB",
    timestamp: Date.now(),
  },
});
```

#### 在微信小程序中接收消息：

```javascript
// 监听Web页面消息
webView.addEventListener("message", function (e) {
  console.log("收到Web页面消息:", e.detail.data);

  if (e.detail.data.type === "HTML_CONTENT_UPDATE") {
    // 处理HTML内容更新
    console.log("HTML内容已更新:", e.detail.data.content);
  }
});
```

## 🎨 界面设计

### 页面布局

1. **顶部标题**: "文章预览-创作者工具"
2. **页面标题**: 显示从小程序接收的文件名
3. **复制按钮**: 两个横排按钮，支持复制标题和内容
4. **预览区域**: 大容器显示 HTML 内容的渲染效果

### 样式特点

- **渐变色彩**: 使用蓝紫色渐变主题
- **卡片设计**: 圆角边框和阴影效果
- **响应式**: 支持移动端和桌面端
- **交互反馈**: 按钮悬停和点击效果

## 🔧 技术实现

### 核心功能

- **HTML 解析**: 使用 `innerHTML` 渲染 HTML 内容
- **剪贴板操作**: 支持现代浏览器的 Clipboard API 和降级方案
- **消息处理**: 基于 postMessage 的消息路由系统
- **状态管理**: 全局变量存储接收到的数据

### 安全考虑

- **内容过滤**: 基础的安全过滤机制
- **XSS 防护**: 建议在生产环境使用 DOMPurify 等库
- **消息验证**: 验证消息格式和内容

## 📱 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge
- 移动端浏览器
- 微信内置浏览器

## 🌟 最佳实践

1. **内容安全**: 对 HTML 内容进行安全过滤
2. **错误处理**: 完善的异常处理机制
3. **用户体验**: 清晰的状态提示和反馈
4. **性能优化**: 避免频繁的 DOM 操作

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个工具！

## 📄 许可证

MIT License - 可自由使用和修改

---

**开始使用**: 直接打开 `index.html` 文件，或者启动本地服务器来查看完整效果。

**微信小程序集成**: 参考上述通信说明，实现与小程序的数据交换功能。

**核心功能**: 专注于文章预览和内容复制，为创作者提供简洁高效的工具。
