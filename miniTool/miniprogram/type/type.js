/**
 * 类型枚举定义
 */

const TrackTypeEnum = {
  // 美食相关赛道
  FOOD_TRACK: 1,
  FOOD_GIF: 2,
  FOOD_GREEN: 3,

  // 娱乐相关赛道
  ENTERTAINMENT: 4,

  // 旅游相关赛道
  TRAVEL_TRACK: 5,
  TRAVEL_ARTICLE: 6,

  // 艺术相关赛道
  CALLIGRAPHY: 7,
  PHOTOGRAPHY: 8,
  ANTIQUE: 9,

  // 生活相关赛道
  PET: 10,

  // 科技相关赛道
  TECH_DIGITAL: 11, // 科技数码

  // 时尚相关赛道
  FASHION_BEAUTY: 12, // 时尚美妆
};

const PlatformEnum = {
  // 主流平台
  WECHAT_MP: 1, // 微信公众号
  XIAOHONGSHU: 2, // 小红书
  DOUYIN: 3, // 抖音
  KUAISHOU: 4, // 快手
  BILIBILI: 5, // B站
  WEIBO: 6, // 微博
  ZHIHU: 7, // 知乎
  TIKTOK: 8, // TikTok
};

const SettlementStatusEnum = {
  // 结算状态
  UNSETTLED: 0, // 未结算
  PENDING: 1, // 待结算
  SETTLED: 2, // 已结算
};

const TaskStatusEnum = {
  // 任务状态
  PENDING: 1, // 待发表
  COMPLETED: 2, // 已完成
  REJECTED: 3, // 已拒绝
};

module.exports = {
  TrackTypeEnum,
  PlatformEnum,
  SettlementStatusEnum,
  TaskStatusEnum,
};
