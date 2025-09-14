# admin-download-article 云函数

## 功能描述
管理员批量下载文章云函数，支持批量获取文章的临时下载链接，解决微信云存储 fileID 无法直接在 Web 端访问的问题。

## 入参格式
```json
{
  "articleIds": ["ART1234567890", "ART0987654321"]
}
```

## 参数说明
- `articleIds`: 文章ID数组，必填，非空数组，单次最多支持50个

## 返回格式
```json
{
  "success": true,
  "message": "成功获取 2 篇文章下载链接",
  "data": {
    "successCount": 2,
    "failedCount": 0,
    "notFoundCount": 0,
    "results": [
      {
        "articleId": "ART1234567890",
        "articleTitle": "测试文章1",
        "trackType": 1,
        "platformType": 1,
        "originalFileID": "cloud://env-id.xxx/article/1/1/file_xxx.html",
        "tempDownloadURL": "https://xxx.tcb.qcloud.la/xxx.html?sign=xxx",
        "downloadSuccess": true,
        "downloadError": null,
        "uploadTime": "2024-01-15T10:30:00.000Z"
      }
    ],
    "notFoundIds": [],
    "downloadSummary": {
      "totalFiles": 2,
      "successCount": 2,
      "failedCount": 0,
      "urlExpireTime": "2024-01-15T12:30:00.000Z"
    }
  }
}
```

## 🚀 核心技术方案

### **微信云存储下载机制**
1. **问题**: 文章数据中的 `downloadUrl` 是微信云存储的 `fileID`，无法直接在 Web 端访问
2. **解决**: 使用 `cloud.getTempFileURL()` API 将 `fileID` 转换为临时 HTTPS 下载链接
3. **优势**: 临时链接可直接在 Web 端下载，无需额外认证

### **批量优化特点**
1. **批量查询**: 使用 `db.command.in()` 一次性查询所有文章数据
2. **批量转换**: 使用 `cloud.getTempFileURL()` 批量获取临时链接（一次最多50个）
3. **高效处理**: 减少API调用次数，提升性能

## 功能流程
1. **批量查询**: 根据文章ID数组查询文章数据和 fileID
2. **批量转换**: 将所有 fileID 转换为临时下载链接
3. **结果组装**: 返回文章信息和对应的临时下载URL
4. **链接有效期**: 临时链接有效期2小时（7200秒）

## 返回字段说明
- `tempDownloadURL`: 临时下载链接，Web 端可直接访问下载
- `downloadSuccess`: 是否成功获取下载链接
- `downloadError`: 获取链接失败的错误信息
- `urlExpireTime`: 临时链接过期时间（ISO格式）

## 使用场景
- Web 管理端批量下载文章文件
- 单篇文章下载
- 文章预览（通过临时链接在浏览器中打开）

## 注意事项
- 单次最多支持50篇文章，避免超时
- 临时链接有效期2小时，过期后需重新获取
- 只处理有效的云存储 fileID（以 `cloud://` 开头）
- 文章不存在时会在结果中标记，不影响其他文章处理