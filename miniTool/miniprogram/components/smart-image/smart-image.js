// 智能图片组件 - 自动处理云存储和普通图片
const imageUtils = require("../../utils/imageUtils");

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 图片URL或云存储fileID
    src: {
      type: String,
      value: "",
    },
    // 图片显示模式
    mode: {
      type: String,
      value: "aspectFit",
    },
    // 图片样式类名
    class: {
      type: String,
      value: "",
    },
    // 是否懒加载
    lazyLoad: {
      type: Boolean,
      value: false,
    },
    // 默认图片
    defaultSrc: {
      type: String,
      value: "/imgs/arrow.png",
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    displayUrl: "",
    isCloudImage: false,
    shouldUseCloudImage: false,
    isTempFile: false,
    imageError: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 初始化图片显示
    initImage() {
      const { src, defaultSrc } = this.properties;

      console.log("智能图片组件初始化:", { src, defaultSrc });

      if (!src) {
        console.log("图片src为空，使用默认图片");
        this.setData({
          displayUrl: defaultSrc,
          isCloudImage: false,
          shouldUseCloudImage: false,
          isTempFile: false,
        });
        return;
      }

      // 检查是否为临时文件
      const isTempFile = src.startsWith("http://tmp/");

      if (isTempFile) {
        console.log("检测到临时文件，使用背景图片显示");
        // 临时文件直接使用背景图片显示
        this.setData({
          displayUrl: src,
          isCloudImage: false,
          shouldUseCloudImage: false,
          isTempFile: true,
          imageError: false,
        });
        return;
      }

      const imageInfo = imageUtils.processImageUrl(src);
      console.log("图片处理结果:", imageInfo);

      this.setData({
        displayUrl: imageInfo.url,
        isCloudImage: imageInfo.isCloudImage,
        shouldUseCloudImage: imageInfo.shouldUseCloudImage,
        isTempFile: false,
        imageError: false,
      });

      console.log("组件状态设置完成:", {
        displayUrl: imageInfo.url,
        isCloudImage: imageInfo.isCloudImage,
        shouldUseCloudImage: imageInfo.shouldUseCloudImage,
        isTempFile: false,
        imageError: false,
      });

      // 如果是云存储图片，添加额外调试信息
      if (imageInfo.isCloudImage) {
        console.log("=== 云存储图片调试信息 ===");
        console.log("原始fileID:", src);
        console.log("处理后的fileID:", imageInfo.url);
        console.log("是否使用cloud-image组件:", imageInfo.shouldUseCloudImage);
        console.log("组件class:", this.properties.class);
        console.log("组件mode:", this.properties.mode);
      }
    },

    // 图片加载错误处理
    onImageError(e) {
      console.error("图片加载失败:", e);

      const { src } = this.properties;

      // 使用工具方法处理错误
      imageUtils
        .handleImageError(this.data.displayUrl, src)
        .then((result) => {
          this.setData({
            displayUrl: result.url,
            isCloudImage: result.shouldUseCloudImage,
            shouldUseCloudImage: result.shouldUseCloudImage,
            imageError: true,
          });
        })
        .catch((error) => {
          console.error("图片错误处理失败:", error);
          this.setData({
            displayUrl: this.properties.defaultSrc,
            isCloudImage: false,
            shouldUseCloudImage: false,
            imageError: true,
          });
        });
    },

    // 图片点击事件
    onImageTap(e) {
      this.triggerEvent("tap", e.detail);
    },

    // 图片加载成功
    onImageLoad(e) {
      this.triggerEvent("load", e.detail);
    },
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initImage();
    },
  },

  /**
   * 监听属性变化
   */
  observers: {
    src: function (newSrc) {
      this.initImage();
    },
  },
});
