# admin-get-file-urls

批量获取微信云存储文件的长期访问URL

## 功能描述

该云函数用于批量兑换微信云存储文件的长期访问URL，支持一次性处理多个文件ID，返回结果与入参顺序保持一致。

## 入参

```javascript
{
  fileIds: ["cloud://xxx.xxx/file1.jpg", "cloud://xxx.xxx/file2.png", ...]
}
```

- `fileIds`: 微信云存储文件ID数组

## 返回值

```javascript
{
  success: true,
  message: "批量获取完成",
  data: [
    {
      fileId: "cloud://xxx.xxx/file1.jpg",
      success: true,
      tempFileURL: "https://xxx.xxx/file1.jpg?sign=xxx",
      message: "成功"
    },
    {
      fileId: "cloud://xxx.xxx/file2.png", 
      success: false,
      tempFileURL: null,
      message: "文件不存在"
    }
  ]
}
```

## 特性

1. **批量处理**：支持一次性处理多个文件ID
2. **顺序保持**：返回结果与入参数组顺序完全一致
3. **错误处理**：单个文件失败不影响其他文件的处理
4. **详细反馈**：每个文件都有独立的成功状态和错误信息
5. **参数验证**：对入参进行严格的类型和格式检查

## 使用场景

- 管理后台批量下载文件
- 批量生成文件预览链接
- 文件管理系统中的批量操作