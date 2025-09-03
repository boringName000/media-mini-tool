// 文章存储核心模块
// 提供底层的本地存储操作，不包含业务逻辑

const STORAGE_KEY = "article_info_list";
const MAX_ARTICLES = 10;

/**
 * 获取所有文章信息
 * @returns {Array} 文章信息数组
 */
function getArticleInfoList() {
  try {
    const data = wx.getStorageSync(STORAGE_KEY);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("获取文章信息失败:", error);
    return [];
  }
}

/**
 * 保存文章信息列表
 * @param {Array} articleList 文章信息数组
 */
function saveArticleInfoList(articleList) {
  try {
    wx.setStorageSync(STORAGE_KEY, articleList);
    console.log("✅ 文章信息保存成功，共", articleList.length, "条");
  } catch (error) {
    console.error("❌ 保存文章信息失败:", error);
  }
}

/**
 * 添加文章信息
 * @param {Object} articleInfo 文章信息对象
 * @param {string} articleInfo.title 文章标题
 * @param {string} articleInfo.articleId 文章ID
 * @param {number} articleInfo.trackType 赛道类型
 * @param {number} articleInfo.platformType 平台类型
 * @param {string} articleInfo.downloadUrl 下载URL
 * @returns {boolean} 是否添加成功
 */
function addArticleInfo(articleInfo) {
  try {
    const { title, articleId, trackType, platformType, downloadUrl } =
      articleInfo;

    if (!title || !downloadUrl || !articleId) {
      console.error("❌ 文章信息不完整:", articleInfo);
      return false;
    }

    const currentList = getArticleInfoList();

    // 创建新的文章信息对象，使用文章自己的ID作为主键
    const newArticle = {
      id: articleId, // 直接使用文章自己的ID作为主键
      title: title,
      trackType: trackType || 0,
      platformType: platformType || 0,
      downloadUrl: downloadUrl,
      downloadTime: Date.now(),
      createTime: Date.now(),
    };

    // 检查是否已存在相同ID的文章，如果存在则更新
    const existingIndex = currentList.findIndex(
      (article) => article.id === articleId
    );
    let newList;

    if (existingIndex !== -1) {
      // 更新已存在的文章信息
      newList = [...currentList];
      newList[existingIndex] = newArticle;
      console.log(`📝 更新已存在的文章信息: ${newArticle.title}`);
    } else {
      // 添加新文章到列表开头（最新的在前面）
      newList = [newArticle, ...currentList];
    }

    // 如果超过最大数量，删除最老的
    if (newList.length > MAX_ARTICLES) {
      const removedCount = newList.length - MAX_ARTICLES;
      newList.splice(-removedCount);
      console.log(`📊 文章数量限制：自动删除 ${removedCount} 个最老的文章信息`);
    }

    saveArticleInfoList(newList);
    console.log("✅ 文章信息保存成功:", newArticle.title);
    return true;
  } catch (error) {
    console.error("❌ 添加文章信息失败:", error);
    return false;
  }
}

/**
 * 删除文章信息
 * @param {string} articleId 文章ID
 * @returns {boolean} 是否删除成功
 */
function deleteArticleInfo(articleId) {
  try {
    const currentList = getArticleInfoList();
    const newList = currentList.filter((article) => article.id !== articleId);

    if (newList.length === currentList.length) {
      console.log("ℹ️ 未找到要删除的文章:", articleId);
      return false;
    }

    saveArticleInfoList(newList);
    console.log("✅ 文章信息删除成功:", articleId);
    return true;
  } catch (error) {
    console.error("❌ 删除文章信息失败:", error);
    return false;
  }
}

/**
 * 清空所有文章信息
 * @returns {boolean} 是否清空成功
 */
function clearAllArticleInfo() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
    console.log("✅ 所有文章信息已清空");
    return true;
  } catch (error) {
    console.error("❌ 清空文章信息失败:", error);
    return false;
  }
}

/**
 * 获取文章信息数量
 * @returns {number} 文章信息数量
 */
function getArticleInfoCount() {
  return getArticleInfoList().length;
}

/**
 * 检查是否达到最大数量限制
 * @returns {boolean} 是否达到最大数量
 */
function isMaxArticlesReached() {
  return getArticleInfoCount() >= MAX_ARTICLES;
}

module.exports = {
  getArticleInfoList,
  addArticleInfo,
  deleteArticleInfo,
  clearAllArticleInfo,
  getArticleInfoCount,
  isMaxArticlesReached,
  MAX_ARTICLES,
};
