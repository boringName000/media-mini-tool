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
    [PlatformEnum.XIAOHONGSHU]: "小红书",
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
    [PlatformEnum.WECHAT_MP]: "📰",
    [PlatformEnum.XIAOHONGSHU]: "📱",
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
    [PlatformEnum.WECHAT_MP]: "公众号",
    [PlatformEnum.XIAOHONGSHU]: "小红书",
    [PlatformEnum.DOUYIN]: "抖音",
    [PlatformEnum.KUAISHOU]: "快手",
    [PlatformEnum.BILIBILI]: "B站",
    [PlatformEnum.WEIBO]: "微博",
    [PlatformEnum.ZHIHU]: "知乎",
    [PlatformEnum.TIKTOK]: "TikTok",
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
    {
      type: PlatformEnum.XIAOHONGSHU,
      name: getPlatformName(PlatformEnum.XIAOHONGSHU),
      icon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
    },
    {
      type: PlatformEnum.DOUYIN,
      name: getPlatformName(PlatformEnum.DOUYIN),
      icon: getPlatformIcon(PlatformEnum.DOUYIN),
    },
    {
      type: PlatformEnum.KUAISHOU,
      name: getPlatformName(PlatformEnum.KUAISHOU),
      icon: getPlatformIcon(PlatformEnum.KUAISHOU),
    },
    {
      type: PlatformEnum.BILIBILI,
      name: getPlatformName(PlatformEnum.BILIBILI),
      icon: getPlatformIcon(PlatformEnum.BILIBILI),
    },
    {
      type: PlatformEnum.WEIBO,
      name: getPlatformName(PlatformEnum.WEIBO),
      icon: getPlatformIcon(PlatformEnum.WEIBO),
    },
    {
      type: PlatformEnum.ZHIHU,
      name: getPlatformName(PlatformEnum.ZHIHU),
      icon: getPlatformIcon(PlatformEnum.ZHIHU),
    },
    {
      type: PlatformEnum.TIKTOK,
      name: getPlatformName(PlatformEnum.TIKTOK),
      icon: getPlatformIcon(PlatformEnum.TIKTOK),
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
