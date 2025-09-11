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
  ACC003: "艺术创作者",
  ACC004: "摄影师小李",
  ACC005: "汽车达人",
  ACC006: "宠物博主",
  ACC007: "科技数码评测师",
  ACC008: "时尚美妆达人",
  ACC009: "娱乐内容创作者",
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
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
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
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    accountName: "艺术创作者",
    trackTypeEnum: TrackTypeEnum.Art,
    trackType: getTrackTypeName(TrackTypeEnum.Art),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.Art),
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
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    accountName: "汽车达人",
    trackTypeEnum: TrackTypeEnum.CAR_TRACK,
    trackType: getTrackTypeName(TrackTypeEnum.CAR_TRACK),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.CAR_TRACK),
  },
  {
    accountId: "ACC006",
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    accountName: "宠物博主",
    trackTypeEnum: TrackTypeEnum.PET,
    trackType: getTrackTypeName(TrackTypeEnum.PET),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.PET),
  },
  {
    accountId: "ACC007",
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    accountName: "科技数码评测师",
    trackTypeEnum: TrackTypeEnum.TECH_DIGITAL,
    trackType: getTrackTypeName(TrackTypeEnum.TECH_DIGITAL),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.TECH_DIGITAL),
  },
  {
    accountId: "ACC008",
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    accountName: "时尚美妆达人",
    trackTypeEnum: TrackTypeEnum.FASHION_BEAUTY,
    trackType: getTrackTypeName(TrackTypeEnum.FASHION_BEAUTY),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.FASHION_BEAUTY),
  },
  {
    accountId: "ACC009",
    platformEnum: PlatformEnum.WECHAT_MP,
    platform: getPlatformName(PlatformEnum.WECHAT_MP),
    platformIcon: getPlatformIcon(PlatformEnum.WECHAT_MP),
    accountName: "娱乐内容创作者",
    trackTypeEnum: TrackTypeEnum.ENTERTAINMENT,
    trackType: getTrackTypeName(TrackTypeEnum.ENTERTAINMENT),
    trackIcon: getTrackTypeIcon(TrackTypeEnum.ENTERTAINMENT),
  },
];

module.exports = {
  ACCOUNT_MAPPING,
  getAccountName,
  getAccountId,
  getAccountList,
};
