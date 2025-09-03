# Test-DB 页面

## 功能概述

这是一个 WebView 测试页面，主要用于测试微信小程序与 Web 页面的双向通信功能。页面集成了文件管理功能，可以从微信内存读取文件列表，并通过 WebView 预览文件内容。

## 主要功能

### 1. 文件管理

- **文件列表显示**: 自动从 `downloads` 目录读取已下载的文件
- **文件信息展示**: 显示文件名、大小、修改时间等详细信息
- **文件操作**: 支持删除单个文件和清空所有文件
- **元数据读取**: 自动读取文章标题和下载时间等元数据

### 2. WebView 集成

- **WebView 控制**: 可以打开和关闭 WebView 窗口
- **页面导航**: 自动导航到转换页面 (`#converter`)
- **实时通信**: 通过 postMessage 实现与 Web 页面的双向通信

### 3. 文件预览

- **预览按钮**: 每个文件都有预览按钮，点击后打开 WebView
- **内容传输**: 自动读取文件内容并通过 postMessage 发送到 Web 页面
- **实时渲染**: Web 页面接收数据后在预览框中显示实际渲染效果

## 技术实现

### 文件读取

```javascript
// 读取 downloads 目录下的文件
const fs = wx.getFileSystemManager();
const downloadsPath = `${wx.env.USER_DATA_PATH}/downloads`;
fs.readdir({
  dirPath: downloadsPath,
  success: (res) => {
    // 处理文件列表
  },
});
```

### WebView 通信

```javascript
// 发送文件内容到 WebView
const message = {
  type: "SET_HTML_CONTENT",
  content: fileContent,
  fileName: file.displayName,
  fileSize: file.size,
  timestamp: Date.now(),
};

webView.postMessage({
  data: message,
});
```

### 消息监听

```javascript
// 监听 WebView 发送的消息
onWebViewMessage: function (e) {
  const message = e.detail.data;
  switch (message.type) {
    case "PAGE_READY":
      // 页面加载完成
      break;
    case "HTML_CONTENT_UPDATE":
      // HTML 内容更新
      break;
  }
}
```

## 使用流程

1. **页面加载**: 自动加载本地文件列表
2. **选择文件**: 在文件列表中选择要预览的文件
3. **点击预览**: 点击文件的"预览"按钮
4. **WebView 打开**: 自动打开 WebView 并导航到转换页面
5. **内容传输**: 通过 postMessage 发送文件内容
6. **预览显示**: Web 页面接收数据并显示预览效果

## 通信协议

### 发送到 Web 页面的消息

- `SET_HTML_CONTENT`: 设置 HTML 内容
  ```javascript
  {
    type: "SET_HTML_CONTENT",
    content: "HTML内容",
    fileName: "文件名",
    fileSize: "文件大小",
    timestamp: 时间戳
  }
  ```

### 从 Web 页面接收的消息

- `PAGE_READY`: 页面加载完成通知
- `HTML_CONTENT_UPDATE`: HTML 内容更新通知

## 依赖组件

- `timeUtils.js`: 时间格式化工具
- `articleDownloadUtils.js`: 文章下载和文件管理工具

## 注意事项

1. **文件权限**: 确保小程序有读取本地文件的权限
2. **WebView 加载**: 需要等待 WebView 完全加载后再发送消息
3. **内容安全**: 对 HTML 内容进行安全过滤，防止 XSS 攻击
4. **错误处理**: 完善的错误处理机制，包括文件读取失败、WebView 加载失败等

## 扩展功能

- 支持更多文件格式
- 添加文件搜索和过滤功能
- 实现文件分类管理
- 添加文件预览历史记录
