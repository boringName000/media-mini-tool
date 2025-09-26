<template>
  <el-dialog
    v-model="visible"
    title="文章查询"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8" :md="6">
            <el-form-item label="搜索类型">
              <el-select v-model="searchForm.type" placeholder="搜索类型" style="width: 120px;">
                <el-option label="文章ID" value="articleId" />
                <el-option label="文章标题" value="articleTitle" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="搜索关键词">
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="请输入搜索关键词" 
                style="width: 300px;"
                @keyup.enter="handleSearch"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="4" :md="6">
            <el-form-item>
              <el-button type="primary" @click="handleSearch" :loading="searchLoading">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 搜索结果区域 -->
    <div v-if="searchResultData && searchResultData.articles && searchResultData.articles.length > 0" class="article-results-container">
      <el-card class="results-info" shadow="never">
        <template #header>
          <div class="card-header">
            <span>搜索结果 ({{ searchResultData.count }})</span>
            <div class="search-info">
              <el-tag size="small" type="info">
                {{ searchResultData.queryType === 'articleId' ? '文章ID' : '文章标题' }}: {{ searchResultData.queryValue }}
              </el-tag>
            </div>
          </div>
        </template>
        
        <!-- 文章列表 -->
        <div class="article-list">
          <div 
            v-for="article in paginatedArticles" 
            :key="article.articleId"
            class="article-item"
          >
            <div class="article-info">
              <div class="article-header">
                <h4 class="article-title">{{ article.articleTitle }}</h4>
                <div class="article-id">ID: {{ article.articleId }}</div>
              </div>
              <div class="article-details">
                <el-descriptions :column="2" size="small" border>
                  <el-descriptions-item label="上传时间">
                    {{ formatTime(article.uploadTime, 'YYYY-MM-DD HH:mm:ss') }}
                  </el-descriptions-item>
                  <el-descriptions-item label="文章状态">
                    <el-tag :type="getStatusTagType(article.status)" size="small">
                      {{ getStatusText(article.status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="赛道类型">
                    <span class="tag-with-icon">
                      <span class="tag-icon">{{ getTrackTypeIcon(article.trackType) }}</span>
                      <span>{{ getTrackTypeName(article.trackType) }}</span>
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item label="平台类型">
                    <span class="tag-with-icon">
                      <span class="tag-icon">{{ getPlatformIcon(article.platformType) }}</span>
                      <span>{{ getPlatformName(article.platformType) }}</span>
                    </span>
                  </el-descriptions-item>
                  <el-descriptions-item label="下载地址" :span="2">
                    <el-tooltip 
                      :content="article.downloadUrl" 
                      placement="top" 
                      :disabled="!article.downloadUrl || article.downloadUrl.length <= 50"
                    >
                      <el-text class="download-url" truncated>{{ article.downloadUrl }}</el-text>
                    </el-tooltip>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
            
            <div class="article-actions">
              <el-button 
                size="small" 
                type="primary" 
                @click="handleDownloadArticle(article)"
                :loading="article.downloading"
              >
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click="handleDeleteArticle(article)"
                :loading="article.deleting"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 分页组件 -->
        <div v-if="searchResultData.count > pageSize" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[5, 10, 20, 50]"
            :small="false"
            :disabled="false"
            :background="true"
            layout="total, sizes, prev, pager, next, jumper"
            :total="searchResultData.count"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="hasSearched && (!searchResultData || !searchResultData.articles || searchResultData.articles.length === 0)" description="未找到匹配的文章" />

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Download, Delete } from '@element-plus/icons-vue'
import { adminCloudFunctions } from '@/utils/cloudbase'
import { formatTime } from '@/utils/timeUtils'
import { getPlatformName, getPlatformIcon } from '@/utils/platformUtils'
import { getTrackTypeName, getTrackTypeIcon } from '@/utils/trackTypeUtils'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'refresh-data'])

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchLoading = ref(false)
const hasSearched = ref(false)
const searchResultData = ref(null)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive({
  type: 'articleTitle',
  keyword: ''
})

// 搜索文章
const handleSearch = async () => {
  if (!searchForm.keyword.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  try {
    searchLoading.value = true
    hasSearched.value = true
    
    const params = {
      [searchForm.type]: searchForm.keyword.trim()
    }
    
    const result = await adminCloudFunctions.getArticleInfoByQuery(params)
    
    if (result?.result?.success && result.result.data) {
      searchResultData.value = result.result.data
      // 重置分页到第一页
      currentPage.value = 1
      if (result.result.data.count > 0) {
        ElMessage.success(`找到 ${result.result.data.count} 篇文章`)
      } else {
        ElMessage.info('未找到匹配的文章')
      }
    } else {
      searchResultData.value = { count: 0, articles: [] }
      currentPage.value = 1
      ElMessage.warning('未找到匹配的文章')
    }
  } catch (error) {
    console.error('搜索文章失败:', error)
    ElMessage.error('搜索文章失败')
    searchResultData.value = { count: 0, articles: [] }
  } finally {
    searchLoading.value = false
  }
}

// 分页数据计算
const paginatedArticles = computed(() => {
  if (!searchResultData.value || !searchResultData.value.articles) {
    return []
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return searchResultData.value.articles.slice(start, end)
})

// 分页大小改变
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

// 当前页改变
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.type = 'articleTitle'
  searchResultData.value = null
  hasSearched.value = false
  currentPage.value = 1
  pageSize.value = 10
}

// 关闭面板
const handleClose = () => {
  visible.value = false
  handleReset()
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    1: '未使用',
    2: '已使用',
    3: '待修改'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    1: 'warning',  // 未使用 - 橙色
    2: 'success',  // 已使用 - 绿色
    3: 'danger'    // 待修改 - 红色
  }
  return typeMap[status] || 'info'
}

// 下载文章
const handleDownloadArticle = async (article) => {
  article.downloading = true
  
  const loadingInstance = ElMessage({
    message: `正在获取文章 "${article.articleTitle}" 的内容...`,
    type: 'info',
    duration: 0,
    showClose: false
  })

  try {
    const result = await adminCloudFunctions.downloadArticle([article.articleId])

    loadingInstance.close()

    if (result.result && result.result.success) {
      const data = result.result.data
      const { results } = data

      if (results && results.length > 0) {
        const articleResult = results[0]
        if (articleResult.downloadSuccess && articleResult.fileContent) {
          try {
            // 使用ArrayBuffer创建文件下载
            downloadFileFromBuffer(
              articleResult.fileContent,
              `${article.articleTitle}.html`
            )
            ElMessage.success(`文章 "${article.articleTitle}" 下载成功`)
          } catch (downloadError) {
            console.error('文件下载失败:', downloadError)
            ElMessage.error(`下载文章失败: ${downloadError.message}`)
          }
        } else {
          ElMessage.error(`获取文章内容失败: ${articleResult.downloadError || '未知错误'}`)
        }
      } else {
        ElMessage.error('文章不存在或已被删除')
      }
    } else {
      throw new Error(result.result?.message || '获取文章内容失败')
    }
  } catch (error) {
    loadingInstance.close()
    console.error('下载文章失败:', error)
    ElMessage.error(`下载文章失败: ${error.message}`)
  } finally {
    article.downloading = false
  }
}

// 删除文章
const handleDeleteArticle = async (article) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文章 "${article.articleTitle}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    article.deleting = true

    const loadingInstance = ElMessage({
      message: `正在删除文章 "${article.articleTitle}"，请稍候...`,
      type: 'info',
      duration: 0,
      showClose: false
    })

    try {
      const result = await adminCloudFunctions.deleteArticle([article.articleId])

      loadingInstance.close()

      if (result.result && result.result.success) {
        const data = result.result.data
        const { fullyDeletedCount, partiallyDeletedCount, failedCount, notFoundCount } = data

        if (fullyDeletedCount > 0) {
          ElMessage.success(`文章 "${article.articleTitle}" 删除成功`)
          // 从搜索结果中移除该文章
          if (searchResultData.value && searchResultData.value.articles) {
            const index = searchResultData.value.articles.findIndex(a => a.articleId === article.articleId)
            if (index !== -1) {
              searchResultData.value.articles.splice(index, 1)
              searchResultData.value.count--
              
              // 检查当前页是否还有数据，如果没有则回到上一页
              const totalPages = Math.ceil(searchResultData.value.count / pageSize.value)
              if (currentPage.value > totalPages && totalPages > 0) {
                currentPage.value = totalPages
              }
            }
          }
          // 通知父组件刷新数据
          emit('refresh-data')
        } else if (partiallyDeletedCount > 0) {
          ElMessage.warning(`文章 "${article.articleTitle}" 部分删除成功（云存储删除失败）`)
        } else if (failedCount > 0) {
          ElMessage.error(`文章 "${article.articleTitle}" 删除失败`)
        } else if (notFoundCount > 0) {
          ElMessage.warning(`文章 "${article.articleTitle}" 未找到`)
        }
      } else {
        throw new Error(result.result?.message || '删除失败')
      }
    } catch (error) {
      loadingInstance.close()
      console.error('删除文章失败:', error)
      ElMessage.error(`删除文章失败: ${error.message}`)
    }
  } catch {
    // 用户取消删除
  } finally {
    article.deleting = false
  }
}

// 文件下载工具函数
const downloadFileFromBuffer = (fileContent, fileName) => {
  try {
    // 将数组转换为 Uint8Array
    const uint8Array = new Uint8Array(fileContent)
    
    // 创建 Blob
    const blob = new Blob([uint8Array], { type: 'text/html' })
    
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('文件下载失败:', error)
    throw new Error('文件下载失败')
  }
}
</script>

<style scoped>
.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin: 0;
}

.article-results-container {
  max-height: 70vh;
  overflow-y: auto;
}

.results-info .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.search-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
}

.article-list {
  .article-item {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    padding: 20px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    margin-bottom: 16px;
    transition: all 0.3s;
    background: #ffffff;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
    }

    .article-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .article-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;

        .article-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          flex: 1;
          word-break: break-all;
        }

        .article-id {
          font-size: 12px;
          color: #909399;
          white-space: nowrap;
          background: #f5f7fa;
          padding: 4px 8px;
          border-radius: 4px;
        }
      }

      .article-details {
        .tag-with-icon {
          display: flex;
          align-items: center;
          gap: 4px;

          .tag-icon {
            font-size: 14px;
          }
        }

        .download-url {
          font-size: 12px;
          color: #606266;
          max-width: 400px;
          cursor: pointer;
          
          &:hover {
            color: #409eff;
          }
        }
      }
    }

    .article-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      flex-shrink: 0;
      width: 80px;

      .el-button {
        width: 76px;
        height: 28px;
        padding: 0 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        
        .el-icon {
          margin-right: 3px;
          font-size: 12px;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-descriptions) {
  margin-bottom: 0;
}

:deep(.el-descriptions__body) {
  background: #fafafa;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-descriptions__content) {
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .article-list .article-item {
    flex-direction: column;
    gap: 16px;

    .article-info .article-header {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;

      .article-id {
        align-self: flex-start;
      }
    }

    .article-actions {
      flex-direction: row;
      width: 100%;
      min-width: auto;

      .el-button {
        flex: 1;
      }
    }
  }

  .search-form .el-row .el-col {
    margin-bottom: 12px;
  }
}
</style>