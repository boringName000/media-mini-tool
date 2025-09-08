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
 * @param {string} options.accountId 账号ID
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
    accountId,
    trackType,
    platformType,
    onSuccess,
    onError,
  } = options || {};

  if (!downloadUrl || !articleTitle || !articleId || !accountId) {
    const error = "文章信息不完整，缺少必要字段";
    if (onError) onError(error);
    else {
      wx.showToast({ title: error, icon: "none" });
    }
    return;
  }

  // 先弹框询问是否下载
  wx.showModal({
    title: "今日文章",
    content: `确定要保存文章："${articleTitle}" 的信息到本地吗？`,
    success: (res) => {
      if (res.confirm) {
        // 用户确认后，先调用 claim-daily-task 云函数更新任务状态
        _claimDailyTaskAndSave({
          downloadUrl,
          articleTitle,
          articleId,
          accountId,
          trackType,
          platformType,
          onSuccess,
          onError,
        });
      }
      // 用户取消，不做任何操作
    },
  });
}

// 内部：调用 claim-daily-task 云函数并保存文章信息
function _claimDailyTaskAndSave(options) {
  const {
    downloadUrl,
    articleTitle,
    articleId,
    accountId,
    trackType,
    platformType,
    onSuccess,
    onError,
  } = options;

  // 显示加载提示
  wx.showLoading({ title: "处理中..." });

  // 获取当前用户信息
  const app = getApp();
  if (!app || !app.globalData || !app.globalData.loginResult) {
    wx.hideLoading();
    const error = "无法获取用户信息";
    if (onError) onError(error);
    else {
      wx.showToast({ title: error, icon: "none" });
    }
    return;
  }

  const userInfo = app.globalData.loginResult;
  const userId = userInfo.userId;

  // 调用 claim-daily-task 云函数
  wx.cloud.callFunction({
    name: "claim-daily-task",
    data: {
      userId: userId,
      accountId: accountId,
      articleId: articleId,
    },
    success: (res) => {
      console.log("claim-daily-task 云函数调用结果:", res);

      if (res.result && res.result.success) {
        // 云函数调用成功，更新全局用户数据
        const result = res.result;
        if (result.data && result.data.allDailyTasks) {
          // 更新对应账号的每日任务数据
          const accounts = userInfo.accounts || [];
          const updatedAccounts = accounts.map((account) => {
            if (account.accountId === accountId) {
              return {
                ...account,
                dailyTasks: result.data.allDailyTasks,
              };
            }
            return account;
          });

          // 更新全局用户数据
          app.globalData.loginResult.accounts = updatedAccounts;

          // 更新本地存储
          try {
            wx.setStorageSync("loginResult", app.globalData.loginResult);
            console.log("✅ 全局用户数据已更新");
          } catch (e) {
            console.error("更新本地存储失败:", e);
          }
        }

        // 继续处理文章保存
        _processArticleSave({
          downloadUrl,
          articleTitle,
          articleId,
          accountId,
          trackType,
          platformType,
          onSuccess,
          onError,
        });
      } else {
        wx.hideLoading();
        const error = res.result?.message || "更新任务状态失败";
        if (onError) onError(error);
        else {
          wx.showToast({ title: error, icon: "none" });
        }
      }
    },
    fail: (err) => {
      wx.hideLoading();
      console.error("调用 claim-daily-task 云函数失败:", err);
      const error = "网络错误，请重试";
      if (onError) onError(error);
      else {
        wx.showToast({ title: error, icon: "none" });
      }
    },
  });
}

// 内部：处理文章保存
function _processArticleSave(options) {
  const {
    downloadUrl,
    articleTitle,
    articleId,
    accountId,
    trackType,
    platformType,
    onSuccess,
    onError,
  } = options;

  // 兑换长期下载URL
  getPermanentDownloadUrl(downloadUrl, (permanentUrl) => {
    if (permanentUrl) {
      // 兑换成功，直接存入本地存储
      _saveArticleInfoToLocal({
        originalFileId: downloadUrl, // 保留原始文件ID
        permanentDownloadUrl: permanentUrl, // 新增字段存储长期下载URL
        articleTitle,
        articleId,
        accountId,
        trackType,
        platformType,
        onSuccess,
        onError,
      });
    } else {
      // 兑换失败，说明文件不存在或无法访问
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
    originalFileId,
    permanentDownloadUrl,
    articleTitle,
    articleId,
    accountId,
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
      accountId: accountId,
      trackType: trackType,
      platformType: platformType,
      originalFileId: originalFileId, // 原始文件ID
      permanentDownloadUrl: permanentDownloadUrl, // 长期下载URL
    });

    wx.hideLoading();

    if (success) {
      console.log("✅ 文章信息保存成功");

      if (onSuccess) {
        onSuccess({ articleTitle, downloadUrl });
      } else {
        // 弹框提示是否跳转到排版工具页面
        wx.showModal({
          title: "保存成功",
          content: "文章信息已保存，是否跳转到排版工具页面预览文章？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 跳转到排版工具页面并关闭当前文章列表页面
              navigateToLayoutTool(true);
            }
          },
        });
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
 * 获取长期下载URL
 * @param {string} fileID 文件ID
 * @param {function} callback 回调函数，参数为长期下载URL或null
 */
function getPermanentDownloadUrl(fileID, callback) {
  console.log("获取长期下载URL:", fileID);

  wx.cloud.getTempFileURL({
    fileList: [fileID],
    success: (res) => {
      if (res.fileList && res.fileList.length > 0) {
        const fileInfo = res.fileList[0];
        if (fileInfo.status === 0 && fileInfo.tempFileURL) {
          console.log("✅ 获取长期下载URL成功:", fileInfo.tempFileURL);
          callback(fileInfo.tempFileURL);
        } else {
          console.error(
            "❌ 获取长期下载URL失败:",
            fileInfo.status,
            fileInfo.errMsg
          );
          callback(null);
        }
      } else {
        console.error("❌ 无法获取文件信息");
        callback(null);
      }
    },
    fail: (err) => {
      console.error("❌ 获取长期下载URL失败:", err);
      callback(null);
    },
  });
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
 * @param {boolean} closeCurrentPage 是否关闭当前页面，默认为false
 */
function navigateToLayoutTool(closeCurrentPage = false) {
  const navigateMethod = closeCurrentPage ? wx.redirectTo : wx.navigateTo;
  
  navigateMethod({
    url: "/pages/layout-tool/layout-tool",
    success: () => {
      console.log(`跳转到排版工具页面成功${closeCurrentPage ? '（已关闭当前页面）' : ''}`);
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
  getPermanentDownloadUrl,
  checkCloudFileStatus,
  navigateToLayoutTool,
  copyToClipboard,
};
