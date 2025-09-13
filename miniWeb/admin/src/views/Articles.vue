shua<template>
  <div class="articles-page">
    <!-- 1. 页面标题 -->
    <div class="page-header">
      <h1>文章管理</h1>
      <p>管理待修改文章，查看文章统计信息</p>
    </div>

    <!-- 2. 数据纵览区域 -->
    <el-card class="overview-section" shadow="never">
      <template #header>
        <div class="section-header">
          <span>数据纵览</span>
          <div class="header-actions">
            <el-button 
              type="success" 
              :icon="Upload" 
              @click="handleUploadArticle"
            >
              上传文章
            </el-button>
            <el-button 
              type="primary" 
              :icon="Refresh" 
              @click="handleRefresh"
              :loading="loading"
            >
              刷新数据
            </el-button>
          </div>
        </div>
      </template>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="3" animated />
      </div>

      <div v-else class="overview-content">
        <!-- 基础统计卡片 -->
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ articleStats.totalCount }}</div>
                <div class="stat-label">文章总数</div>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon unused">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ articleStats.unusedCount }}</div>
                <div class="stat-label">未使用</div>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon used">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ articleStats.usedCount }}</div>
                <div class="stat-label">已使用</div>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon revision">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ articleStats.needRevisionCount }}</div>
                <div class="stat-label">待修改</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 平台赛道统计 -->
        <div v-if="articleStats.platformTrackStats && Object.keys(articleStats.platformTrackStats).length > 0" class="platform-track-stats">
          <h3>各平台赛道统计</h3>
          <div class="platform-list">
            <div 
              v-for="(trackStats, platformType) in articleStats.platformTrackStats" 
              :key="platformType"
              class="platform-group"
            >
              <!-- 平台标题 -->
              <div class="platform-header">
                <span class="platform-icon">{{ getPlatformIcon(platformType) }}</span>
                <span class="platform-name">{{ getPlatformName(platformType) }}</span>
              </div>
              
              <!-- 该平台下的赛道列表 -->
              <div class="track-list">
                <div 
                  v-for="(stats, trackType) in trackStats" 
                  :key="`${platformType}-${trackType}`"
                  class="track-item"
                >
                  <div class="track-header">
                    <span class="track-icon">{{ getTrackTypeIcon(trackType) }}</span>
                    <span class="track-name">{{ getTrackTypeName(trackType) }}</span>
                  </div>
                  <div class="track-stats">
                    <span class="stat unused">{{ stats.unusedCount || 0 }} 未用</span>
                    <span class="stat used">{{ stats.usedCount || 0 }} 已用</span>
                    <span class="stat revision">{{ stats.needRevisionCount || 0 }} 待改</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 3. 文章列表区域 -->
    <el-card class="article-list-section" shadow="never">
      <template #header>
        <div class="list-header">
          <span>待修改文章列表 ({{ (filteredArticles && filteredArticles.length) || 0 }}/{{ (needRevisionArticles && needRevisionArticles.length) || 0 }})</span>
          <div class="list-actions">
            <el-button 
              type="danger" 
              :disabled="!selectedArticles || selectedArticles.length === 0"
              @click="handleBatchDelete"
              class="danger-button-solid"
            >
              批量删除 ({{ (selectedArticles && selectedArticles.length) || 0 }})
            </el-button>
            <el-button 
              type="danger" 
              plain
              :disabled="!needRevisionArticles || needRevisionArticles.length === 0"
              @click="handleDeleteAll"
              class="danger-button-outline"
            >
              全部删除
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索过滤区域 -->
      <div class="search-filters">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="8" :md="8">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索文章标题或ID"
              clearable
              @input="handleSearch"
              @clear="handleSearch"
            />
          </el-col>
          <el-col :xs="12" :sm="8" :md="8">
            <el-select
              v-model="searchForm.platformType"
              placeholder="选择平台类型"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="option in platformOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              >
                <span v-if="option.icon" class="option-with-icon">
                  <span class="option-icon">{{ option.icon }}</span>
                  <span>{{ option.label }}</span>
                </span>
                <span v-else>{{ option.label }}</span>
              </el-option>
            </el-select>
          </el-col>
          <el-col :xs="12" :sm="8" :md="8">
            <el-select
              v-model="searchForm.trackType"
              placeholder="选择赛道类型"
              clearable
              @change="handleSearch"
            >
              <el-option
                v-for="option in trackTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              >
                <span v-if="option.icon" class="option-with-icon">
                  <span class="option-icon">{{ option.icon }}</span>
                  <span>{{ option.label }}</span>
                </span>
                <span v-else>{{ option.label }}</span>
              </el-option>
            </el-select>
          </el-col>
        </el-row>
      </div>

      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="!needRevisionArticles || needRevisionArticles.length === 0" class="empty-container">
        <el-empty description="暂无待修改文章" />
      </div>

      <div v-else-if="!filteredArticles || filteredArticles.length === 0" class="empty-container">
        <el-empty description="没有符合条件的文章" />
      </div>

      <div v-else class="article-list">
        <div class="select-all-container">
          <el-checkbox 
            v-model="selectAll"
            :indeterminate="isIndeterminate"
            @change="handleSelectAll"
          >
            全选当前页 ({{ (paginatedArticles && paginatedArticles.length) || 0 }})
          </el-checkbox>
        </div>

        <div class="article-items">
          <div 
            v-for="article in paginatedArticles" 
            :key="article.articleId"
            class="article-item"
            :class="{ selected: selectedArticles.includes(article.articleId) }"
          >
            <div class="article-checkbox">
              <el-checkbox 
                :model-value="selectedArticles.includes(article.articleId)"
                @change="(checked) => handleSelectArticle(article.articleId, checked)"
              />
            </div>
            
            <div class="article-info">
              <div class="article-header">
                <h4 class="article-title">{{ article.articleTitle }}</h4>
              </div>
              <div class="article-time">
                上传时间: {{ formatTime(article.uploadTime) }}
              </div>
            </div>

            <div class="article-right">
              <div class="article-meta">
                <el-tag size="small" type="info">
                  <span class="tag-with-icon">
                    <span class="tag-icon">{{ getPlatformIcon(article.platformType) }}</span>
                    <span>{{ getPlatformName(article.platformType) }}</span>
                  </span>
                </el-tag>
                <el-tag size="small">
                  <span class="tag-with-icon">
                    <span class="tag-icon">{{ getTrackTypeIcon(article.trackType) }}</span>
                    <span>{{ getTrackTypeName(article.trackType) }}</span>
                  </span>
                </el-tag>
                <span class="article-id">ID: {{ article.articleId || '未知' }}</span>
              </div>
              
              <div class="article-actions">
                <el-button size="small" @click="handleUpdateArticle(article)">
                  更新
                </el-button>
                <el-button size="small" type="primary" @click="handlePreviewArticle(article)">
                  预览
                </el-button>
                <el-button size="small" type="danger" @click="handleDeleteArticle(article)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页控件 -->
        <div v-if="filteredArticles && filteredArticles.length > pageSize" class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :small="false"
            :disabled="false"
            :background="true"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredArticles.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Document, Clock, Check, Warning, Upload, Refresh
} from '@element-plus/icons-vue'
import { callAdminCloudFunction } from '@/utils/cloudbase'
import { articlesStore } from '@/store'
import { 
  getPlatformName, 
  getPlatformIcon, 
  getPlatformOptions 
} from '@/utils/platformUtils'
import { 
  getTrackTypeName, 
  getTrackTypeIcon, 
  getTrackTypeOptions 
} from '@/utils/trackTypeUtils'
import { formatTime } from '@/utils/timeUtils'

// 响应式数据
const loading = ref(false)
const articleStats = ref({
  totalCount: 0,
  unusedCount: 0,
  usedCount: 0,
  needRevisionCount: 0,
  platformTrackStats: {}
})
const needRevisionArticles = ref([])
const selectedArticles = ref([])

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(20)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  platformType: '',
  trackType: ''
})

// 平台和赛道选项 - 添加安全检查
let platformOptions = []
let trackTypeOptions = []

try {
  platformOptions = getPlatformOptions() || []
  trackTypeOptions = getTrackTypeOptions() || []
} catch (error) {
  console.error('获取平台或赛道选项失败:', error)
  platformOptions = [{ value: '', label: '全部平台' }]
  trackTypeOptions = [{ value: '', label: '全部赛道' }]
}



// 过滤后的文章列表
const filteredArticles = computed(() => {
  try {
    let filtered = Array.isArray(needRevisionArticles.value) ? needRevisionArticles.value : []

    // 关键词搜索（文章标题或ID）
    if (searchForm.keyword && searchForm.keyword.trim()) {
      const keyword = searchForm.keyword.trim().toLowerCase()
      filtered = filtered.filter(article => {
        if (!article) return false
        const title = article.articleTitle || ''
        const id = article.articleId || ''
        return title.toLowerCase().includes(keyword) || id.toLowerCase().includes(keyword)
      })
    }

    // 平台类型过滤
    if (searchForm.platformType) {
      filtered = filtered.filter(article => 
        article && article.platformType === searchForm.platformType
      )
    }

    // 赛道类型过滤
    if (searchForm.trackType) {
      filtered = filtered.filter(article => 
        article && article.trackType === searchForm.trackType
      )
    }

    return filtered
  } catch (error) {
    console.error('过滤文章列表时出错:', error)
    return []
  }
})

// 分页后的文章列表
const paginatedArticles = computed(() => {
  try {
    const filtered = filteredArticles.value || []
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filtered.slice(start, end)
  } catch (error) {
    console.error('分页处理时出错:', error)
    return []
  }
})

// 全选状态计算
const selectAll = computed({
  get() {
    try {
      const paginated = paginatedArticles.value || []
      const selected = selectedArticles.value || []
      return paginated.length > 0 && paginated.every(article => selected.includes(article.articleId))
    } catch (error) {
      console.error('计算全选状态时出错:', error)
      return false
    }
  },
  set(value) {
    try {
      if (value) {
        const paginatedIds = (paginatedArticles.value || []).map(article => article.articleId).filter(Boolean)
        const currentSelected = selectedArticles.value || []
        // 合并当前页的ID到已选择的列表中
        const newSelected = [...new Set([...currentSelected, ...paginatedIds])]
        selectedArticles.value = newSelected
      } else {
        const paginatedIds = (paginatedArticles.value || []).map(article => article.articleId).filter(Boolean)
        selectedArticles.value = (selectedArticles.value || []).filter(id => !paginatedIds.includes(id))
      }
    } catch (error) {
      console.error('设置全选状态时出错:', error)
      selectedArticles.value = []
    }
  }
})

const isIndeterminate = computed(() => {
  try {
    const paginated = paginatedArticles.value || []
    const selected = selectedArticles.value || []
    const paginatedSelected = paginated.filter(article => selected.includes(article.articleId))
    return paginatedSelected.length > 0 && paginatedSelected.length < paginated.length
  } catch (error) {
    console.error('计算半选状态时出错:', error)
    return false
  }
})



// 加载文章数据
const loadArticleData = async (forceRefresh = false) => {
  try {
    loading.value = true
    
    // 检查缓存
    if (!forceRefresh && articlesStore.hasData() && articlesStore.isDataValid()) {
      const cachedData = articlesStore.getData()
      if (cachedData) {
        articleStats.value = cachedData.articleStats || articleStats.value
        needRevisionArticles.value = cachedData.needRevisionArticles || []
        console.log('使用缓存的文章数据')
        return
      }
    }
    
    console.log('调用 admin-article-info 云函数获取文章统计数据')
    
    // 调用云函数获取数据
    const cloudResult = await callAdminCloudFunction('admin-article-info', {})
    
    // 检查云函数返回结果
    console.log('云函数返回结果:', cloudResult)
    
    if (cloudResult && cloudResult.result && cloudResult.result.success && cloudResult.result.data) {
      const data = cloudResult.result.data
      
      // 更新统计数据
      articleStats.value = {
        totalCount: data.totalCount || 0,
        unusedCount: data.unusedCount || 0,
        usedCount: data.usedCount || 0,
        needRevisionCount: data.needRevisionCount || 0,
        platformTrackStats: data.platformTrackStats || {}
      }
      
      // 更新待修改文章列表
      needRevisionArticles.value = data.needRevisionArticles || []
      
      // 缓存数据
      articlesStore.setData({
        articleStats: articleStats.value,
        needRevisionArticles: needRevisionArticles.value
      })
      
      console.log('文章数据加载成功:', {
        totalCount: articleStats.value.totalCount,
        needRevisionCount: articleStats.value.needRevisionCount,
        needRevisionArticlesLength: needRevisionArticles.value.length
      })
    } else {
      throw new Error(cloudResult.result?.message || '获取文章数据失败')
    }
  } catch (error) {
    console.error('加载文章数据失败:', error)
    ElMessage.error(`加载文章数据失败: ${error.message}`)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  try {
    // 搜索时清空选择并重置到第一页
    selectedArticles.value = []
    currentPage.value = 1
  } catch (error) {
    console.error('处理搜索时出错:', error)
  }
}

// 分页事件处理
const handleSizeChange = (newSize) => {
  try {
    pageSize.value = newSize
    currentPage.value = 1
    selectedArticles.value = []
  } catch (error) {
    console.error('分页大小变更时出错:', error)
  }
}

const handleCurrentChange = (newPage) => {
  try {
    currentPage.value = newPage
    // 注意：切换页面时不清空选择，保持跨页选择功能
  } catch (error) {
    console.error('分页变更时出错:', error)
  }
}

// 刷新数据
const handleRefresh = () => {
  try {
    loadArticleData(true)
  } catch (error) {
    console.error('刷新数据时出错:', error)
  }
}

// 选择文章
const handleSelectArticle = (articleId, checked) => {
  try {
    if (!articleId) return
    
    if (checked) {
      if (!selectedArticles.value.includes(articleId)) {
        selectedArticles.value.push(articleId)
      }
    } else {
      selectedArticles.value = selectedArticles.value.filter(id => id !== articleId)
    }
  } catch (error) {
    console.error('选择文章时出错:', error)
  }
}

// 全选处理
const handleSelectAll = (checked) => {
  try {
    selectAll.value = checked
  } catch (error) {
    console.error('全选处理时出错:', error)
  }
}

// 批量删除
const handleBatchDelete = () => {
  ElMessage.info(`批量删除功能开发中，选中 ${selectedArticles.value.length} 篇文章`)
}

// 全部删除
const handleDeleteAll = () => {
  ElMessage.info(`全部删除功能开发中，共 ${needRevisionArticles.value.length} 篇待修改文章`)
}

// 更新文章
const handleUpdateArticle = (article) => {
  ElMessage.info(`更新文章功能开发中: ${article.articleTitle}`)
}

// 预览文章
const handlePreviewArticle = (article) => {
  if (article.downloadUrl) {
    window.open(article.downloadUrl, '_blank')
  } else {
    ElMessage.warning('该文章暂无预览链接')
  }
}

// 删除文章
const handleDeleteArticle = (article) => {
  ElMessage.info(`删除文章功能开发中: ${article.articleTitle}`)
}

// 上传文章
const handleUploadArticle = () => {
  ElMessage.info('上传文章功能开发中')
}

// 组件挂载时加载数据
onMounted(() => {
  loadArticleData()
})
</script>

<style lang="scss" scoped>
/* 危险按钮样式优化 - 提高对比度 */
.danger-button-solid {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
  color: #ffffff !important;
  font-weight: 600 !important;

  &:hover {
    background-color: #b91c1c !important;
    border-color: #b91c1c !important;
  }
}

.danger-button-outline {
  background-color: #ffffff !important;
  border-color: #dc2626 !important;
  color: #dc2626 !important;
  font-weight: 600 !important;
  border-width: 2px !important;

  &:hover {
    background-color: #fef2f2 !important;
    border-color: #b91c1c !important;
    color: #b91c1c !important;
  }
}

.articles-page {
  .page-header {
    margin-bottom: 24px;
    
    h1 {
      margin: 0 0 8px 0;
      color: #303133;
    }
    
    p {
      margin: 0;
      color: #909399;
    }
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .overview-section {
    margin-bottom: 24px;

    .loading-container {
      padding: 20px;
    }

    .overview-content {
      .stat-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 24px;

        .stat-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 120px;

          .stat-content {
            display: flex;
            align-items: center;
            gap: 16px;
            width: 100%;
            justify-content: center;

            .stat-icon {
              width: 48px;
              height: 48px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #409eff;
              color: white;
              flex-shrink: 0;

              &.unused {
                background: #e6a23c;
              }

              &.used {
                background: #67c23a;
              }

              &.revision {
                background: #f56c6c;
              }
            }

            .stat-info {
              text-align: center;
              
              .stat-number {
                font-size: 28px;
                font-weight: bold;
                color: #303133;
                line-height: 1;
              }

              .stat-label {
                font-size: 14px;
                color: #909399;
                margin-top: 4px;
              }
            }
          }
        }
      }

      .platform-track-stats {
        h3 {
          margin: 0 0 20px 0;
          color: #303133;
        }

        .platform-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;

          .platform-group {
            background: #ffffff;
            border: 1px solid #ebeef5;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;

            &:hover {
              border-color: #409eff;
              box-shadow: 0 4px 12px rgba(64, 158, 255, 0.12);
              transform: translateY(-2px);
            }

            .platform-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 16px;
              padding-bottom: 12px;
              border-bottom: 2px solid #f5f7fa;
              font-weight: 600;
              color: #303133;
              font-size: 16px;

              .platform-icon {
                font-size: 20px;
              }
            }

            .track-list {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              margin-top: 4px;

              .track-item {
                display: flex;
                flex-direction: column;
                background: #ffffff;
                border: 1px solid #e4e7ed;
                border-radius: 8px;
                padding: 12px;
                min-width: 140px;
                max-width: 180px;
                flex: 0 0 auto;
                transition: all 0.2s ease;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

                &:hover {
                  border-color: #409eff;
                  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
                  transform: translateY(-1px);
                }

                .track-header {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 6px;
                  margin-bottom: 8px;
                  font-size: 13px;
                  color: #606266;
                  font-weight: 500;
                  text-align: center;

                  .track-icon {
                    font-size: 14px;
                    flex-shrink: 0;
                  }

                  .track-name {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }
                }

                .track-stats {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                  font-size: 11px;

                  .stat {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 4px 6px;
                    border-radius: 10px;
                    font-weight: 500;
                    text-align: center;
                    min-height: 22px;
                    white-space: nowrap;

                    &.unused {
                      background: #fdf6ec;
                      color: #e6a23c;
                      border: 1px solid #f5dab1;
                    }

                    &.used {
                      background: #f0f9ff;
                      color: #67c23a;
                      border: 1px solid #bae6fd;
                    }

                    &.revision {
                      background: #fef2f2;
                      color: #f56c6c;
                      border: 1px solid #fecaca;
                    }
                  }
                }
              }
            }
          }
        }

        // 响应式布局优化
        @media (min-width: 1200px) {
          .platform-list {
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 24px;
          }
        }

        @media (max-width: 768px) {
          .platform-list {
            grid-template-columns: 1fr;
            gap: 16px;

            .platform-group {
              padding: 16px;

              .platform-header {
                font-size: 15px;
                margin-bottom: 12px;

                .platform-icon {
                  font-size: 18px;
                }
              }

              .track-list {
                gap: 8px;

                .track-item {
                  min-width: 120px;
                  max-width: 140px;
                  padding: 10px;

                  .track-header {
                    font-size: 12px;
                    margin-bottom: 6px;

                    .track-icon {
                      font-size: 13px;
                    }
                  }

                  .track-stats {
                    gap: 3px;

                    .stat {
                      font-size: 10px;
                      padding: 3px 4px;
                      min-height: 20px;
                      white-space: nowrap;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .article-list-section {
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;

      .list-actions {
        display: flex;
        gap: 12px;
      }
    }

    .search-filters {
      margin-bottom: 20px;

      .option-with-icon {
        display: flex;
        align-items: center;
        gap: 6px;

        .option-icon {
          font-size: 14px;
        }
      }
    }

    .loading-container, .empty-container {
      padding: 40px 20px;
      text-align: center;
    }

    .article-list {
      .select-all-container {
        margin-bottom: 16px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 4px;
      }

      .article-items {
        .article-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 1px solid #ebeef5;
          border-radius: 8px;
          margin-bottom: 12px;
          transition: all 0.3s;
          min-height: 80px;

          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
          }

          &.selected {
            background: #f0f9ff;
            border-color: #409eff;
          }

          .article-checkbox {
            align-self: center;
          }

          .article-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;

            .article-header {
              margin-bottom: 8px;

              .article-title {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #303133;
                max-width: 400px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }

            .article-time {
              font-size: 14px;
              color: #909399;
            }
          }

          .article-right {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-shrink: 0;

            .article-meta {
              display: flex;
              align-items: center;
              gap: 8px;

              .tag-with-icon {
                display: flex;
                align-items: center;
                gap: 4px;

                .tag-icon {
                  font-size: 12px;
                }
              }

              .article-id {
                font-size: 12px;
                color: #909399;
                white-space: nowrap;
              }
            }

            .article-actions {
              display: flex;
              gap: 8px;
              align-items: center;
            }
          }
        }
      }

      .pagination-container {
        margin-top: 24px;
        display: flex;
        justify-content: center;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .articles-page {
    .overview-section {
      .stat-card .stat-content .stat-number {
        font-size: 24px;
      }
    }
    
    .article-list-section .article-items .article-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      
      .article-info .article-header .article-title {
        max-width: none;
      }
      
      .article-right {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        width: 100%;
        
        .article-meta {
          flex-wrap: wrap;
        }
        
        .article-actions {
          width: 100%;
          justify-content: flex-start;
        }
      }
    }
  }
}
</style>