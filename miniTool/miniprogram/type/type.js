/**
 * 类型枚举定义
 */

const TrackTypeEnum = {
  // 美食相关赛道
  FOOD_TRACK: 1,

  // 娱乐相关赛道
  ENTERTAINMENT: 2,

  // 旅游相关赛道
  TRAVEL_TRACK: 3,
  // 汽车相关赛道
  CAR_TRACK: 4,

  // 艺术相关赛道
  Art: 5,

  // 摄影相关赛道
  PHOTOGRAPHY: 6,

  // 生活相关赛道
  PET: 7,

  // 科技相关赛道
  TECH_DIGITAL: 8, // 科技数码

  // 时尚相关赛道
  FASHION_BEAUTY: 9, // 时尚美妆
};

const PlatformEnum = {
  // 主流平台
  WECHAT_MP: 1, // 微信公众号
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
