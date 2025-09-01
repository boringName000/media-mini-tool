// 文章下载工具函数
// 提供统一的文章下载、保存、元数据管理功能

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
 * 下载文章文件（外部调用）
 * @param {Object} options 下载选项
 * @param {string} options.downloadUrl 下载链接
 * @param {string} options.articleTitle 文章标题
 * @param {number} options.trackType 赛道类型
 * @param {number} options.platformType 平台类型
 * @param {function} [options.onSuccess] 成功回调
 * @param {function} [options.onError] 失败回调
 */
function downloadArticle(options) {
  const {
    downloadUrl,
    articleTitle,
    trackType,
    platformType,
    onSuccess,
    onError,
  } = options || {};

  if (!downloadUrl) {
    const error = "文章下载链接不可用";
    if (onError) onError(error);
    else {
      wx.showToast({ title: error, icon: "none" });
    }
    return;
  }

  checkCloudFileStatus(downloadUrl, (fileExists) => {
    if (fileExists) {
      wx.showModal({
        title: "确认下载",
        content: `确定要下载文章"${articleTitle}"到本地吗？`,
        success: (res) => {
          if (res.confirm) {
            _downloadFromCloud({
              downloadUrl,
              articleTitle,
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

// 内部：从云存储下载文件
function _downloadFromCloud(options) {
  const {
    downloadUrl,
    articleTitle,
    trackType,
    platformType,
    onSuccess,
    onError,
  } = options;

  wx.showLoading({ title: "下载中..." });

  wx.cloud.downloadFile({
    fileID: downloadUrl,
    success: (res) => {
      wx.hideLoading();
      console.log("✅ 云存储下载成功");

      _saveFileToLocal({
        tempFilePath: res.tempFilePath,
        fileName: articleTitle,
        originalDownloadUrl: downloadUrl,
        trackType,
        platformType,
        onSuccess,
        onError,
      });
    },
    fail: (err) => {
      wx.hideLoading();
      console.error("❌ 云存储下载失败:", err);

      const error = `云存储下载失败: ${err.errMsg || "未知错误"}`;
      if (onError) {
        onError(error);
      } else {
        wx.showModal({
          title: "云存储文件下载失败",
          content: "是否复制文件ID到剪贴板？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              copyToClipboard(downloadUrl);
            }
          },
        });
      }
    },
  });
}

// 内部：保存文件到本地并写入元数据
function _saveFileToLocal(options) {
  const {
    tempFilePath,
    fileName,
    originalDownloadUrl,
    trackType,
    platformType,
    onSuccess,
    onError,
  } = options;

  const fs = wx.getFileSystemManager();

  try {
    const tempFileStats = fs.statSync(tempFilePath);
    if (tempFileStats.size === 0) {
      const error = "临时文件大小为0字节，可能是云存储文件损坏或下载不完整";
      if (onError) onError(error);
      else {
        wx.showModal({
          title: "下载异常",
          content: error,
          showCancel: false,
          confirmText: "知道了",
        });
      }
      return;
    }
  } catch (statError) {
    const error = "无法获取临时文件信息，下载可能失败";
    if (onError) onError(error);
    else {
      wx.showModal({
        title: "下载异常",
        content: error,
        showCancel: false,
        confirmText: "知道了",
      });
    }
    return;
  }

  const uniqueFileId = `article_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  const savedFileName = `${uniqueFileId}.txt`;
  const savedFilePath = `${wx.env.USER_DATA_PATH}/downloads/${savedFileName}`;

  try {
    fs.mkdirSync(`${wx.env.USER_DATA_PATH}/downloads`, true);
  } catch (e) {}

  try {
    const originalContent = fs.readFileSync(tempFilePath, "utf8");
    fs.writeFileSync(savedFilePath, originalContent, "utf8");

    const metaFilePath = `${wx.env.USER_DATA_PATH}/downloads/${savedFileName}.meta.json`;
    const metaData = {
      originalTitle: fileName || "未知文章",
      trackType: trackType || "未知",
      platformType: platformType || "未知",
      downloadTime: Date.now(),
      originalFileId: originalDownloadUrl,
      fileSize: originalContent.length,
      fileType: "txt",
    };

    fs.writeFileSync(metaFilePath, JSON.stringify(metaData, null, 2));
    console.log("✅ 元数据文件已创建");

    try {
      const savedFileStats = fs.statSync(savedFilePath);
      if (savedFileStats.size === 0) {
        console.error("❌ 保存后的文件大小为0字节");
        const error = "文件保存后大小为0字节，可能存在文件系统问题";
        if (onError) onError(error);
        else {
          wx.showModal({
            title: "保存异常",
            content: error,
            showCancel: false,
            confirmText: "知道了",
          });
        }
        return;
      }
    } catch (verifyError) {
      console.error("❌ 验证保存文件失败:", verifyError);
    }

    console.log("✅ 文件保存成功");

    // 限制本地保存的文章数量为最多10个（按下载时间清理最早的）
    _enforceDownloadLimit(10);

    if (onSuccess) {
      onSuccess({ savedFilePath, fileName, fileSize: originalContent.length });
    } else {
      wx.showToast({
        title: "文件已下载到本地",
        icon: "success",
        duration: 2000,
      });
      setTimeout(() => {
        wx.showModal({
          title: "文件下载成功",
          content: "文件已下载到本地，是否跳转到排版工具页面查看？",
          success: (modalRes) => {
            if (modalRes.confirm) {
              navigateToLayoutTool();
            }
          },
        });
      }, 1000);
    }
  } catch (writeError) {
    console.error("❌ 文件保存失败:", writeError);
    const error = `文件保存失败: ${writeError.message || "未知错误"}`;
    if (onError) onError(error);
    else {
      wx.showModal({
        title: "下载失败",
        content: "无法保存到本地，是否复制文件ID到剪贴板？",
        success: (modalRes) => {
          if (modalRes.confirm) {
            copyToClipboard(originalDownloadUrl);
          }
        },
      });
    }
  }
}

/**
 * 清理孤立的文件（可复用的工具函数）
 * @param {string} dirPath 目录路径
 * @returns {number} 清理的孤立文件数量
 */
function cleanupOrphanedFiles(dirPath) {
  try {
    const fs = wx.getFileSystemManager();
    const files = fs.readdirSync(dirPath) || [];

    // 分离元数据文件和正文文件
    const metaFiles = files.filter((name) => /\.meta\.json$/.test(name));
    const articleFiles = files.filter(
      (name) => /\.txt$/.test(name) && !name.endsWith(".meta.json")
    );

    // 清理孤立文件：找出没有对应元数据的正文文件
    const orphanedArticles = [];
    articleFiles.forEach((articleFile) => {
      const expectedMetaFile = `${articleFile}.meta.json`;
      if (!metaFiles.includes(expectedMetaFile)) {
        orphanedArticles.push(articleFile);
      }
    });

    // 清理孤立文件：找出没有对应正文文件的元数据文件
    const orphanedMetas = [];
    metaFiles.forEach((metaFile) => {
      const expectedArticleFile = metaFile.replace(/\.meta\.json$/, "");
      if (!articleFiles.includes(expectedArticleFile)) {
        orphanedMetas.push(metaFile);
      }
    });

    // 删除所有孤立文件
    let orphanedCount = 0;

    // 删除孤立的正文文件
    orphanedArticles.forEach((fileName) => {
      const filePath = `${dirPath}/${fileName}`;
      const result = deleteArticleFilePair(filePath, { silent: true });
      if (result.articleDeleted) {
        orphanedCount++;
        console.log(`🗑️ 删除孤立正文文件: ${fileName}`);
      }
    });

    // 删除孤立的元数据文件
    orphanedMetas.forEach((fileName) => {
      const filePath = `${dirPath}/${fileName}`;
      try {
        fs.unlinkSync(filePath);
        orphanedCount++;
        console.log(`🗑️ 删除孤立元数据文件: ${fileName}`);
      } catch (e) {}
    });

    return orphanedCount;
  } catch (err) {
    console.warn("清理孤立文件失败: ", err);
    return 0;
  }
}

// 内部：限制本地下载文章的数量，超过上限则删除最早的
function _enforceDownloadLimit(maxCount) {
  try {
    const fs = wx.getFileSystemManager();
    const dirPath = `${wx.env.USER_DATA_PATH}/downloads`;

    // 若目录不存在则直接返回
    try {
      fs.accessSync(dirPath);
    } catch (e) {
      return;
    }

    // 静默清理孤立文件
    const orphanedCount = cleanupOrphanedFiles(dirPath);
    if (orphanedCount > 0) {
      console.log(`🔧 下载限制检查：自动清理了 ${orphanedCount} 个孤立文件`);
    }

    // 重新获取文件列表（清理孤立文件后）
    const files = fs.readdirSync(dirPath) || [];
    const metaFiles = files.filter((name) => /\.meta\.json$/.test(name));
    const articleFiles = files.filter(
      (name) => /\.txt$/.test(name) && !name.endsWith(".meta.json")
    );

    // 获取有效的文件对（排除孤立文件）
    const validMetaFiles = metaFiles.filter((metaFile) => {
      const articleFile = metaFile.replace(/\.meta\.json$/, "");
      return articleFiles.includes(articleFile);
    });

    if (validMetaFiles.length <= maxCount) return;

    const items = [];
    validMetaFiles.forEach((metaFileName) => {
      const metaPath = `${dirPath}/${metaFileName}`;
      const articlePath = metaPath.replace(/\.meta\.json$/, "");

      // 使用工具函数读取元数据
      const metadata = readArticleMetadata(metaPath);
      const downloadTime = metadata ? Number(metadata.downloadTime) || 0 : 0;

      items.push({ metaPath, articlePath, downloadTime });
    });

    // 按下载时间从早到晚排序
    items.sort((a, b) => a.downloadTime - b.downloadTime);

    const needRemove = items.length - maxCount;
    const articlePathsToDelete = items
      .slice(0, needRemove)
      .map((item) => item.articlePath);

    // 使用工具函数批量删除旧文章
    const deleteStats = deleteArticleFilePairs(articlePathsToDelete, {
      silent: false,
    });

    console.log(
      `📊 下载数量限制：已自动清理 ${deleteStats.success} 个旧文章，保留最新 ${maxCount} 个文件`
    );

    console.log(
      `📊 下载数量限制：已自动清理 ${needRemove} 个旧文章，保留最新 ${maxCount} 个文件`
    );
  } catch (err) {
    console.warn("清理本地文章数量失败: ", err);
  }
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

/**
 * 读取文章元数据文件
 * @param {string} filePath 文章文件路径
 * @returns {Object|null} 元数据对象，失败时返回null
 */
function readArticleMetadata(filePath) {
  try {
    const fs = wx.getFileSystemManager();
    const metaFilePath = `${filePath}.meta.json`;

    const metaContent = fs.readFileSync(metaFilePath, "utf8");
    const metadata = JSON.parse(metaContent);

    console.log("✅ 成功读取元数据:", metadata.originalTitle);
    return metadata;
  } catch (error) {
    console.log("ℹ️ 未找到元数据文件或读取失败:", filePath);
    return null;
  }
}

/**
 * 获取文章标题（优先从元数据，回退到文件名）
 * @param {string} filePath 文章文件路径
 * @returns {string} 文章标题
 */
function getArticleTitle(filePath) {
  const metadata = readArticleMetadata(filePath);
  if (metadata && metadata.originalTitle) {
    return metadata.originalTitle;
  }

  // 回退到文件名
  const fileName = filePath.split("/").pop();
  return fileName || "未知文章";
}

/**
 * 删除文章文件对（主文件 + 元数据）
 * @param {string} articlePath 文章文件路径
 * @param {Object} options 选项
 * @param {boolean} options.silent 是否静默删除（不输出日志）
 * @param {boolean} options.force 是否强制删除（忽略错误）
 * @returns {Object} 删除结果 { articleDeleted: boolean, metaDeleted: boolean }
 */
function deleteArticleFilePair(articlePath, options = {}) {
  const { silent = false, force = false } = options;
  const fs = wx.getFileSystemManager();
  const metaPath = `${articlePath}.meta.json`;

  let articleDeleted = false;
  let metaDeleted = false;

  try {
    // 删除主文件
    try {
      fs.unlinkSync(articlePath);
      articleDeleted = true;
      if (!silent) {
        console.log(`🗑️ 文章文件删除成功: ${articlePath.split("/").pop()}`);
      }
    } catch (error) {
      if (!silent) {
        console.error(`❌ 删除文章文件失败: ${articlePath}`, error);
      }
      if (!force) throw error;
    }

    // 删除元数据文件
    try {
      fs.unlinkSync(metaPath);
      metaDeleted = true;
      if (!silent) {
        console.log(`🗑️ 元数据文件删除成功: ${metaPath.split("/").pop()}`);
      }
    } catch (error) {
      if (!silent) {
        console.log(
          `ℹ️ 元数据文件不存在或删除失败: ${metaPath.split("/").pop()}`
        );
      }
      // 元数据删除失败不影响主流程
    }

    return { articleDeleted, metaDeleted };
  } catch (error) {
    if (!silent) {
      console.error("❌ 删除文件对失败:", error);
    }
    return { articleDeleted, metaDeleted };
  }
}

/**
 * 批量删除文章文件对
 * @param {Array<string>} articlePaths 文章文件路径数组
 * @param {Object} options 选项
 * @returns {Object} 删除统计 { total: number, success: number, failed: number }
 */
function deleteArticleFilePairs(articlePaths, options = {}) {
  const results = articlePaths.map((path) =>
    deleteArticleFilePair(path, options)
  );

  const total = results.length;
  const success = results.filter((r) => r.articleDeleted).length;
  const failed = total - success;

  return { total, success, failed };
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

module.exports = {
  checkCloudFileStatus,
  downloadArticle,
  copyToClipboard,
  navigateToLayoutTool,
  cleanupOrphanedFiles,
  readArticleMetadata,
  getArticleTitle,
  deleteArticleFilePair,
  deleteArticleFilePairs,
};
