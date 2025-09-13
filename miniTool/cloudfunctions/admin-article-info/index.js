// 云函数入口文件
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();

  try {
    console.log('开始获取文章统计信息');

    // 使用聚合查询优化性能
    const collection = db.collection("article-mgr");

    // 1. 获取各平台各赛道的统计数据（优化：同时用于计算基础统计）
    const $ = db.command.aggregate;
    
    const platformTrackStatsResult = await collection.aggregate()
      .group({
        _id: {
          platformType: '$platformType',
          trackType: '$trackType'
        },
        unusedCount: $.sum(
          $.cond({
            if: $.eq(['$status', 1]),
            then: 1,
            else: 0
          })
        ),
        usedCount: $.sum(
          $.cond({
            if: $.eq(['$status', 2]),
            then: 1,
            else: 0
          })
        ),
        needRevisionCount: $.sum(
          $.cond({
            if: $.eq(['$status', 3]),
            then: 1,
            else: 0
          })
        )
      })
      .end();

    // 2. 通过本地计算得到基础统计数据（优化：减少一次数据库查询）
    let totalCount = 0;
    let unusedCount = 0;
    let usedCount = 0;
    let needRevisionCount = 0;

    platformTrackStatsResult.list.forEach(item => {
      unusedCount += item.unusedCount || 0;
      usedCount += item.usedCount || 0;
      needRevisionCount += item.needRevisionCount || 0;
    });

    totalCount = unusedCount + usedCount + needRevisionCount;

    const basicStats = {
      totalCount,
      unusedCount,
      usedCount,
      needRevisionCount
    };

    // 3. 获取待修改文章的详细信息（只查询需要的字段，提高性能）
    const needRevisionArticlesResult = await collection
      .where({
        status: 3 // 待重新修改
      })
      .field({
        articleId: true,
        articleTitle: true,
        uploadTime: true,
        trackType: true,
        platformType: true,
        downloadUrl: true,
        status: true
      })
      .orderBy('uploadTime', 'desc')
      .get();

    // 处理平台赛道统计数据
    const platformTrackStats = {};
    platformTrackStatsResult.list.forEach(item => {
      const { platformType, trackType } = item._id;
      
      if (!platformTrackStats[platformType]) {
        platformTrackStats[platformType] = {};
      }
      
      platformTrackStats[platformType][trackType] = {
        unusedCount: item.unusedCount || 0,
        usedCount: item.usedCount || 0,
        needRevisionCount: item.needRevisionCount || 0
      };
    });

    // 格式化待修改文章数据
    const needRevisionArticles = needRevisionArticlesResult.data;

    const result = {
      // 基础统计
      totalCount: basicStats.totalCount,
      unusedCount: basicStats.unusedCount,
      usedCount: basicStats.usedCount,
      needRevisionCount: basicStats.needRevisionCount,
      
      // 各平台各赛道统计
      platformTrackStats: platformTrackStats,
      
      // 待修改文章详细信息
      needRevisionArticles: needRevisionArticles,
      
      // 查询时间
      queryTime: new Date().toISOString()
    };

    console.log('文章统计信息获取成功:', {
      totalCount: result.totalCount,
      unusedCount: result.unusedCount,
      usedCount: result.usedCount,
      needRevisionCount: result.needRevisionCount,
      platformCount: Object.keys(platformTrackStats).length,
      needRevisionArticlesCount: needRevisionArticles.length
    });

    return {
      success: true,
      data: result,
      message: "文章统计信息获取成功"
    };

  } catch (error) {
    console.error("获取文章统计信息失败:", error);

    return {
      success: false,
      error: error.message || "获取文章统计信息失败",
      message: "服务器内部错误"
    };
  }
};