# admin-article-info 云函数

## 功能描述
管理员获取文章数据库统计信息的云函数，提供文章的各种统计数据和详细信息。

## 返回数据结构

### 成功响应
```json
{
  "success": true,
  "data": {
    "totalCount": 1250,
    "unusedCount": 800,
    "usedCount": 400,
    "needRevisionCount": 50,
    "platformTrackStats": {
      "小红书": {
        "美食": {
          "unusedCount": 200,
          "usedCount": 100,
          "needRevisionCount": 10
        },
        "旅游": {
          "unusedCount": 150,
          "usedCount": 80,
          "needRevisionCount": 5
        }
      },
      "抖音": {
        "美食": {
          "unusedCount": 180,
          "usedCount": 90,
          "needRevisionCount": 8
        }
      }
    },
    "needRevisionArticles": [
      {
        "articleId": "art_123456",
        "articleTitle": "美食文章标题",
        "uploadTime": "2024-01-15T10:30:00.000Z",
        "trackType": "美食",
        "platformType": "小红书",
        "downloadUrl": "https://example.com/file.docx",
        "status": 3
      }
    ],
    "queryTime": "2024-01-20T12:00:00.000Z"
  },
  "message": "文章统计信息获取成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "具体错误信息",
  "message": "服务器内部错误"
}
```

## 数据字段说明

### 基础统计字段
- `totalCount`: 文章总数
- `unusedCount`: 未使用文章数量（status = 1）
- `usedCount`: 已使用文章数量（status = 2）
- `needRevisionCount`: 待修改文章数量（status = 3）

### 平台赛道统计
- `platformTrackStats`: 按平台和赛道分组的统计数据
  - 第一层：平台类型（如"小红书"、"抖音"等）
  - 第二层：赛道类型（如"美食"、"旅游"等）
  - 第三层：各状态的数量统计

### 待修改文章详情
- `needRevisionArticles`: 所有状态为3的文章详细信息数组
  - `articleId`: 文章ID
  - `articleTitle`: 文章标题
  - `uploadTime`: 上传时间
  - `trackType`: 赛道类型
  - `platformType`: 平台类型
  - `downloadUrl`: 下载链接
  - `status`: 文章状态

## 性能优化

1. **减少数据库查询**: 通过先获取平台赛道统计，再本地计算基础统计，从3次查询优化为2次
2. **聚合查询**: 使用MongoDB聚合管道进行统计，避免多次查询
3. **分组统计**: 一次性获取所有平台赛道的统计数据
4. **本地计算**: 基础统计数据通过本地汇总计算得出，减少数据库负载
5. **字段筛选**: 待修改文章只返回必要字段，减少数据传输量
6. **索引优化**: 建议在`status`、`platformType`、`trackType`字段上建立索引

## 使用场景

- 管理后台仪表盘数据展示
- 文章管理页面统计信息
- 数据分析和报表生成
- 运营数据监控

## 注意事项

1. 该云函数需要管理员权限调用
2. 大数据量情况下查询可能较慢，建议添加缓存机制
3. 返回的待修改文章按上传时间倒序排列
4. 查询时间字段可用于缓存失效判断