# 新增文章信息云函数

## 功能描述

该云函数用于向 `article-mgr` 数据库中添加新的文章信息记录。

## 数据库

- **数据库名**: `article-mgr`
- **集合名**: `article-mgr`

## 数据字段

| 字段名         | 类型   | 必填 | 说明                                                 |
| -------------- | ------ | ---- | ---------------------------------------------------- |
| `articleId`    | String | ✅   | 文章唯一标识符，格式：ART + 赛道类型 + 时间戳后 6 位 |
| `articleTitle` | String | ✅   | 文章标题（上传的文件名，不含扩展名）                 |
| `uploadTime`   | Date   | ✅   | 上传时间（服务器时间）                               |
| `trackType`    | Number | ✅   | 赛道类型（参考 TrackTypeEnum）                       |
| `platformType` | Number | ✅   | 平台类型（参考 PlatformEnum）                        |
| `downloadUrl`  | String | ✅   | 文件下载地址                                         |
| `createTime`   | Date   | ✅   | 创建时间（服务器时间）                               |

## 赛道类型枚举 (TrackTypeEnum)

```javascript
const TrackTypeEnum = {
  // 美食相关赛道
  FOOD_TRACK: 1, // 美食赛道
  FOOD_GIF: 2, // 美食动图
  FOOD_GREEN: 3, // 美食绿色

  // 娱乐相关赛道
  ENTERTAINMENT: 4, // 娱乐

  // 旅游相关赛道
  TRAVEL_TRACK: 5, // 旅游赛道
  TRAVEL_ARTICLE: 6, // 旅游文章

  // 艺术相关赛道
  CALLIGRAPHY: 7, // 书法
  PHOTOGRAPHY: 8, // 摄影
  ANTIQUE: 9, // 古玩

  // 生活相关赛道
  PET: 10, // 宠物

  // 科技相关赛道
  TECH_DIGITAL: 11, // 科技数码

  // 时尚相关赛道
  FASHION_BEAUTY: 12, // 时尚美妆
};
```

## 平台类型枚举 (PlatformEnum)

```javascript
const PlatformEnum = {
  WECHAT_MP: 1, // 微信公众号
  XIAOHONGSHU: 2, // 小红书
  DOUYIN: 3, // 抖音
  KUAISHOU: 4, // 快手
  BILIBILI: 5, // B站
  WEIBO: 6, // 微博
  ZHIHU: 7, // 知乎
  TIKTOK: 8, // TikTok
};
```

## 调用参数

### 请求参数

| 参数名         | 类型   | 必填 | 说明               |
| -------------- | ------ | ---- | ------------------ |
| `articleTitle` | String | ✅   | 文章标题（文件名） |
| `trackType`    | Number | ✅   | 赛道类型枚举值     |
| `platformType` | Number | ✅   | 平台类型枚举值     |
| `downloadUrl`  | String | ✅   | 文件下载地址       |

### 请求示例

```javascript
wx.cloud.callFunction({
  name: "add-article-info",
  data: {
    articleTitle: "美食文章",
    trackType: 1, // FOOD_TRACK
    platformType: 2, // XIAOHONGSHU
    downloadUrl: "cloud://xxx/article/1/美食文章-1703123456789.txt",
  },
});
```

## 返回结果

### 成功响应

```javascript
{
  "success": true,
  "data": {
    "articleId": "ART1123456",
    "_id": "数据库记录ID",
          "articleData": {
        "articleId": "ART1123456123",
        "articleTitle": "美食文章",
        "uploadTime": "2023-12-21T10:30:45.123Z",
        "trackType": 1,
        "platformType": 2,
        "downloadUrl": "cloud://xxx/article/1/美食文章-1703123456789.txt",
        "createTime": "2023-12-21T10:30:45.123Z"
      }
  },
  "message": "文章信息添加成功"
}
```

### 失败响应

```javascript
{
  "success": false,
  "error": "错误信息",
  "message": "用户友好的错误信息"
}
```

## 文章 ID 生成规则

文章 ID 格式：`ART + 赛道类型 + 时间戳后6位 + 随机数后3位`

### 示例

- 美食赛道 (1): `ART1123456123`
- 娱乐赛道 (4): `ART4456789456`
- 书法赛道 (7): `ART7789012789`

### 生成逻辑

```javascript
const timestamp = Date.now();
const timestampSuffix = timestamp.toString().slice(-6);
const randomSuffix = Math.floor(Math.random() * 1000)
  .toString()
  .padStart(3, "0");
const articleId = `ART${trackType}${timestampSuffix}${randomSuffix}`;
```

## 错误处理

### 参数验证错误

当缺少必要参数时，返回：

```javascript
{
  "success": false,
  "error": "缺少必要参数",
  "message": "请提供文章标题、赛道类型、平台类型和下载地址"
}
```

### 数据库错误

当数据库操作失败时，返回：

```javascript
{
  "success": false,
  "error": "具体错误信息",
  "message": "服务器内部错误"
}
```

## 使用场景

1. **管理端上传文章**: 管理员上传文章文件后，调用此云函数记录文章信息
2. **文章管理**: 为文章管理系统提供数据基础
3. **统计分析**: 支持按赛道类型、平台类型等维度进行统计分析

## 注意事项

1. **时间字段**: 所有时间字段使用 `db.serverDate()` 确保时间准确性
2. **文章 ID 唯一性**: 通过时间戳后缀确保文章 ID 的唯一性
3. **参数验证**: 严格验证输入参数，确保数据完整性
4. **错误日志**: 记录详细的错误信息便于调试

## 部署说明

1. 确保云开发环境已开通
2. 上传云函数代码
3. 安装依赖：`npm install`
4. 部署云函数
5. 测试功能是否正常
