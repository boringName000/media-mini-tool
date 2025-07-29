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
    [PlatformEnum.XIAOHONGSHU]: "小红书",
    [PlatformEnum.WECHAT_MP]: "公众号",
    [PlatformEnum.DOUYIN]: "抖音",
    [PlatformEnum.KUAISHOU]: "快手",
    [PlatformEnum.BILIBILI]: "B站",
    [PlatformEnum.WEIBO]: "微博",
    [PlatformEnum.ZHIHU]: "知乎",
    [PlatformEnum.TIKTOK]: "TikTok",
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
    [PlatformEnum.XIAOHONGSHU]: "📱",
    [PlatformEnum.WECHAT_MP]: "📰",
    [PlatformEnum.DOUYIN]: "🎵",
    [PlatformEnum.KUAISHOU]: "⚡",
    [PlatformEnum.BILIBILI]: "📺",
    [PlatformEnum.WEIBO]: "🌐",
    [PlatformEnum.ZHIHU]: "❓",
    [PlatformEnum.TIKTOK]: "🎬",
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
    小红书: PlatformEnum.XIAOHONGSHU,
    公众号: PlatformEnum.WECHAT_MP,
    微信公众号: PlatformEnum.WECHAT_MP,
    抖音: PlatformEnum.DOUYIN,
    快手: PlatformEnum.KUAISHOU,
    B站: PlatformEnum.BILIBILI,
    bilibili: PlatformEnum.BILIBILI,
    微博: PlatformEnum.WEIBO,
    知乎: PlatformEnum.ZHIHU,
    TikTok: PlatformEnum.TIKTOK,
  };

  return reverseMap[platformName] || PlatformEnum.XIAOHONGSHU;
}

/**
 * 获取所有平台的映射关系
 * @returns {Object} 枚举值到显示名称的映射
 */
function getAllPlatforms() {
  return {
    [PlatformEnum.XIAOHONGSHU]: "小红书",
    [PlatformEnum.WECHAT_MP]: "公众号",
    [PlatformEnum.DOUYIN]: "抖音",
    [PlatformEnum.KUAISHOU]: "快手",
    [PlatformEnum.BILIBILI]: "B站",
    [PlatformEnum.WEIBO]: "微博",
    [PlatformEnum.ZHIHU]: "知乎",
    [PlatformEnum.TIKTOK]: "TikTok",
  };
}

module.exports = {
  getPlatformName,
  getPlatformIcon,
  getPlatformIconPath,
  getPlatformEnum,
  getAllPlatforms,
  PlatformEnum,
};
