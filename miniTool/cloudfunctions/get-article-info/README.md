# 获取文章信息云函数

## 功能描述

根据文章 ID 数组，从 `article-mgr` 数据库集合中获取对应的文章详细信息。

## 请求参数

| 参数名         | 类型          | 必填 | 说明                                     |
| -------------- | ------------- | ---- | ---------------------------------------- |
| `articleIds`   | Array<String> | ❌   | 文章 ID 数组（与类型查询互斥，优先使用） |
| `trackType`    | Number        | ❌   | 赛道类型（必须与 platformType 同时提供） |
| `platformType` | Number        | ❌   | 平台类型（必须与 trackType 同时提供）    |

**注意**: 必须提供 `articleIds` 或者同时提供 `trackType` 和 `platformType`

## 请求示例

### 1. 使用文章 ID 数组查询

```javascript
// 调用云函数
wx.cloud.callFunction({
  name: "get-article-info",
  data: {
    articleIds: ["ART1123456123", "ART1123456124", "ART1123456125"],
  },
});
```

### 2. 使用赛道类型和平台类型查询

```javascript
// 调用云函数
wx.cloud.callFunction({
  name: "get-article-info",
  data: {
    trackType: 1, // 美食赛道
    platformType: 2, // 小红书平台
  },
});
```

## 返回结果

### 成功响应

```javascript
{
  "success": true,
  "data": {
    "articles": [
      {
        "articleId": "ART1123456123",
        "title": "文章标题",
        "downloadUrl": "https://example.com/article.txt",
        "trackType": 1,
        "platform": 1,
        "createTime": "2024-01-15T10:30:00.000Z"
      }
    ],
    "totalCount": 1,
    "requestedCount": 3,
    "notFoundIds": ["ART1123456124", "ART1123456125"]
  },
  "message": "成功获取 1 篇文章信息"
}
```

### 失败响应

```javascript
{
  "success": false,
  "error": "错误类型",
  "message": "错误描述"
}
```

## 返回字段说明

### data 字段

| 字段名           | 类型          | 说明                                                   |
| ---------------- | ------------- | ------------------------------------------------------ |
| `articles`       | Array<Object> | 文章信息数组                                           |
| `totalCount`     | Number        | 实际获取到的文章数量                                   |
| `requestedCount` | Number        | 请求的文章数量（仅在使用 articleIds 查询时返回）       |
| `notFoundIds`    | Array<String> | 未找到的文章 ID 数组（仅在使用 articleIds 查询时返回） |
| `trackType`      | Number        | 查询的赛道类型（仅在使用类型查询时返回）               |
| `platformType`   | Number        | 查询的平台类型（仅在使用类型查询时返回）               |

### articles 数组中的文章对象

| 字段名        | 类型   | 说明           |
| ------------- | ------ | -------------- |
| `articleId`   | String | 文章唯一标识符 |
| `title`       | String | 文章标题       |
| `downloadUrl` | String | 文章下载地址   |
| `trackType`   | Number | 赛道类型       |
| `platform`    | Number | 平台类型       |
| `createTime`  | Date   | 创建时间       |

## 错误码说明

| 错误类型         | 说明                                                     |
| ---------------- | -------------------------------------------------------- |
| `参数错误`       | 未提供 articleIds 或未同时提供 trackType 和 platformType |
| `查询数量超限`   | 单次查询超过 100 个文章 ID                               |
| `服务器内部错误` | 数据库查询异常                                           |

## 使用限制

- 单次查询最多支持 100 个文章 ID
- 文章 ID 必须是有效的字符串格式
- 返回的文章按数据库中的顺序排列

## 使用场景

1. **任务列表页面**: 获取任务对应的文章详细信息
2. **文章详情页面**: 根据文章 ID 获取完整文章信息
3. **批量文章查询**: 一次性获取多个文章的详细信息
4. **类型筛选查询**: 根据赛道类型和平台类型获取相关文章
5. **文章推荐**: 获取特定类型和平台的文章列表

## 注意事项

1. 确保传入的文章 ID 格式正确
2. 注意查询数量限制，避免一次性查询过多数据
3. 处理未找到文章的情况，`notFoundIds` 字段会列出所有未找到的文章 ID
4. 建议在前端对查询结果进行缓存，避免重复查询
5. 使用类型查询时，必须同时提供 `trackType` 和 `platformType` 两个参数
6. 文章 ID 查询优先级高于类型查询，如果同时提供两种参数，优先使用文章 ID 查询
