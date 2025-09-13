/**
 * 平台工具函数 - 管理端版本
 * 基于小程序端的平台工具函数，适配管理端使用
 */

// 平台枚举
const PlatformEnum = {
  WECHAT_MP: 1, // 微信公众号
}

/**
 * 根据枚举值获取平台显示名称
 * @param {number|string} platformEnum 平台枚举值
 * @returns {string} 平台显示名称
 */
export function getPlatformName(platformEnum) {
  try {
    // 安全处理：确保输入为数字
    const numValue = Number(platformEnum)
    if (isNaN(numValue)) {
      console.warn('getPlatformName: 无效的平台枚举值:', platformEnum)
      return "未知平台"
    }

    const platformMap = {
      [PlatformEnum.WECHAT_MP]: "公众号",
    }

    return platformMap[numValue] || "未知平台"
  } catch (error) {
    console.error('getPlatformName: 获取平台名称失败:', error, '输入值:', platformEnum)
    return "未知平台"
  }
}

/**
 * 根据枚举值获取平台图标
 * @param {number|string} platformEnum 平台枚举值
 * @returns {string} 平台图标
 */
export function getPlatformIcon(platformEnum) {
  try {
    // 安全处理：确保输入为数字
    const numValue = Number(platformEnum)
    if (isNaN(numValue)) {
      console.warn('getPlatformIcon: 无效的平台枚举值:', platformEnum)
      return "📋"
    }

    const platformIconMap = {
      [PlatformEnum.WECHAT_MP]: "📰",
    }

    return platformIconMap[numValue] || "📋"
  } catch (error) {
    console.error('getPlatformIcon: 获取平台图标失败:', error, '输入值:', platformEnum)
    return "📋"
  }
}

/**
 * 根据显示名称获取平台枚举值
 * @param {string} platformName 平台显示名称
 * @returns {number} 平台枚举值
 */
export function getPlatformEnum(platformName) {
  const reverseMap = {
    公众号: PlatformEnum.WECHAT_MP,
    微信公众号: PlatformEnum.WECHAT_MP,
  }

  return reverseMap[platformName] || PlatformEnum.WECHAT_MP
}

/**
 * 获取所有平台的映射关系
 * @returns {Object} 枚举值到显示名称的映射
 */
export function getAllPlatforms() {
  return {
    [PlatformEnum.WECHAT_MP]: "公众号",
  }
}

/**
 * 获取平台选择器列表
 * 用于下拉选择组件的数据源
 * @returns {Array} 平台选择器列表
 */
export function getPlatformList() {
  return [
    {
      value: PlatformEnum.WECHAT_MP,
      label: getPlatformName(PlatformEnum.WECHAT_MP),
      icon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    },
  ]
}

/**
 * 获取平台选择器选项（包含全部选项）
 * @returns {Array} 包含"全部"选项的平台列表
 */
export function getPlatformOptions() {
  return [
    { value: '', label: '全部平台' },
    ...getPlatformList()
  ]
}

export { PlatformEnum }