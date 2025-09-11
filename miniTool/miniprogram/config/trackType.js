const { TrackTypeEnum } = require("../type/type");
const {
  getTrackTypeName,
  getTrackTypeIcon,
} = require("../utils/trackTypeUtils");

module.exports = [
  {
    icon: getTrackTypeIcon(TrackTypeEnum.FOOD_TRACK),
    name: getTrackTypeName(TrackTypeEnum.FOOD_TRACK),
    type: TrackTypeEnum.FOOD_TRACK,
    description: "专注美食内容创作，分享各类美食制作过程和品尝体验",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.ENTERTAINMENT),
    name: getTrackTypeName(TrackTypeEnum.ENTERTAINMENT),
    type: TrackTypeEnum.ENTERTAINMENT,
    description: "娱乐搞笑内容创作，包括段子、剧情、音乐等娱乐形式",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_TRACK),
    name: getTrackTypeName(TrackTypeEnum.TRAVEL_TRACK),
    type: TrackTypeEnum.TRAVEL_TRACK,
    description: "旅游景点推荐，旅行攻略分享，记录美好旅程",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.CAR_TRACK),
    name: getTrackTypeName(TrackTypeEnum.CAR_TRACK),
    type: TrackTypeEnum.CAR_TRACK,
    description: "汽车相关内容创作，包括汽车评测、驾驶技巧、汽车文化分享",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.Art),
    name: getTrackTypeName(TrackTypeEnum.Art),
    type: TrackTypeEnum.Art,
    description: "艺术作品展示，艺术创作过程分享，传统与现代艺术推广",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.PHOTOGRAPHY),
    name: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
    type: TrackTypeEnum.PHOTOGRAPHY,
    description: "摄影作品展示，摄影技巧分享，记录生活美好瞬间",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.PET),
    name: getTrackTypeName(TrackTypeEnum.PET),
    type: TrackTypeEnum.PET,
    description: "宠物日常分享，宠物护理知识，萌宠生活记录",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.TECH_DIGITAL),
    name: getTrackTypeName(TrackTypeEnum.TECH_DIGITAL),
    type: TrackTypeEnum.TECH_DIGITAL,
    description: "科技数码产品评测，技术知识分享，数码生活体验",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.FASHION_BEAUTY),
    name: getTrackTypeName(TrackTypeEnum.FASHION_BEAUTY),
    type: TrackTypeEnum.FASHION_BEAUTY,
    description: "时尚穿搭分享，美妆教程，潮流趋势解读",
  },
];
