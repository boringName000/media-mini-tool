# 管理端配置页面 WXML 编译错误修复

## 问题描述

在管理端配置页面开发过程中，遇到了 WXML 文件编译错误：

```
[ WXML 文件编译错误] ./pages/admin-config/admin-config.wxml
Bad value with message: unexpected `>` at pos49.
  26 |         >
  27 |           <view class="picker-content">
> 28 |             <text class="picker-text">
     |                                      ^
  29 |               {{selectedTrackType ? (trackTypeOptions.find(item => item.value === selectedTrackType) || {}).label : '请选择赛道类型'}}
  30 |             </text>
  31 |             <text class="picker-arrow">›</text>
```

## 错误原因

WXML 不支持复杂的 JavaScript 表达式，包括：

1. `find()` 方法
2. 复杂的条件表达式
3. 函数调用（如 `formatFileSize()`）
4. 数组方法（如 `join()`）

## 修复方案

### 1. 数据预处理

将复杂的逻辑从 WXML 移到 JavaScript 中处理：

#### 修复前

```xml
<text class="picker-text">
  {{selectedTrackType ? (trackTypeOptions.find(item => item.value === selectedTrackType) || {}).label : '请选择赛道类型'}}
</text>
```

#### 修复后

```xml
<text class="picker-text">
  {{selectedTrackTypeLabel}}
</text>
```

### 2. 状态文本处理

#### 修复前

```xml
<text class="status-text">
  {{item.uploadStatus === 'pending' ? '待上传' :
    item.uploadStatus === 'uploading' ? '上传中' :
    item.uploadStatus === 'success' ? '上传成功' : '上传失败'}}
</text>
```

#### 修复后

```xml
<text class="status-text">
  {{item.statusText}}
</text>
```

### 3. 文件大小格式化

#### 修复前

```xml
<text class="info-value">{{formatFileSize(previewInfo.totalSize)}}</text>
```

#### 修复后

```xml
<text class="info-value">{{previewInfo.totalSizeFormatted}}</text>
```

### 4. 文件类型显示

#### 修复前

```xml
<text class="info-value">{{previewInfo.fileTypes.join(', ')}}</text>
```

#### 修复后

```xml
<text class="info-value">{{previewInfo.fileTypesText}}</text>
```

## 具体修改

### 1. JavaScript 文件修改

#### 数据字段扩展

```javascript
data: {
  // 新增标签字段
  selectedTrackTypeLabel: '请选择赛道类型',
  selectedPlatformLabel: '请选择平台类型',

  // 扩展预览信息
  previewInfo: {
    totalFiles: 0,
    totalSize: 0,
    totalSizeFormatted: '0 B',
    fileTypes: [],
    fileTypesText: '',
  },
}
```

#### 选择器事件处理

```javascript
// 选择赛道类型
onTrackTypeChange: function (e) {
  const index = parseInt(e.detail.value);
  const selectedOption = this.data.trackTypeOptions[index];
  this.setData({
    selectedTrackType: selectedOption.value,
    selectedTrackTypeLabel: selectedOption.label, // 新增
  });
},

// 选择平台类型
onPlatformChange: function (e) {
  const index = parseInt(e.detail.value);
  const selectedOption = this.data.platformOptions[index];
  this.setData({
    selectedPlatform: selectedOption.value,
    selectedPlatformLabel: selectedOption.label, // 新增
  });
},
```

#### 文件处理优化

```javascript
// 处理选择的文件
processSelectedFiles: function (tempFiles) {
  const files = tempFiles.map((file) => ({
    name: file.name,
    size: file.size,
    sizeFormatted: this.formatFileSize(file.size), // 新增
    path: file.path,
    type: this.getFileType(file.name),
    uploadStatus: "pending",
    statusText: "待上传", // 新增
  }));
  // ...
}

// 更新文件状态
updateFileStatus: function (fileIndex, status, fileID = null, errorMsg = null) {
  const files = this.data.uploadedFiles;
  const file = files[fileIndex];

  if (file) {
    file.uploadStatus = status;

    // 更新状态文本
    const statusTextMap = {
      'pending': '待上传',
      'uploading': '上传中',
      'success': '上传成功',
      'failed': '上传失败'
    };
    file.statusText = statusTextMap[status] || '未知状态';

    if (fileID) file.cloudFileID = fileID;
    if (errorMsg) file.errorMsg = errorMsg;

    this.setData({
      uploadedFiles: files,
    });
  }
}

// 更新预览信息
updatePreviewInfo: function () {
  const files = this.data.uploadedFiles;
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const fileTypes = [...new Set(files.map((file) => file.type))];

  this.setData({
    previewInfo: {
      totalFiles: totalFiles,
      totalSize: totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize), // 新增
      fileTypes: fileTypes,
      fileTypesText: fileTypes.join(', '), // 新增
    },
  });
}
```

### 2. WXML 文件修改

#### 选择器显示

```xml
<!-- 赛道类型选择 -->
<text class="picker-text">
  {{selectedTrackTypeLabel}}
</text>

<!-- 平台类型选择 -->
<text class="picker-text">
  {{selectedPlatformLabel}}
</text>
```

#### 文件信息显示

```xml
<!-- 文件大小 -->
<text class="file-size">{{item.sizeFormatted}}</text>

<!-- 总大小 -->
<text class="info-value">{{previewInfo.totalSizeFormatted}}</text>

<!-- 文件类型 -->
<text class="info-value">{{previewInfo.fileTypesText}}</text>

<!-- 状态文本 -->
<text class="status-text">
  {{item.statusText}}
</text>
```

## 修复效果

### 修复前

- ❌ WXML 编译错误
- ❌ 复杂的 JavaScript 表达式在模板中
- ❌ 函数调用在模板中

### 修复后

- ✅ WXML 编译成功
- ✅ 数据预处理在 JavaScript 中
- ✅ 模板中只使用简单变量
- ✅ 代码更易维护

## 最佳实践

### 1. WXML 限制

- 不支持复杂的 JavaScript 表达式
- 不支持函数调用
- 不支持数组方法
- 只支持简单的变量绑定和条件判断

### 2. 数据处理原则

- 复杂逻辑在 JavaScript 中处理
- 数据预处理后再传递给模板
- 使用计算属性或状态字段
- 避免在模板中进行数据转换

### 3. 代码组织

- 数据字段设计时考虑显示需求
- 事件处理函数中更新相关显示字段
- 保持模板简洁，逻辑清晰

## 总结

通过将复杂的 JavaScript 表达式从 WXML 模板中移除，改为在 JavaScript 中预处理数据，成功解决了 WXML 编译错误。这种修复方式不仅解决了当前问题，还提高了代码的可维护性和性能。

修复后的代码遵循了微信小程序的最佳实践，将数据处理逻辑和显示逻辑分离，使代码结构更加清晰。
