# 获取文章信息云函数

## 📋 概述

`get-article-info` 云函数用于根据文章 ID 数组或赛道类型和平台类型，从 `article-mgr` 数据库集合中批量获取文章详细信息。

## 🎯 功能特性

### **1. 多种查询方式**

- ✅ **文章 ID 查询**: 支持一次查询多个文章 ID
- ✅ **类型查询**: 支持根据赛道类型和平台类型查询
- ✅ **高效查询**: 使用 `db.command.in()` 进行批量查询
- ✅ **结果统计**: 返回查询统计信息

### **2. 参数验证**

- ✅ **格式检查**: 验证 `articleIds` 是否为数组
- ✅ **数量限制**: 限制单次查询最多 100 个文章 ID
- ✅ **类型验证**: 验证赛道类型和平台类型参数
- ✅ **参数组合**: 确保提供正确的参数组合

### **3. 错误处理**

- ✅ **未找到文章**: 返回未找到的文章 ID 列表
- ✅ **异常捕获**: 完善的错误处理和日志记录
- ✅ **友好提示**: 提供详细的错误信息

## 🔧 技术实现

### **1. 云函数结构**

```
get-article-info/
├── index.js          # 主函数文件
├── package.json      # 依赖配置
├── config.json       # 云函数配置
├── README.md         # 详细文档
└── test.js           # 测试文件
```

### **2. 核心逻辑**

```javascript
// 参数验证和查询逻辑
let queryCondition = {};
let queryType = "";

if (articleIds && Array.isArray(articleIds) && articleIds.length > 0) {
  // 优先使用文章ID数组查询
  queryCondition = {
    articleId: db.command.in(articleIds),
  };
  queryType = "articleIds";
} else if (trackType !== undefined && platformType !== undefined) {
  // 使用赛道类型和平台类型查询
  queryCondition = {
    trackType: trackType,
    platformType: platformType,
  };
  queryType = "typeFilter";
} else {
  // 返回参数错误
}

// 数据库查询
const articleResult = await db
  .collection("article-mgr")
  .where(queryCondition)
  .get();

// 结果处理
const articles = articleResult.data || [];
```

## 📊 数据流程

### **1. 请求流程**

```
前端调用 → 参数验证 → 数据库查询 → 结果处理 → 返回数据
```

### **2. 返回数据结构**

```javascript
{
  success: true,
  data: {
    articles: [
      {
        articleId: "ART1123456123",
        title: "文章标题",
        downloadUrl: "https://example.com/article.txt",
        trackType: 1,
        platform: 1,
        createTime: "2024-01-15T10:30:00.000Z"
      }
    ],
    totalCount: 1,
    requestedCount: 3,
    notFoundIds: ["ART1123456124", "ART1123456125"]
  },
  message: "成功获取 1 篇文章信息"
}
```

## 🚀 使用示例

### **1. 前端调用**

#### **文章 ID 查询**

```javascript
// 调用云函数
wx.cloud
  .callFunction({
    name: "get-article-info",
    data: {
      articleIds: ["ART1123456123", "ART1123456124", "ART1123456125"],
    },
  })
  .then((res) => {
    if (res.result.success) {
      const articles = res.result.data.articles;
      const notFoundIds = res.result.data.notFoundIds;

      console.log("获取到的文章:", articles);
      console.log("未找到的文章ID:", notFoundIds);
    } else {
      console.error("获取文章失败:", res.result.message);
    }
  })
  .catch((err) => {
    console.error("云函数调用失败:", err);
  });
```

#### **类型查询**

```javascript
// 调用云函数
wx.cloud
  .callFunction({
    name: "get-article-info",
    data: {
      trackType: 1, // 美食赛道
      platformType: 2, // 小红书平台
    },
  })
  .then((res) => {
    if (res.result.success) {
      const articles = res.result.data.articles;
      console.log("获取到的文章:", articles);
    } else {
      console.error("获取文章失败:", res.result.message);
    }
  })
  .catch((err) => {
    console.error("云函数调用失败:", err);
  });
```

### **2. 在任务列表页面使用**

```javascript
// 获取任务对应的文章信息
async getArticleInfo(articleIds) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'get-article-info',
      data: { articleIds }
    });

    if (result.result.success) {
      return result.result.data.articles;
    } else {
      console.error('获取文章信息失败:', result.result.message);
      return [];
    }
  } catch (error) {
    console.error('调用云函数失败:', error);
    return [];
  }
}

// 根据类型获取文章信息
async getArticlesByType(trackType, platformType) {
  try {
    const result = await wx.cloud.callFunction({
      name: 'get-article-info',
      data: { trackType, platformType }
    });

    if (result.result.success) {
      return result.result.data.articles;
    } else {
      console.error('获取文章信息失败:', result.result.message);
      return [];
    }
  } catch (error) {
    console.error('调用云函数失败:', error);
    return [];
  }
}
```

## 📝 部署指南

### **1. 自动部署**

```bash
# 使用部署脚本
cd miniTool/scripts/clouddeploy
./deploy-get-article-info.sh
```

### **2. 手动部署**

```bash
# 进入云函数目录
cd miniTool/cloudfunctions/get-article-info

# 安装依赖
npm install

# 部署云函数
wx cloud functions deploy get-article-info --force
```

### **3. 部署检查**

```bash
# 检查语法
node -c index.js

# 检查依赖
npm list

# 运行测试
node test.js
```

## 🔍 错误处理

### **1. 常见错误**

| 错误类型         | 原因                  | 解决方案                   |
| ---------------- | --------------------- | -------------------------- |
| `缺少必要参数`   | 未提供 `articleIds`   | 确保传入 `articleIds` 参数 |
| `参数格式错误`   | `articleIds` 不是数组 | 确保传入数组格式           |
| `参数为空`       | `articleIds` 数组为空 | 检查数组内容               |
| `查询数量超限`   | 超过 100 个文章 ID    | 分批查询或减少数量         |
| `服务器内部错误` | 数据库查询异常        | 检查数据库连接和权限       |

### **2. 调试建议**

- 检查传入的文章 ID 格式是否正确
- 确认 `article-mgr` 集合中存在对应的文章
- 查看云函数日志获取详细错误信息
- 使用测试数据验证云函数功能

## 📈 性能优化

### **1. 查询优化**

- **批量查询**: 使用 `db.command.in()` 减少数据库请求次数
- **数量限制**: 限制单次查询数量，避免超时
- **结果缓存**: 建议在前端对查询结果进行缓存

### **2. 内存优化**

- **分页处理**: 对于大量数据，考虑分页查询
- **字段选择**: 只查询必要的字段，减少数据传输
- **结果过滤**: 在查询时进行过滤，减少返回数据量

## 🔗 相关文档

- [微信云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)
- [数据库操作指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)
- [云函数开发指南](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)

---

**创建时间**: 2024-01-15  
**版本**: 1.0.0  
**状态**: ✅ 已完成并测试
