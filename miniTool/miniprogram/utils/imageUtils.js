/**
 * 图片处理工具类
 * 统一处理云存储图片、本地图片、外部图片等
 */

/**
 * 判断是否为云存储图片
 * @param {string} imageUrl - 图片URL
 * @returns {boolean} 是否为云存储图片
 */
function isCloudImage(imageUrl) {
  if (!imageUrl) return false;
  return imageUrl.startsWith("cloud://");
}

/**
 * 判断是否为外部图片（HTTP/HTTPS链接）
 * @param {string} imageUrl - 图片URL
 * @returns {boolean} 是否为外部图片
 */
function isExternalImage(imageUrl) {
  if (!imageUrl) return false;
  return imageUrl.startsWith("http://") || imageUrl.startsWith("https://");
}

/**
 * 判断是否为本地图片
 * @param {string} imageUrl - 图片URL
 * @returns {boolean} 是否为本地图片
 */
function isLocalImage(imageUrl) {
  if (!imageUrl) return false;
  return (
    imageUrl.startsWith("/") ||
    imageUrl.startsWith("./") ||
    imageUrl.startsWith("http://tmp/")
  );
}

/**
 * 获取图片显示信息
 * @param {string} imageUrl - 图片URL
 * @returns {object} 图片显示信息
 */
function getImageDisplayInfo(imageUrl) {
  if (!imageUrl) {
    return {
      url: "",
      isCloudImage: false,
      isExternalImage: false,
      isLocalImage: false,
      shouldUseCloudImage: false,
      fallbackUrl: "/imgs/arrow.png",
    };
  }

  const isCloud = isCloudImage(imageUrl);
  const isExternal = isExternalImage(imageUrl);
  const isLocal = isLocalImage(imageUrl);

  return {
    url: imageUrl,
    isCloudImage: isCloud,
    isExternalImage: isExternal,
    isLocalImage: isLocal,
    shouldUseCloudImage: isCloud,
    fallbackUrl: "/imgs/arrow.png",
  };
}

/**
 * 处理图片URL，返回适合显示的URL
 * @param {string} imageUrl - 原始图片URL
 * @param {boolean} needTempUrl - 是否需要临时URL（用于背景图片等场景）
 * @returns {object} 处理后的图片信息
 */
function processImageUrl(imageUrl, needTempUrl = false) {
  const displayInfo = getImageDisplayInfo(imageUrl);

  // 如果是云存储图片，根据需求返回fileID或临时URL
  if (displayInfo.isCloudImage) {
    if (needTempUrl) {
      // 对于背景图片等场景，需要临时URL
      return {
        url: imageUrl, // 这里需要异步获取临时URL
        isCloudImage: true,
        shouldUseCloudImage: false, // 不使用cloud-image组件
        needTempUrl: true,
      };
    } else {
      // 对于cloud-image组件，直接返回fileID
      return {
        url: imageUrl,
        isCloudImage: true,
        shouldUseCloudImage: true,
      };
    }
  }

  // 如果是外部链接，直接使用原URL（不再强制使用默认图片）
  if (displayInfo.isExternalImage) {
    return {
      url: imageUrl,
      isCloudImage: false,
      shouldUseCloudImage: false,
    };
  }

  // 临时文件由智能图片组件处理，这里不做特殊处理
  // if (imageUrl.startsWith("http://tmp/")) {
  //   return {
  //     url: displayInfo.fallbackUrl,
  //     isCloudImage: false,
  //     shouldUseCloudImage: false,
  //   };
  // }

  // 本地图片或其他情况
  return {
    url: imageUrl,
    isCloudImage: false,
    shouldUseCloudImage: false,
  };
}

/**
 * 批量处理图片URL数组
 * @param {Array} imageUrls - 图片URL数组
 * @returns {Array} 处理后的图片信息数组
 */
function processImageUrls(imageUrls) {
  if (!Array.isArray(imageUrls)) {
    return [];
  }

  return imageUrls.map((url) => processImageUrl(url));
}

/**
 * 获取云存储图片的临时URL（如果需要的话）
 * @param {string} fileID - 云存储文件ID
 * @returns {Promise<string>} 临时URL
 */
async function getCloudImageTempUrl(fileID) {
  if (!isCloudImage(fileID)) {
    throw new Error("不是云存储图片");
  }

  try {
    const result = await wx.cloud.getTempFileURL({
      fileList: [fileID],
    });

    if (
      result.fileList &&
      result.fileList[0] &&
      result.fileList[0].tempFileURL
    ) {
      return result.fileList[0].tempFileURL;
    } else {
      throw new Error("获取临时URL失败");
    }
  } catch (error) {
    console.error("获取云存储图片临时URL失败:", error);
    throw error;
  }
}

/**
 * 异步处理图片URL，返回适合显示的URL（支持云存储临时URL）
 * @param {string} imageUrl - 原始图片URL
 * @param {boolean} needTempUrl - 是否需要临时URL（用于背景图片等场景）
 * @returns {Promise<object>} 处理后的图片信息
 */
async function processImageUrlAsync(imageUrl, needTempUrl = false) {
  const displayInfo = getImageDisplayInfo(imageUrl);

  // 如果是云存储图片且需要临时URL
  if (displayInfo.isCloudImage && needTempUrl) {
    try {
      const tempUrl = await getCloudImageTempUrl(imageUrl);
      return {
        url: tempUrl,
        isCloudImage: false, // 现在已经是临时URL了
        shouldUseCloudImage: false,
        needTempUrl: false,
      };
    } catch (error) {
      console.error("获取云存储图片临时URL失败:", error);
      // 降级到默认图片
      return {
        url: displayInfo.fallbackUrl,
        isCloudImage: false,
        shouldUseCloudImage: false,
        needTempUrl: false,
      };
    }
  }

  // 其他情况使用同步处理
  return processImageUrl(imageUrl, needTempUrl);
}

/**
 * 处理图片加载错误
 * @param {string} currentUrl - 当前图片URL
 * @param {string} originalUrl - 原始图片URL
 * @returns {object} 错误处理结果
 */
async function handleImageError(currentUrl, originalUrl) {
  // 如果是云存储图片加载失败，尝试重新获取临时URL
  if (currentUrl && currentUrl.includes("tcb.qcloud.la")) {
    if (originalUrl && isCloudImage(originalUrl)) {
      try {
        const tempUrl = await getCloudImageTempUrl(originalUrl);
        return {
          success: true,
          url: tempUrl,
          isCloudImage: false,
          shouldUseCloudImage: false,
        };
      } catch (error) {
        console.error("重新获取云存储图片临时URL失败:", error);
      }
    }
  }

  // 其他情况使用默认图片
  return {
    success: false,
    url: "/imgs/arrow.png",
    isCloudImage: false,
    shouldUseCloudImage: false,
  };
}

module.exports = {
  isCloudImage,
  isExternalImage,
  isLocalImage,
  getImageDisplayInfo,
  processImageUrl,
  processImageUrlAsync,
  processImageUrls,
  getCloudImageTempUrl,
  handleImageError,
};
