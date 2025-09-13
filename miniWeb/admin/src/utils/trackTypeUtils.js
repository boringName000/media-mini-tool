/**
 * 赛道类型工具函数 - 管理端版本
 * 基于小程序端的赛道类型工具函数，适配管理端使用
 */

// 赛道类型枚举
const TrackTypeEnum = {
  FOOD_TRACK: 1,        // 美食相关赛道
  ENTERTAINMENT: 2,     // 娱乐相关赛道
  TRAVEL_TRACK: 3,      // 旅游相关赛道
  CAR_TRACK: 4,         // 汽车相关赛道
  Art: 5,               // 艺术相关赛道
  PHOTOGRAPHY: 6,       // 摄影相关赛道
  PET: 7,               // 宠物相关赛道
  TECH_DIGITAL: 8,      // 科技数码
  FASHION_BEAUTY: 9,    // 时尚美妆
}

/**
 * 根据枚举值获取赛道类型显示名称
 * @param {number|string} trackTypeEnum 赛道类型枚举值
 * @returns {string} 赛道类型显示名称
 */
export function getTrackTypeName(trackTypeEnum) {
  try {
    // 安全处理：确保输入为数字
    const numValue = Number(trackTypeEnum)
    if (isNaN(numValue)) {
      console.warn('getTrackTypeName: 无效的赛道类型枚举值:', trackTypeEnum)
      return "未知赛道"
    }

    const trackTypeMap = {
      [TrackTypeEnum.FOOD_TRACK]: "美食赛道",
      [TrackTypeEnum.ENTERTAINMENT]: "娱乐赛道",
      [TrackTypeEnum.TRAVEL_TRACK]: "旅游赛道",
      [TrackTypeEnum.CAR_TRACK]: "汽车赛道",
      [TrackTypeEnum.Art]: "艺术赛道",
      [TrackTypeEnum.PHOTOGRAPHY]: "摄影赛道",
      [TrackTypeEnum.PET]: "宠物赛道",
      [TrackTypeEnum.TECH_DIGITAL]: "科技数码",
      [TrackTypeEnum.FASHION_BEAUTY]: "时尚美妆",
    }

    return trackTypeMap[numValue] || "未知赛道"
  } catch (error) {
    console.error('getTrackTypeName: 获取赛道类型名称失败:', error, '输入值:', trackTypeEnum)
    return "未知赛道"
  }
}

/**
 * 根据枚举值获取赛道类型图标
 * @param {number|string} trackTypeEnum 赛道类型枚举值
 * @returns {string} 赛道类型图标
 */
export function getTrackTypeIcon(trackTypeEnum) {
  try {
    // 安全处理：确保输入为数字
    const numValue = Number(trackTypeEnum)
    if (isNaN(numValue)) {
      console.warn('getTrackTypeIcon: 无效的赛道类型枚举值:', trackTypeEnum)
      return "🏃"
    }

    const trackIconMap = {
      [TrackTypeEnum.FOOD_TRACK]: "🍜",
      [TrackTypeEnum.ENTERTAINMENT]: "🎬",
      [TrackTypeEnum.TRAVEL_TRACK]: "🗺️",
      [TrackTypeEnum.CAR_TRACK]: "🚗",
      [TrackTypeEnum.Art]: "🎨",
      [TrackTypeEnum.PHOTOGRAPHY]: "📷",
      [TrackTypeEnum.PET]: "🐱",
      [TrackTypeEnum.TECH_DIGITAL]: "📱",
      [TrackTypeEnum.FASHION_BEAUTY]: "💄",
    }

    return trackIconMap[numValue] || "🏃"
  } catch (error) {
    console.error('getTrackTypeIcon: 获取赛道类型图标失败:', error, '输入值:', trackTypeEnum)
    return "🏃"
  }
}

/**
 * 根据显示名称获取赛道类型枚举值
 * @param {string} trackTypeName 赛道类型显示名称
 * @returns {number} 赛道类型枚举值
 */
export function getTrackTypeEnum(trackTypeName) {
  const reverseMap = {
    美食赛道: TrackTypeEnum.FOOD_TRACK,
    娱乐赛道: TrackTypeEnum.ENTERTAINMENT,
    旅游赛道: TrackTypeEnum.TRAVEL_TRACK,
    汽车赛道: TrackTypeEnum.CAR_TRACK,
    艺术赛道: TrackTypeEnum.Art,
    摄影赛道: TrackTypeEnum.PHOTOGRAPHY,
    宠物赛道: TrackTypeEnum.PET,
    科技数码: TrackTypeEnum.TECH_DIGITAL,
    时尚美妆: TrackTypeEnum.FASHION_BEAUTY,
  }

  return reverseMap[trackTypeName] || TrackTypeEnum.FOOD_TRACK
}

/**
 * 获取所有赛道类型的映射关系
 * @returns {Object} 枚举值到显示名称的映射
 */
export function getAllTrackTypes() {
  return {
    [TrackTypeEnum.FOOD_TRACK]: "美食赛道",
    [TrackTypeEnum.ENTERTAINMENT]: "娱乐赛道",
    [TrackTypeEnum.TRAVEL_TRACK]: "旅游赛道",
    [TrackTypeEnum.CAR_TRACK]: "汽车赛道",
    [TrackTypeEnum.Art]: "艺术赛道",
    [TrackTypeEnum.PHOTOGRAPHY]: "摄影赛道",
    [TrackTypeEnum.PET]: "宠物赛道",
    [TrackTypeEnum.TECH_DIGITAL]: "科技数码",
    [TrackTypeEnum.FASHION_BEAUTY]: "时尚美妆",
  }
}

/**
 * 获取赛道类型选择器列表
 * 用于下拉选择组件的数据源
 * @returns {Array} 赛道类型选择器列表
 */
export function getTrackTypeList() {
  return [
    {
      value: TrackTypeEnum.FOOD_TRACK,
      label: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
      icon: getTrackTypeIcon(TrackTypeEnum.FOOD_TRACK),
    },
    {
      value: TrackTypeEnum.ENTERTAINMENT,
      label: getTrackTypeName(TrackTypeEnum.ENTERTAINMENT),
      icon: getTrackTypeIcon(TrackTypeEnum.ENTERTAINMENT),
    },
    {
      value: TrackTypeEnum.TRAVEL_TRACK,
      label: getTrackTypeName(TrackTypeEnum.TRAVEL_TRACK),
      icon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_TRACK),
    },
    {
      value: TrackTypeEnum.CAR_TRACK,
      label: getTrackTypeName(TrackTypeEnum.CAR_TRACK),
      icon: getTrackTypeIcon(TrackTypeEnum.CAR_TRACK),
    },
    {
      value: TrackTypeEnum.Art,
      label: getTrackTypeName(TrackTypeEnum.Art),
      icon: getTrackTypeIcon(TrackTypeEnum.Art),
    },
    {
      value: TrackTypeEnum.PHOTOGRAPHY,
      label: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
      icon: getTrackTypeIcon(TrackTypeEnum.PHOTOGRAPHY),
    },
    {
      value: TrackTypeEnum.PET,
      label: getTrackTypeName(TrackTypeEnum.PET),
      icon: getTrackTypeIcon(TrackTypeEnum.PET),
    },
    {
      value: TrackTypeEnum.TECH_DIGITAL,
      label: getTrackTypeName(TrackTypeEnum.TECH_DIGITAL),
      icon: getTrackTypeIcon(TrackTypeEnum.TECH_DIGITAL),
    },
    {
      value: TrackTypeEnum.FASHION_BEAUTY,
      label: getTrackTypeName(TrackTypeEnum.FASHION_BEAUTY),
      icon: getTrackTypeIcon(TrackTypeEnum.FASHION_BEAUTY),
    },
  ]
}

/**
 * 获取赛道类型选择器选项（包含全部选项）
 * @returns {Array} 包含"全部"选项的赛道类型列表
 */
export function getTrackTypeOptions() {
  return [
    { value: '', label: '全部赛道' },
    ...getTrackTypeList()
  ]
}

export { TrackTypeEnum }