// 统一账号配置
const {
  PlatformEnum,
  getPlatformName,
  getPlatformIcon,
} = require("../utils/platformUtils");

const {
  TrackTypeEnum,
  getTrackTypeName,
  getTrackTypeIcon,
} = require("../utils/trackTypeUtils");

// 账号ID和名称的映射关系
const ACCOUNT_MAPPING = {
  ACC001: "美食达人小红",
  ACC002: "旅游探索者",
  ACC003: "书法艺术家",
  ACC004: "摄影师小李",
  ACC005: "古董收藏家",
};

// 获取账号名称
const getAccountName = (accountId) => {
  return ACCOUNT_MAPPING[accountId] || "未知账号";
};

// 获取账号ID
const getAccountId = (accountName) => {
  for (const [id, name] of Object.entries(ACCOUNT_MAPPING)) {
    if (name === accountName) {
      return id;
    }
  }
  return null;
};

// 统一的账号列表配置
const getAccountList = () => [
  {
    accountId: "ACC001",
    platformEnum: PlatformEnum.XIAOHONGSHU,
    platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
    platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
    accountName: "美食达人小红",
    trackTypeEnum: TrackTypeEnum.FOOD_TRACK,
    trackType: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.FOOD_TRACK),
  },
  {
    accountId: "ACC002",
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    accountName: "旅游探索者",
    trackTypeEnum: TrackTypeEnum.TRAVEL_TRACK,
    trackType: getTrackTypeName(TrackTypeEnum.TRAVEL_TRACK),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_TRACK),
  },
  {
    accountId: "ACC003",
    platformEnum: PlatformEnum.XIAOHONGSHU,
    platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
    platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
    accountName: "书法艺术家",
    trackTypeEnum: TrackTypeEnum.CALLIGRAPHY,
    trackType: getTrackTypeName(TrackTypeEnum.CALLIGRAPHY),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.CALLIGRAPHY),
  },
  {
    accountId: "ACC004",
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    accountName: "摄影师小李",
    trackTypeEnum: TrackTypeEnum.PHOTOGRAPHY,
    trackType: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.PHOTOGRAPHY),
  },
  {
    accountId: "ACC005",
    platformEnum: PlatformEnum.XIAOHONGSHU,
    platform: getPlatformName(PlatformEnum.XIAOHONGSHU),
    platformIcon: getPlatformIcon(PlatformEnum.XIAOHONGSHU),
    accountName: "古董收藏家",
    trackTypeEnum: TrackTypeEnum.ANTIQUE,
    trackType: getTrackTypeName(TrackTypeEnum.ANTIQUE),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.ANTIQUE),
  },
];

module.exports = {
  ACCOUNT_MAPPING,
  getAccountName,
  getAccountId,
  getAccountList,
};
