// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    const { articleIds, trackType, platformType } = event;

    console.log("接收到的参数:", { articleIds, trackType, platformType });

    // 参数验证和查询逻辑
    let queryCondition = {};
    let queryType = "";

    if (articleIds && Array.isArray(articleIds) && articleIds.length > 0) {
      // 优先使用文章ID数组查询
      if (articleIds.length > 100) {
        return {
          success: false,
          error: "查询数量超限",
          message: "单次查询最多支持100个文章ID",
        };
      }

      queryCondition = {
        articleId: db.command.in(articleIds),
      };
      queryType = "articleIds";

      console.log("使用文章ID数组查询，文章ID数组:", articleIds);
    } else if (trackType !== undefined && platformType !== undefined) {
      // 使用赛道类型和平台类型查询
      queryCondition = {
        trackType: trackType,
        platformType: platformType,
      };
      queryType = "typeFilter";

      console.log(
        "使用类型查询，赛道类型:",
        trackType,
        "平台类型:",
        platformType
      );
    } else {
      return {
        success: false,
        error: "参数错误",
        message: "请提供文章ID数组，或者同时提供赛道类型和平台类型",
      };
    }

    // 查询文章信息
    const articleResult = await db
      .collection("article-mgr")
      .where(queryCondition)
      .get();

    const articles = articleResult.data || [];
    console.log(`查询到 ${articles.length} 篇文章`);

    // 处理查询结果
    let resultData = {
      articles: articles,
      totalCount: articles.length,
    };

    if (queryType === "articleIds") {
      // 检查是否有未找到的文章
      const foundArticleIds = articles.map((article) => article.articleId);
      const notFoundIds = articleIds.filter(
        (id) => !foundArticleIds.includes(id)
      );

      if (notFoundIds.length > 0) {
        console.log("未找到的文章ID:", notFoundIds);
      }

      resultData.requestedCount = articleIds.length;
      resultData.notFoundIds = notFoundIds;
    } else if (queryType === "typeFilter") {
      resultData.trackType = trackType;
      resultData.platformType = platformType;
    }

    return {
      success: true,
      data: resultData,
      message: `成功获取 ${articles.length} 篇文章信息`,
    };
  } catch (error) {
    console.error("获取文章信息失败:", error);

    return {
      success: false,
      error: error.message || "获取文章信息失败",
      message: "服务器内部错误",
    };
  }
};
