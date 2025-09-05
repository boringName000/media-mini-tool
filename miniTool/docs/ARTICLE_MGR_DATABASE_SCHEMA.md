# Article-Mgr 数据库结构文档

## 数据库概述

`article-mgr` 数据库用于管理文章信息，存储上传的文章文件的相关元数据。

## 数据库信息

- **数据库名**: `article-mgr`
- **集合名**: `article-mgr`
- **用途**: 文章信息管理
- **创建时间**: 2023-12-21

## 数据字段结构

### 核心字段

| 字段名         | 类型   | 必填 | 默认值            | 说明                                                                 |
| -------------- | ------ | ---- | ----------------- | -------------------------------------------------------------------- |
| `articleId`    | String | ✅   | -                 | 文章唯一标识符，格式：ART + 赛道类型 + 时间戳后 6 位 + 随机数后 3 位 |
| `articleTitle` | String | ✅   | -                 | 文章标题（上传的文件名，不含扩展名）                                 |
| `uploadTime`   | Date   | ✅   | `db.serverDate()` | 上传时间（服务器时间）                                               |
| `trackType`    | Number | ✅   | -                 | 赛道类型（参考 TrackTypeEnum）                                       |
| `platformType` | Number | ✅   | -                 | 平台类型（参考 PlatformEnum）                                        |
| `downloadUrl`  | String | ✅   | -                 | 文件下载地址（云存储路径）                                           |
| `status`       | Number | ✅   | 1                 | 文章状态：1-未使用，2-已经使用，3-待重新修改                         |

### 系统字段

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
| ------ | ---- | ---- | ------ | ---- |

## 字段详细说明

### articleId（文章 ID）

**格式**: `ART + 赛道类型 + 时间戳后6位 + 随机数后3位`

**示例**:

- 美食赛道 (1): `ART1123456123`
- 娱乐赛道 (4): `ART4456789456`
- 书法赛道 (7): `ART7789012789`

**生成规则**:

```javascript
const timestamp = Date.now();
const timestampSuffix = timestamp.toString().slice(-6);
const randomSuffix = Math.floor(Math.random() * 1000)
  .toString()
  .padStart(3, "0");
const articleId = `ART${trackType}${timestampSuffix}${randomSuffix}`;
```

**特点**:

- 唯一性：通过时间戳后缀和随机数确保唯一性
- 可读性：包含赛道类型信息
- 排序性：按时间顺序自然排序
- 并发安全：支持同时上传多个文件

### articleTitle（文章标题）

**来源**: 上传文件的原始文件名

**示例**: `美食文章`, `旅游攻略`, `书法作品`

**要求**:

- 不能为空
- 建议使用有意义的文件名
- 支持中文和英文

### uploadTime（上传时间）

**类型**: 服务器时间

**格式**: ISO 8601 格式

**示例**: `2023-12-21T10:30:45.123Z`

**特点**:

- 使用 `db.serverDate()` 确保时间准确性
- 不受客户端时间影响
- 用于记录文件上传的确切时间

### trackType（赛道类型）

**类型**: 数字枚举

**参考**: `TrackTypeEnum`

**枚举值**:

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

### platformType（平台类型）

**类型**: 数字枚举

**参考**: `PlatformEnum`

**枚举值**:

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

### downloadUrl（下载地址）

**格式**: 云存储文件路径

**示例**: `cloud://xxx/article/1/美食文章-1703123456789.txt`

**路径结构**: `cloud://环境ID/article/{赛道类型}/{文件名}-{时间戳}.txt`

**特点**:

- 指向云存储中的实际文件
- 包含完整的文件路径信息
- 支持直接下载访问

### status（文章状态）

**类型**: 数字枚举

**枚举值**:

```javascript
const ArticleStatusEnum = {
  UNUSED: 1, // 未使用
  USED: 2, // 已经使用
  NEED_REVISION: 3, // 待重新修改
};
```

**状态说明**:

- **未使用 (1)**: 文章刚上传，尚未被分配给任何任务
- **已经使用 (2)**: 文章已被用户发布，不再可用于新任务
- **待重新修改 (3)**: 文章需要修改后才能继续使用

**状态流转**:

```
未使用 → 已经使用 (用户发布文章后)
未使用 → 待重新修改 (管理员标记需要修改)
待重新修改 → 未使用 (修改完成后重新启用)
```

## 数据示例

### 完整记录示例

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "articleId": "ART1123456123",
  "articleTitle": "美食文章",
  "uploadTime": "2023-12-21T10:30:45.123Z",
  "trackType": 1,
  "platformType": 2,
  "downloadUrl": "cloud://xxx/article/1/美食文章-1703123456789.txt",
  "status": 1
}
```

### 不同赛道示例

```json
// 娱乐赛道文章
{
  "articleId": "ART4456789456",
  "articleTitle": "娱乐新闻",
  "trackType": 4,
  "platformType": 3,
  "downloadUrl": "cloud://xxx/article/4/娱乐新闻-1703123456789.txt",
  "status": 1
}

// 书法赛道文章
{
  "articleId": "ART7789012789",
  "articleTitle": "书法作品",
  "trackType": 7,
  "platformType": 1,
  "downloadUrl": "cloud://xxx/article/7/书法作品-1703123456789.txt",
  "status": 1
}
```

## 索引设计

### 建议索引

1. **articleId 索引**

   - 字段: `articleId`
   - 类型: 唯一索引
   - 用途: 快速查找特定文章

2. **trackType 索引**

   - 字段: `trackType`
   - 类型: 普通索引
   - 用途: 按赛道类型查询

3. **platformType 索引**

   - 字段: `platformType`
   - 类型: 普通索引
   - 用途: 按平台类型查询

4. **uploadTime 索引**

   - 字段: `uploadTime`
   - 类型: 普通索引
   - 用途: 按时间范围查询

5. **复合索引**
   - 字段: `trackType`, `platformType`
   - 类型: 复合索引
   - 用途: 按赛道和平台组合查询

## 查询示例

### 基础查询

```javascript
// 查询所有文章
const allArticles = await db.collection("article-mgr").get();

// 按文章ID查询
const article = await db
  .collection("article-mgr")
  .where({ articleId: "ART1123456" })
  .get();

// 按赛道类型查询
const foodArticles = await db
  .collection("article-mgr")
  .where({ trackType: 1 })
  .get();

// 按平台类型查询
const xiaohongshuArticles = await db
  .collection("article-mgr")
  .where({ platformType: 2 })
  .get();
```

### 高级查询

```javascript
// 按时间范围查询
const recentArticles = await db
  .collection("article-mgr")
  .where({
    uploadTime: db.command.gte(new Date("2023-12-01")),
  })
  .orderBy("uploadTime", "desc")
  .get();

// 按赛道和平台组合查询
const foodXiaohongshuArticles = await db
  .collection("article-mgr")
  .where({
    trackType: 1,
    platformType: 2,
  })
  .get();

// 统计查询
const stats = await db
  .collection("article-mgr")
  .aggregate()
  .group({
    _id: "$trackType",
    count: db.command.aggregate.sum(1),
  })
  .end();
```

## 数据验证规则

### 字段验证

1. **articleId**

   - 格式: `/^ART\d{10}$/`
   - 长度: 13 个字符
   - 唯一性: 必须唯一

2. **articleTitle**

   - 长度: 1-255 个字符
   - 不能为空
   - 不包含文件扩展名

3. **trackType**

   - 范围: 1-12
   - 必须是有效的枚举值

4. **platformType**

   - 范围: 1-8
   - 必须是有效的枚举值

5. **downloadUrl**
   - 格式: 云存储路径
   - 必须以 `cloud://` 开头
   - 不能为空

### 业务规则

1. **文件格式**: 只支持 `.txt` 文件
2. **文件大小**: 建议不超过 10MB
3. **命名规范**: 文件名应具有描述性，文章标题不包含扩展名
4. **时间一致性**: 上传时间应与创建时间一致
5. **字段简化**: 移除冗余的更新时间字段

## 数据维护

### 备份策略

1. **定期备份**: 建议每日备份
2. **增量备份**: 支持增量数据备份
3. **异地备份**: 考虑异地备份策略

### 清理策略

1. **过期数据**: 可考虑清理过期的测试数据
2. **重复数据**: 定期检查并清理重复记录
3. **无效链接**: 清理指向不存在文件的记录

## 扩展性考虑

### 未来字段

预留以下字段用于未来扩展：

1. **status**: 文章状态（草稿、发布、下架等）
2. **tags**: 文章标签
3. **description**: 文章描述
4. **author**: 作者信息
5. **category**: 文章分类
6. **viewCount**: 浏览次数
7. **downloadCount**: 下载次数

### 版本控制

1. **schema_version**: 数据结构版本
2. **migration_history**: 迁移历史记录

## 安全考虑

1. **访问控制**: 限制数据库访问权限
2. **数据加密**: 敏感数据加密存储
3. **审计日志**: 记录数据操作日志
4. **备份安全**: 确保备份数据安全

## 性能优化

1. **索引优化**: 根据查询模式优化索引
2. **分页查询**: 大数据量时使用分页
3. **缓存策略**: 考虑使用缓存提高查询性能
4. **数据分片**: 大数据量时考虑数据分片
