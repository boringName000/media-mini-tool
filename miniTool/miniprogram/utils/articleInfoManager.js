// 文章信息管理器
// 统一管理文章信息的保存、获取、删除等操作

const {
  addArticleInfo,
  getArticleInfoList,
  deleteArticleInfo,
  clearAllArticleInfo,
} = require("./articleStorageCore");

/**
 * 保存文章信息到本地存储
 * @param {Object} options 保存选项
 * @param {string} options.downloadUrl 下载链接
 * @param {string} options.articleTitle 文章标题
 * @param {string} options.articleId 文章ID
 * @param {number} options.trackType 赛道类型
 * @param {number} options.platformType 平台类型
 * @param {function} [options.onSuccess] 成功回调
 * @param {function} [options.onError] 失败回调
 */
function saveArticleInfo(options) {
  const {
    downloadUrl,
    articleTitle,
    articleId,
    trackType,
    platformType,
    onSuccess,
    onError,
  } = options || {};

  if (!downloadUrl || !articleTitle || !articleId) {
    const error = "文章信息不完整，缺少必要字段";
    if (onError) onError(error);
    else {
      wx.showToast({ title: error, icon: "none" });
    }
    return;
  }

  // 检查云存储文件状态
  checkCloudFileStatus(downloadUrl, (fileExists) => {
    if (fileExists) {
      wx.showModal({
        title: "确认保存",
        content: `确定要保存文章："${articleTitle}" 的信息到本地吗？`,
        success: (res) => {
          if (res.confirm) {
            _saveArticleInfoToLocal({
              downloadUrl,
              articleTitle,
              articleId,
              trackType,
              platformType,
              onSuccess,
              onError,
            });
          }
        },
      });
    } else {
      const error = "云存储中的文件不存在或无法访问";
      if (onError) onError(error);
      else {
        wx.showModal({
          title: "文件不存在",
          content: "云存储中的文件不存在或无法访问，请检查文件状态。",
          showCancel: false,
          confirmText: "知道了",
        });
      }
    }
  });
}

// 内部：保存文章信息到本地存储
function _saveArticleInfoToLocal(options) {
  const {
    downloadUrl,
    articleTitle,
    articleId,
    trackType,
    platformType,
    onSuccess,
    onError,
  } = options;

  wx.showLoading({ title: "保存中..." });

  try {
    // 保存文章信息到本地存储
    const success = addArticleInfo({
      title: articleTitle,
      articleId: articleId,
      trackType: trackType,
      platformType: platformType,
      downloadUrl: downloadUrl,
    });

    wx.hideLoading();

    if (success) {
      console.log("✅ 文章信息保存成功");

      if (onSuccess) {
        onSuccess({ articleTitle, downloadUrl });
      } else {
        // 弹框提示是否跳转到排版工具页面
        setTimeout(() => {
          wx.showModal({
            title: "保存成功",
            content: "文章信息已保存，是否跳转到排版工具页面预览？",
            success: (modalRes) => {
              if (modalRes.confirm) {
                navigateToLayoutTool();
              }
            },
          });
        }, 500);
      }
    } else {
      const error = "保存文章信息失败";
      if (onError) onError(error);
      else {
        wx.showToast({
          title: error,
          icon: "none",
        });
      }
    }
  } catch (error) {
    wx.hideLoading();
    console.error("❌ 保存文章信息异常:", error);

    const errorMsg = `保存文章信息异常: ${error.message || "未知错误"}`;
    if (onError) onError(errorMsg);
    else {
      wx.showToast({
        title: errorMsg,
        icon: "none",
      });
    }
  }
}

/**
 * 检查云存储文件状态
 * @param {string} fileID 文件ID
 * @param {function} callback 回调函数，参数为布尔值表示文件是否存在
 */
function checkCloudFileStatus(fileID, callback) {
  console.log("检查云存储文件状态");
  wx.cloud.getTempFileURL({
    fileList: [fileID],
    success: (res) => {
      if (res.fileList && res.fileList.length > 0) {
        const fileInfo = res.fileList[0];
        if (fileInfo.status === 0) {
          console.log("✅ 文件存在且可访问");
          callback(true);
        } else if (
          fileInfo.status === 1 &&
          fileInfo.errMsg === "STORAGE_FILE_NONEXIST"
        ) {
          console.error("❌ 文件不存在:", fileInfo.errMsg);
          callback(false);
        } else {
          console.error("❌ 文件状态异常:", fileInfo.status, fileInfo.errMsg);
          callback(false);
        }
      } else {
        console.error("❌ 无法获取文件信息");
        callback(false);
      }
    },
    fail: (err) => {
      console.error("❌ 检查文件状态失败:", err);
      callback(false);
    },
  });
}

/**
 * 跳转到排版工具页面
 */
function navigateToLayoutTool() {
  wx.navigateTo({
    url: "/pages/layout-tool/layout-tool",
    success: () => {
      console.log("跳转到排版工具页面成功");
    },
    fail: (err) => {
      console.error("跳转到排版工具页面失败:", err);
      wx.showToast({ title: "跳转失败，请重试", icon: "none" });
    },
  });
}

/**
 * 复制内容到剪贴板
 * @param {string} content 要复制的内容
 */
function copyToClipboard(content) {
  wx.setClipboardData({
    data: content,
    success: () => {
      wx.showToast({ title: "已复制到剪贴板", icon: "success" });
    },
    fail: () => {
      wx.showToast({ title: "复制失败", icon: "none" });
    },
  });
}

// 导出所有文章信息管理相关的函数
module.exports = {
  // 核心功能
  saveArticleInfo,
  getArticleInfoList,
  deleteArticleInfo,
  clearAllArticleInfo,

  // 辅助功能
  checkCloudFileStatus,
  navigateToLayoutTool,
  copyToClipboard,
};
