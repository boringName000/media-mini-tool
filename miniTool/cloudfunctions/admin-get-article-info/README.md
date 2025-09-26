# admin-get-article-info 云函数

## 功能描述

管理员查询文章信息的云函数，支持根据文章ID或文章标题查询指定文章信息。

## 功能特性

- 支持根据文章ID精确查询
- 支持根据文章标题模糊查询（不区分大小写）
- 返回完整的文章信息原始数据
- 按上传时间倒序排列查询结果

## 入参说明

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| articleId | String | 否 | 文章ID，格式：ART + 赛道类型 + 时间戳后6位 + 随机数后3位 |
| articleTitle | String | 否 | 文章标题，支持模糊查询 |

**注意：** `articleId` 和 `articleTitle` 至少需要提供一个参数。如果同时提供，优先使用 `articleId` 进行精确查询。

## 返回数据格式

### 成功响应

```json
{
  "success": true,
  "message": "成功查询到 N 条文章信息",
  "data": {
    "queryType": "articleId|articleTitle",
    "queryValue": "查询的值",
    "count": 1,
    "articles": [
      {
        "_id": "文档ID",
        "articleId": "ART1123456123",
        "articleTitle": "文章标题",
        "uploadTime": "2023-12-21T10:30:45.123Z",
        "trackType": 1,
        "platformType": 2,
        "downloadUrl": "cloud://xxx/article/1/文章-1703123456789.txt",
        "status": 1
      }
    ]
  }
}
```

### 未找到数据响应

```json
{
  "success": true,
  "message": "未找到匹配的文章信息",
  "data": {
    "queryType": "articleId|articleTitle",
    "queryValue": "查询的值",
    "count": 0,
    "articles": []
  }
}
```

### 错误响应

```json
{
  "success": false,
  "message": "错误信息",
  "data": null
}
```

## 使用示例

### 根据文章ID查询

```javascript
// 调用云函数
wx.cloud.callFunction({
  name: 'admin-get-article-info',
  data: {
    articleId: 'ART1123456123'
  }
}).then(res => {
  console.log('查询结果:', res.result);
});
```

### 根据文章标题模糊查询

```javascript
// 调用云函数
wx.cloud.callFunction({
  name: 'admin-get-article-info',
  data: {
    articleTitle: '美食'
  }
}).then(res => {
  console.log('查询结果:', res.result);
});
```

## 状态码说明

### 文章状态 (status)

| 状态码 | 状态文本 | 说明 |
|--------|----------|------|
| 1 | 未使用 | 文章刚上传，尚未被分配给任何任务 |
| 2 | 已经使用 | 文章已被用户发布，不再可用于新任务 |
| 3 | 待重新修改 | 文章需要修改后才能继续使用 |

### 赛道类型 (trackType)

| 类型码 | 赛道名称 |
|--------|----------|
| 1 | 美食赛道 |
| 2 | 美食动图 |
| 3 | 美食绿色 |
| 4 | 娱乐 |
| 5 | 旅游赛道 |
| 6 | 旅游文章 |
| 7 | 书法 |
| 8 | 摄影 |
| 9 | 古玩 |
| 10 | 宠物 |
| 11 | 科技数码 |
| 12 | 时尚美妆 |

### 平台类型 (platformType)

| 类型码 | 平台名称 |
|--------|----------|
| 1 | 微信公众号 |
| 2 | 小红书 |
| 3 | 抖音 |
| 4 | 快手 |
| 5 | B站 |
| 6 | 微博 |
| 7 | 知乎 |
| 8 | TikTok |

## 注意事项

1. 该云函数主要用于管理员查询文章信息
2. 文章标题查询支持模糊匹配，不区分大小写
3. 查询结果按上传时间倒序排列
4. 返回原始的枚举数据，前端可根据需要进行文本转换
5. 如果查询参数为空，会返回参数错误信息

## 数据库集合

- **集合名称**: `article-mgr`
- **数据库名**: `article-mgr`

## 版本信息

- **版本**: 1.0.0
- **创建时间**: 2023-12-25
- **最后更新**: 2023-12-25