# admin-delete-article 云函数

## 功能描述
管理员批量删除文章云函数，支持高性能批量删除指定文章ID的数据库记录和云存储文件。

## 入参格式
```json
{
  "articleIds": ["ART1234567890", "ART0987654321"]
}
```

## 参数说明
- `articleIds`: 文章ID数组，必填，非空数组，单次最多支持100个

## 返回格式
```json
{
  "success": true,
  "message": "完全删除 2 篇文章",
  "data": {
    "fullyDeletedCount": 2,
    "partiallyDeletedCount": 0,
    "failedCount": 0,
    "notFoundCount": 0,
    "results": [
      {
        "articleId": "ART1234567890",
        "articleTitle": "测试文章1",
        "trackType": 1,
        "platformType": 1,
        "dbId": "doc_id_1",
        "downloadUrl": "cloud://xxx.html",
        "cloudDeleteSuccess": true,
        "cloudDeleteError": null,
        "dbDeleteSuccess": true,
        "dbDeleteSkipped": false,
        "fullyDeleted": true
      }
    ],
    "notFoundIds": [],
    "cloudDeleteSummary": {
      "totalFiles": 2,
      "successCount": 2,
      "failedCount": 0
    },
    "dbDeleteSummary": {
      "success": true,
      "deletedCount": 2,
      "error": null,
      "candidateCount": 2
    }
  }
}
```

## 返回字段说明
- `fullyDeletedCount`: 完全删除成功的文章数量（云存储+数据库都删除成功）
- `partiallyDeletedCount`: 部分删除的文章数量（云存储删除失败，数据库记录保留）
- `failedCount`: 完全删除失败的文章数量
- `fullyDeleted`: 该文章是否完全删除成功
- `dbDeleteSkipped`: 是否因为云存储删除失败而跳过数据库删除

## 🚀 性能优化特点
1. **批量查询优化**: 一次性查询所有文章数据，减少数据库调用次数
2. **批量删除云存储**: 使用微信云开发的批量删除API，一次性删除多个文件
3. **批量删除数据库**: 使用 `db.command.in` 进行批量删除操作
4. **分步骤执行**: 查询 → 批量删除云存储 → 条件删除数据库
5. **数据一致性保证**: 只删除云存储文件成功删除的数据库记录，避免孤立文件

## 🛡️ 数据一致性机制
- **云存储优先**: 先删除云存储文件，只有成功删除的文件才会删除对应的数据库记录
- **避免孤立文件**: 防止云存储删除失败但数据库删除成功导致的孤立文件问题
- **分类结果**: 区分完全删除、部分删除和删除失败的文章

## 删除流程（优化后）
1. **批量查询**: 一次性查询所有文章数据（1次数据库调用）
2. **批量删除云存储**: 使用云开发批量删除API删除所有文件（1次API调用）
3. **条件删除数据库**: 只删除云存储成功的文章对应的数据库记录（1次数据库调用）
4. **结果汇总**: 返回详细的删除结果和统计信息

## 性能对比
- **优化前**: N个文章需要 3N 次数据库/API调用
- **优化后**: N个文章只需要 3 次数据库/API调用
- **性能提升**: 当删除100篇文章时，从300次调用减少到3次调用

## 注意事项
- 单次删除最多支持100篇文章，避免超时
- 文章ID不存在时会在结果中标记，不影响其他文章删除
- **数据一致性保证**: 云存储文件删除失败时，对应的数据库记录不会被删除，避免孤立文件
- 返回详细的删除统计信息，包括完全删除、部分删除、失败等状态
- 建议定期检查部分删除的文章，手动处理云存储删除失败的情况