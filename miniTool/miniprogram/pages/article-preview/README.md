# 文章预览页面 - 重构版本

## 概述

文章预览页面已完全重构，从原来的本地 HTML 渲染模式改为使用 web-view 组件显示远程页面内容。

## 主要功能

### 1. 参数接收

- 接收从布局工具页面传递的文章标题和下载地址
- 自动解析和验证参数的有效性

### 2. 云存储 API 集成

- 直接使用传递来的云存储文章 ID
- 调用云存储 API 获取临时下载 URL
- 简化的逻辑链路，无需复杂的 URL 解析

### 3. Web-view 集成

- 使用微信小程序的 web-view 组件
- 跳转到指定的默认域名
- 自动构建包含必要参数的 URL

### 4. 错误处理

- 完善的错误状态显示
- 重试机制
- 用户友好的错误提示

### 5. 用户体验优化

- 智能的加载状态管理
- 友好的准备状态界面
- 动态进度条和动画效果

## 技术架构

### 页面结构

```
article-preview/
├── article-preview.js      # 页面逻辑
├── article-preview.wxml    # 页面结构
├── article-preview.wxss    # 页面样式
├── article-preview.json    # 页面配置
└── README.md              # 说明文档
```

### 数据流

1. 布局工具页面 → 传递文章标题和云存储文章 ID
2. 文章预览页面 → 直接显示准备界面
3. 后台处理 → 获取临时下载 URL 并构建 web-view URL
4. 准备完成 → 显示 web-view 内容

### 关键配置

- **默认域名**: `cloud1-5g6ik91va74262bb-1367027189.tcloudbaseapp.com`
- **目标页面**: `/miniWeb/index.html`
- **传递参数**: `tempUrl` (临时下载 URL), `fileName` (文件名)

## 使用方法

### 1. 从布局工具页面跳转

```javascript
wx.navigateTo({
  url: `/pages/article-preview/article-preview?articleTitle=${encodeURIComponent(
    article.title
  )}&downloadUrl=${encodeURIComponent(article.downloadUrl)}`,
});
```

### 2. 页面生命周期

- `onLoad`: 解析参数并直接显示准备界面
- `startBackgroundProcess`: 后台开始处理
- `getTempDownloadUrl`: 获取临时下载 URL
- `callCloudStorageAPI`: 调用云存储 API
- `buildWebViewUrl`: 构建 web-view URL 并显示内容

## 云存储 API 使用指南

### 核心 API

#### wx.cloud.getTempFileURL

这是微信小程序官方提供的云存储 API，用于获取文件的临时下载 URL。

#### 基本用法

```javascript
wx.cloud.getTempFileURL({
  fileList: ["cloud://xxx.xxx/fileId"],
  success: (res) => {
    console.log("获取成功:", res.fileList);
  },
  fail: (error) => {
    console.error("获取失败:", error);
  },
});
```

#### 参数说明

- `fileList`: 文件 ID 数组，支持批量获取
- `success`: 成功回调函数
- `fail`: 失败回调函数

#### 返回数据结构

```javascript
{
  fileList: [
    {
      fileID: "cloud://xxx.xxx/fileId",
      status: 0, // 0表示成功，其他值表示失败
      tempFileURL: "https://xxx.com/temp/xxx", // 临时下载URL
      errMsg: "ok", // 状态描述
    },
  ];
}
```

### 在文章预览页面中的使用

#### 1. 函数实现

```javascript
callCloudStorageAPI: function (fileId) {
  console.log("☁️ 调用云存储API，文件ID:", fileId);

  wx.cloud.getTempFileURL({
    fileList: [fileId],
    success: (res) => {
      console.log("✅ 云存储API调用成功:", res);

      if (res.fileList && res.fileList.length > 0) {
        const fileInfo = res.fileList[0];

        if (fileInfo.status === 0 && fileInfo.tempFileURL) {
          // 成功获取临时下载URL
          const tempUrl = fileInfo.tempFileURL;
          console.log("✅ 成功获取临时下载URL:", tempUrl);

          this.setData({
            tempDownloadUrl: tempUrl,
          });

          // 构建web-view的URL
          this.buildWebViewUrl();
        } else {
          // 获取临时URL失败
          const errorMsg = fileInfo.errMsg || "获取临时下载URL失败";
          console.error("❌ 获取临时下载URL失败:", errorMsg);
          this.setData({
            errorMessage: errorMsg,
          });
        }
      } else {
        console.error("❌ 云存储API返回数据异常");
        this.setData({
          errorMessage: "云存储API返回数据异常",
        });
      }
    },
    fail: (error) => {
      console.error("❌ 云存储API调用失败:", error);
      this.setData({
        errorMessage: "云存储API调用失败: " + (error.errMsg || "未知错误"),
      });
    }
  });
}
```

#### 2. 错误处理

##### 常见错误类型

1. **文件不存在**

   - `status`: 非 0 值
   - `errMsg`: 具体错误信息

2. **权限不足**

   - 文件访问权限设置问题
   - 需要检查云存储的安全规则

3. **网络错误**
   - 网络连接问题
   - 云服务暂时不可用

##### 错误处理策略

```javascript
// 根据不同的错误类型提供相应的处理
if (fileInfo.status !== 0) {
  let errorMessage = "获取临时下载URL失败";

  switch (fileInfo.status) {
    case 1:
      errorMessage = "文件不存在或已被删除";
      break;
    case 2:
      errorMessage = "文件访问权限不足";
      break;
    case 3:
      errorMessage = "文件格式不支持";
      break;
    default:
      errorMessage = fileInfo.errMsg || "未知错误";
  }

  this.setData({
    errorMessage: errorMessage,
  });
}
```

### 性能优化建议

#### 1. 批量获取

如果需要获取多个文件的临时 URL，可以一次性调用：

```javascript
// 批量获取多个文件的临时URL
wx.cloud.getTempFileURL({
  fileList: ["fileId1", "fileId2", "fileId3"],
  success: (res) => {
    res.fileList.forEach((fileInfo) => {
      if (fileInfo.status === 0) {
        console.log(`文件 ${fileInfo.fileID} 的临时URL:`, fileInfo.tempFileURL);
      }
    });
  },
});
```

#### 2. 缓存机制

临时 URL 有一定的有效期，可以实现简单的缓存：

```javascript
// 简单的缓存机制
const tempUrlCache = new Map();

function getTempUrlWithCache(fileId) {
  const cached = tempUrlCache.get(fileId);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    // 1小时有效期
    return cached.url;
  }

  // 重新获取
  wx.cloud.getTempFileURL({
    fileList: [fileId],
    success: (res) => {
      if (res.fileList[0].status === 0) {
        tempUrlCache.set(fileId, {
          url: res.fileList[0].tempFileURL,
          timestamp: Date.now(),
        });
      }
    },
  });
}
```

### 注意事项

#### 1. 临时 URL 有效期

- 临时 URL 有有效期限制，通常为 1-2 小时
- 过期后需要重新调用 API 获取
- 建议在 URL 即将过期时主动刷新

#### 2. 权限控制

- 确保云存储的安全规则配置正确
- 检查文件的访问权限设置
- 考虑用户身份验证和授权

#### 3. 错误重试

- 对于网络错误，可以实现重试机制
- 设置合理的重试次数和间隔
- 避免无限重试导致的性能问题

## 状态调试指南

### 状态变量说明

#### 核心状态变量

- `isPreparing`: 是否处于准备状态
- `tempDownloadUrl`: 临时下载 URL
- `webViewUrl`: web-view 的 URL
- `errorMessage`: 错误信息

### 状态转换流程

#### 1. 初始状态

```
isPreparing: true
tempDownloadUrl: ""
webViewUrl: ""
errorMessage: ""
```

**显示**: 准备状态界面（渐变背景 + 画笔图标 + 等待文案）

#### 2. 获取临时 URL 成功

```
isPreparing: true
tempDownloadUrl: "https://xxx.com/temp/xxx"
webViewUrl: ""
errorMessage: ""
```

**显示**: 准备状态界面

#### 3. 构建 web-view URL 完成

```
isPreparing: false
tempDownloadUrl: "https://xxx.com/temp/xxx"
webViewUrl: "https://xxx.com/miniWeb/index.html?xxx"
errorMessage: ""
```

**显示**: web-view 内容

### 调试要点

#### 1. 检查状态变量

在浏览器控制台中查看：

```javascript
// 在页面中执行
console.log("当前状态:", {
  isPreparing: this.data.isPreparing,
  tempDownloadUrl: this.data.tempDownloadUrl,
  webViewUrl: this.data.webViewUrl,
  errorMessage: this.data.errorMessage,
});
```

#### 2. 关键日志点

- "🎨 进入准备状态，显示友好等待界面"
- "🌐 构建 web-view URL: xxx"
- "✅ web-view URL 构建完成，页面准备就绪"
- "🎨 准备状态结束，显示 web-view 内容"

#### 3. 常见问题排查

##### 问题 1: 准备状态不显示

**可能原因**:

- `isPreparing` 没有正确设置为 `true`
- WXML 条件判断有问题
- 状态转换太快

**排查方法**:

```javascript
// 检查状态设置
console.log("isPreparing:", this.data.isPreparing);
console.log("tempDownloadUrl:", this.data.tempDownloadUrl);
console.log("webViewUrl:", this.data.webViewUrl);
```

##### 问题 2: 状态转换逻辑混乱

**可能原因**:

- 多个地方同时修改状态
- 异步操作顺序问题

**排查方法**:

```javascript
// 在每次setData后添加日志
this.setData(
  {
    tempDownloadUrl: tempUrl,
    isPreparing: true,
  },
  () => {
    console.log("状态更新后:", {
      isPreparing: this.data.isPreparing,
      tempDownloadUrl: this.data.tempDownloadUrl,
    });
  }
);
```

### 测试建议

#### 1. 手动测试状态

```javascript
// 在控制台中手动设置状态进行测试
this.setData({
  isPreparing: true,
  tempDownloadUrl: "test-url",
  webViewUrl: "",
});
```

#### 2. 模拟网络延迟

```javascript
// 在callCloudStorageAPI中添加延迟测试
setTimeout(() => {
  // 原有的成功处理逻辑
}, 1000); // 模拟1秒网络延迟
```

#### 3. 检查 WXML 渲染

确保 WXML 中的条件判断正确：

```xml
<!-- 准备状态 -->
<view wx:elif="{{isPreparing}}" class="preparing-container">
  <!-- 内容 -->
</view>

<!-- web-view内容 -->
<view wx:elif="{{webViewUrl && !isPreparing}}" class="webview-container">
  <!-- 内容 -->
</view>
```

## 用户体验流程

### 页面状态流程

#### 1. 初始加载状态

```
用户进入页面 → 直接显示准备状态界面 → 后台开始处理
```

**界面特征**:

- 渐变背景（蓝紫色）
- 画笔图标 🎨
- 主标题："正在准备预览效果"
- 副标题："请耐心等待，页面正在初始化中..."
- 状态提示："正在获取下载链接..."

#### 2. 准备状态

```
获取临时下载URL成功 → 保持准备状态 → 构建web-view URL
```

**界面特征**:

- 继续显示准备状态界面
- 用户看到友好的等待提示
- 后台完成 URL 构建

#### 3. Web-view 加载状态

```
构建URL完成 → 显示web-view → 加载远程页面
```

**界面特征**:

- web-view 组件开始加载
- 页面标题保持显示
- 后台加载 miniWeb 页面内容

#### 4. 内容显示状态

```
web-view加载完成 → 显示文章预览内容
```

**界面特征**:

- 完整的文章预览内容
- 响应式布局适配

#### 5. 错误处理状态

```
任何步骤失败 → 显示错误信息 → 提供重试选项
```

**界面特征**:

- 警告图标 ⚠️
- 详细的错误描述
- 重试按钮（返回按钮已移除，使用系统导航栏）

### 状态转换逻辑

#### 状态机设计

```javascript
// 状态转换逻辑
if (errorMessage) {
  // 显示错误状态
} else if (isPreparing) {
  // 显示准备状态
} else if (webViewUrl && !isPreparing) {
  // 显示web-view内容
} else {
  // 显示默认等待状态
}
```

### 用户体验优化点

#### 1. 视觉反馈

- **准备状态**: 渐变背景 + 画笔图标 + 清晰文案
- **错误状态**: 警告图标 + 清晰错误信息
- **内容状态**: web-view 组件

#### 2. 状态连续性

- 每个状态都有明确的视觉标识
- 状态转换平滑自然
- 用户始终知道当前处于什么阶段

#### 3. 等待体验

- 避免空白页面
- 提供有意义的状态信息
- 使用静态设计，避免动画影响性能

#### 4. 错误处理

- 清晰的错误描述
- 提供重试选项
- 友好的错误提示

### 响应式设计

#### 移动端适配

- 所有状态在移动端都有合适的显示
- 按钮大小和间距适配触摸操作
- 文字大小在不同屏幕尺寸下保持可读性

#### 性能优化

- 使用静态设计，避免复杂动画
- 减少不必要的状态变量
- 优化状态转换逻辑

## 注意事项

### 1. 云存储 API 集成

- 使用微信小程序官方 API：`wx.cloud.getTempFileURL`
- 直接使用传递来的云存储文章 ID，无需复杂的 URL 解析
- 支持批量获取临时下载 URL，提高性能

### 2. 域名配置

- 确保默认域名配置正确
- 检查域名是否已备案和配置 HTTPS
- 验证 miniWeb 页面是否可正常访问

### 3. 参数传递

- URL 参数需要正确编码
- 文件 ID 直接使用，无需提取逻辑
- 临时下载 URL 的有效期管理

### 4. 返回按钮优化

- 已移除自定义返回按钮
- 使用系统导航栏的返回按钮
- 避免功能重复和 UI 冗余

## 开发建议

### 1. 云存储 API 实现

```javascript
// 使用微信小程序云存储API获取临时下载URL
callCloudStorageAPI: function (fileId) {
  wx.cloud.getTempFileURL({
    fileList: [fileId],
    success: (res) => {
      if (res.fileList && res.fileList.length > 0) {
        const fileInfo = res.fileList[0];
        if (fileInfo.status === 0 && fileInfo.tempFileURL) {
          const tempUrl = fileInfo.tempFileURL;
          this.setData({ tempDownloadUrl: tempUrl });
          this.buildWebViewUrl();
        }
      }
    },
    fail: (error) => {
      console.error('云存储API调用失败:', error);
      this.handleError(error);
    }
  });
}
```

### 2. 错误处理增强

- 添加网络超时处理
- 实现 API 调用重试机制
- 提供更详细的错误分类

### 3. 性能优化

- 添加加载状态缓存
- 实现 URL 参数验证优化
- 考虑添加离线模式支持

## 测试要点

### 1. 参数传递测试

- 验证文章标题和下载地址正确传递
- 测试特殊字符和长文本处理

### 2. 云存储文章 ID 验证测试

- 测试云存储文章 ID 的有效性
- 验证参数传递的准确性

### 3. Web-view 集成测试

- 验证页面跳转和加载
- 测试参数传递到远程页面

### 4. 错误处理测试

- 测试网络异常情况
- 验证错误提示和重试功能

### 5. 状态转换测试

- 测试各种状态之间的转换
- 验证状态变量的一致性
- 检查边界情况处理

### 6. 用户体验测试

- 测试不同网络环境下的体验
- 验证错误情况的处理
- 检查界面的响应性

### 7. 响应式测试

- 测试不同屏幕尺寸下的显示
- 验证触摸操作的便利性
- 检查文字的可读性

## 未来优化方向

### 1. 智能预加载

- 在用户点击预览时就开始准备
- 减少等待时间

### 2. 个性化界面

- 根据用户偏好调整界面风格
- 支持主题切换

### 3. 进度指示

- 更精确的加载进度显示
- 预估剩余时间

### 4. 离线支持

- 缓存已加载的内容
- 离线状态下的友好提示

## 更新日志

### v2.1.0 (当前版本)

- 移除自定义返回按钮，使用系统导航栏
- 优化状态管理，简化状态变量
- 整合所有文档到一个 README.md
- 完善错误处理和用户体验

### v2.0.0 (重构版本)

- 完全重构页面架构
- 集成 web-view 组件
- 添加云存储 API 支持
- 优化错误处理和用户体验

### v1.0.0 (原版本)

- 本地 HTML 渲染
- mp-html 组件集成
- 基础复制功能
