/**
 * 平台工具函数
 * 用于枚举值、显示名称和图标的转换
 */

const { PlatformEnum } = require("../type/type");

/**
 * 根据枚举值获取平台显示名称
 * @param {number} platformEnum 平台枚举值
 * @returns {string} 平台显示名称
 */
function getPlatformName(platformEnum) {
  const platformMap = {
    [PlatformEnum.WECHAT_MP]: "公众号",
  };

  return platformMap[platformEnum] || "未知平台";
}

/**
 * 根据枚举值获取平台图标
 * @param {number} platformEnum 平台枚举值
 * @returns {string} 平台图标
 */
function getPlatformIcon(platformEnum) {
  const platformIconMap = {
    [PlatformEnum.WECHAT_MP]: "📰",
  };

  return platformIconMap[platformEnum] || "📋";
}

/**
 * 根据枚举值获取平台图标路径
 * @param {number} platformEnum 平台枚举值
 * @returns {string} 平台图标路径
 */
function getPlatformIconPath(platformEnum) {
  // 暂时使用默认图标，避免图片文件不存在的问题
  return "/imgs/default-platform.png";
}

/**
 * 根据显示名称获取平台枚举值
 * @param {string} platformName 平台显示名称
 * @returns {number} 平台枚举值
 */
function getPlatformEnum(platformName) {
  const reverseMap = {
    公众号: PlatformEnum.WECHAT_MP,
    微信公众号: PlatformEnum.WECHAT_MP,
  };

  return reverseMap[platformName] || PlatformEnum.WECHAT_MP;
}

/**
 * 获取所有平台的映射关系
 * @returns {Object} 枚举值到显示名称的映射
 */
function getAllPlatforms() {
  return {
    [PlatformEnum.WECHAT_MP]: "公众号",
  };
}

/**
 * 获取平台选择器列表
 * 用于picker组件的range数据源
 * @returns {Array} 平台选择器列表
 */
function getPlatformList() {
  return [
    {
      type: PlatformEnum.WECHAT_MP,
      name: getPlatformName(PlatformEnum.WECHAT_MP),
      icon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    },
  ];
}

module.exports = {
  getPlatformName,
  getPlatformIcon,
  getPlatformIconPath,
  getPlatformEnum,
  getAllPlatforms,
  getPlatformList,
  PlatformEnum,
};
