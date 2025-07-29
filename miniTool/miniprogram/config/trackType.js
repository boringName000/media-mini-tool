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
    icon: getTrackTypeIcon(TrackTypeEnum.TRAVEL_ARTICLE),
    name: getTrackTypeName(TrackTypeEnum.TRAVEL_ARTICLE),
    type: TrackTypeEnum.TRAVEL_ARTICLE,
    description: "深度旅游文章创作，详细的旅游攻略和游记分享",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.CALLIGRAPHY),
    name: getTrackTypeName(TrackTypeEnum.CALLIGRAPHY),
    type: TrackTypeEnum.CALLIGRAPHY,
    description: "书法艺术展示，传统文化传承，书法教学与欣赏",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.FOOD_GIF),
    name: getTrackTypeName(TrackTypeEnum.FOOD_GIF),
    type: TrackTypeEnum.FOOD_GIF,
    description: "美食制作过程动态展示，长期稳定的美食内容输出",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.FOOD_GREEN),
    name: getTrackTypeName(TrackTypeEnum.FOOD_GREEN),
    type: TrackTypeEnum.FOOD_GREEN,
    description: "精品美食内容创作，高质量美食图文分享",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.PHOTOGRAPHY),
    name: getTrackTypeName(TrackTypeEnum.PHOTOGRAPHY),
    type: TrackTypeEnum.PHOTOGRAPHY,
    description: "摄影作品展示，摄影技巧分享，记录生活美好瞬间",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.ANTIQUE),
    name: getTrackTypeName(TrackTypeEnum.ANTIQUE),
    type: TrackTypeEnum.ANTIQUE,
    description: "古董文物鉴赏，收藏知识分享，传统文化推广",
  },
  {
    icon: getTrackTypeIcon(TrackTypeEnum.PET),
    name: getTrackTypeName(TrackTypeEnum.PET),
    type: TrackTypeEnum.PET,
    description: "宠物日常分享，宠物护理知识，萌宠生活记录",
  },
];
