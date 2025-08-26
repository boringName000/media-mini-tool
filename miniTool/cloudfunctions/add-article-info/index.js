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
    const {
      articleTitle, // 文章标题（文件名）
      trackType, // 赛道类型（数字）
      platformType, // 平台类型（数字）
      downloadUrl, // 下载地址
    } = event;

    // 参数验证
    if (!articleTitle || !trackType || !platformType || !downloadUrl) {
      return {
        success: false,
        error: "缺少必要参数",
        message: "请提供文章标题、赛道类型、平台类型和下载地址",
      };
    }

    // 生成文章ID：ART + 赛道类型 + 时间戳后6位 + 随机数后3位
    const timestamp = Date.now();
    const timestampSuffix = timestamp.toString().slice(-6);
    const randomSuffix = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    const articleId = `ART${trackType}${timestampSuffix}${randomSuffix}`;

    // 创建文章数据
    const articleData = {
      articleId: articleId,
      articleTitle: articleTitle,
      uploadTime: db.serverDate(),
      trackType: trackType,
      platformType: platformType,
      downloadUrl: downloadUrl,
      createTime: db.serverDate(),
    };

    // 插入到 article-mgr 数据库
    const result = await db.collection("article-mgr").add({
      data: articleData,
    });

    console.log("文章信息添加成功:", {
      articleId: articleId,
      _id: result._id,
    });

    return {
      success: true,
      data: {
        articleId: articleId,
        _id: result._id,
        articleData: articleData,
      },
      message: "文章信息添加成功",
    };
  } catch (error) {
    console.error("添加文章信息失败:", error);

    return {
      success: false,
      error: error.message || "添加文章信息失败",
      message: "服务器内部错误",
    };
  }
};
