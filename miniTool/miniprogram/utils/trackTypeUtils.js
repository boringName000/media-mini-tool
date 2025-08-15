/**
 * 赛道类型工具函数
 * 用于枚举值、显示名称和图标的转换
 */

const { TrackTypeEnum } = require("../type/type");

/**
 * 根据枚举值获取赛道类型显示名称
 * @param {number} trackTypeEnum 赛道类型枚举值
 * @returns {string} 赛道类型显示名称
 */
function getTrackTypeName(trackTypeEnum) {
  const trackTypeMap = {
    [TrackTypeEnum.FOOD_TRACK]: "美食赛道",
    [TrackTypeEnum.FOOD_GIF]: "美食GIF",
    [TrackTypeEnum.FOOD_GREEN]: "美食小绿书",
    [TrackTypeEnum.ENTERTAINMENT]: "娱乐赛道",
    [TrackTypeEnum.TRAVEL_TRACK]: "旅游赛道",
    [TrackTypeEnum.TRAVEL_ARTICLE]: "旅游文章",
    [TrackTypeEnum.CALLIGRAPHY]: "书法（小绿书）",
    [TrackTypeEnum.PHOTOGRAPHY]: "摄影小绿书",
    [TrackTypeEnum.ANTIQUE]: "古董小绿书",
    [TrackTypeEnum.PET]: "宠物赛道",
    [TrackTypeEnum.TECH_DIGITAL]: "科技数码",
    [TrackTypeEnum.FASHION_BEAUTY]: "时尚美妆",
  };

  return trackTypeMap[trackTypeEnum] || "未知赛道";
}

/**
 * 根据枚举值获取赛道类型图标
 * @param {number} trackTypeEnum 赛道类型枚举值
 * @returns {string} 赛道类型图标
 */
function getTrackTypeIcon(trackTypeEnum) {
  const trackIconMap = {
    [TrackTypeEnum.FOOD_TRACK]: "🍜",
    [TrackTypeEnum.FOOD_GIF]: "🎞️",
    [TrackTypeEnum.FOOD_GREEN]: "🥘",
    [TrackTypeEnum.ENTERTAINMENT]: "🎬",
    [TrackTypeEnum.TRAVEL_TRACK]: "🗺️",
    [TrackTypeEnum.TRAVEL_ARTICLE]: "📝",
    [TrackTypeEnum.CALLIGRAPHY]: "🖌️",
    [TrackTypeEnum.PHOTOGRAPHY]: "📷",
    [TrackTypeEnum.ANTIQUE]: "🏺",
    [TrackTypeEnum.PET]: "🐱",
    [TrackTypeEnum.TECH_DIGITAL]: "📱",
    [TrackTypeEnum.FASHION_BEAUTY]: "💄",
  };

  return trackIconMap[trackTypeEnum] || "📋";
}

/**
 * 根据显示名称获取赛道类型枚举值
 * @param {string} trackTypeName 赛道类型显示名称
 * @returns {number} 赛道类型枚举值
 */
function getTrackTypeEnum(trackTypeName) {
  const reverseMap = {
    美食赛道: TrackTypeEnum.FOOD_TRACK,
    美食GIF: TrackTypeEnum.FOOD_GIF,
    美食小绿书: TrackTypeEnum.FOOD_GREEN,
    娱乐赛道: TrackTypeEnum.ENTERTAINMENT,
    旅游赛道: TrackTypeEnum.TRAVEL_TRACK,
    旅游文章: TrackTypeEnum.TRAVEL_ARTICLE,
    "书法（小绿书）": TrackTypeEnum.CALLIGRAPHY,
    摄影小绿书: TrackTypeEnum.PHOTOGRAPHY,
    古董小绿书: TrackTypeEnum.ANTIQUE,
    宠物赛道: TrackTypeEnum.PET,
    科技数码: TrackTypeEnum.TECH_DIGITAL,
    时尚美妆: TrackTypeEnum.FASHION_BEAUTY,
  };

  return reverseMap[trackTypeName] || TrackTypeEnum.FOOD_TRACK;
}

/**
 * 获取所有赛道类型的映射关系
 * @returns {Object} 枚举值到显示名称的映射
 */
function getAllTrackTypes() {
  return {
    [TrackTypeEnum.FOOD_TRACK]: "美食赛道",
    [TrackTypeEnum.FOOD_GIF]: "美食GIF",
    [TrackTypeEnum.FOOD_GREEN]: "美食小绿书",
    [TrackTypeEnum.ENTERTAINMENT]: "娱乐赛道",
    [TrackTypeEnum.TRAVEL_TRACK]: "旅游赛道",
    [TrackTypeEnum.TRAVEL_ARTICLE]: "旅游文章",
    [TrackTypeEnum.CALLIGRAPHY]: "书法（小绿书）",
    [TrackTypeEnum.PHOTOGRAPHY]: "摄影小绿书",
    [TrackTypeEnum.ANTIQUE]: "古董小绿书",
    [TrackTypeEnum.PET]: "宠物赛道",
    [TrackTypeEnum.TECH_DIGITAL]: "科技数码",
    [TrackTypeEnum.FASHION_BEAUTY]: "时尚美妆",
  };
}

/**
 * 获取赛道类型选择器列表
 * 用于picker组件的range数据源
 * @returns {Array} 赛道类型选择器列表
 */
function getTrackTypeList() {
  return [
    {
      type: TrackTypeEnum.FOOD_TRACK,
      name: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
      icon: getTrackTypeIcon(TrackTypeEnum.FOOD_TRACK),
    },
    {
      type: TrackTypeEnum.ENTERTAINMENT,
      name: getTrackTypeName(TrackTypeEnum.ENTERTAINMENT),
      icon: getTrackTypeIcon(TrackTypeEnum.ENTERTAINMENT),
    },
    {
      type: TrackTypeEnum.TRAVEL_TRACK,
      name: getTrackTypeName(TrackTypeEnum.TRAVEL_TRACK),
      icon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_TRACK),
    },
    {
      type: TrackTypeEnum.TRAVEL_ARTICLE,
      name: getTrackTypeName(TrackTypeEnum.TRAVEL_ARTICLE),
      icon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_ARTICLE),
    },
    {
      type: TrackTypeEnum.CALLIGRAPHY,
      name: getTrackTypeName(TrackTypeEnum.CALLIGRAPHY),
      icon: getTrackTypeIcon(TrackTypeEnum.CALLIGRAPHY),
    },
    {
      type: TrackTypeEnum.FOOD_GIF,
      name: getTrackTypeName(TrackTypeEnum.FOOD_GIF),
      icon: getTrackTypeIcon(TrackTypeEnum.FOOD_GIF),
    },
    {
      type: TrackTypeEnum.FOOD_GREEN,
      name: getTrackTypeName(TrackTypeEnum.FOOD_GREEN),
      icon: getTrackTypeIcon(TrackTypeEnum.FOOD_GREEN),
    },
    {
      type: TrackTypeEnum.PHOTOGRAPHY,
      name: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
      icon: getTrackTypeIcon(TrackTypeEnum.PHOTOGRAPHY),
    },
    {
      type: TrackTypeEnum.ANTIQUE,
      name: getTrackTypeName(TrackTypeEnum.ANTIQUE),
      icon: getTrackTypeIcon(TrackTypeEnum.ANTIQUE),
    },
    {
      type: TrackTypeEnum.PET,
      name: getTrackTypeName(TrackTypeEnum.PET),
      icon: getTrackTypeIcon(TrackTypeEnum.PET),
    },
    {
      type: TrackTypeEnum.TECH_DIGITAL,
      name: getTrackTypeName(TrackTypeEnum.TECH_DIGITAL),
      icon: getTrackTypeIcon(TrackTypeEnum.TECH_DIGITAL),
    },
    {
      type: TrackTypeEnum.FASHION_BEAUTY,
      name: getTrackTypeName(TrackTypeEnum.FASHION_BEAUTY),
      icon: getTrackTypeIcon(TrackTypeEnum.FASHION_BEAUTY),
    },
  ];
}

module.exports = {
  getTrackTypeName,
  getTrackTypeIcon,
  getTrackTypeEnum,
  getAllTrackTypes,
  getTrackTypeList,
  TrackTypeEnum,
};
