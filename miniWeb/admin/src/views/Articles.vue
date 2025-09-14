<template>
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

    <!-- 文章上传面板 -->
    <el-dialog
      v-model="uploadDialog.visible"
      title="批量上传文章"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :before-close="handleBeforeCloseUpload"
      class="upload-dialog"
    >
      <div class="upload-panel">
        <!-- 左侧：文件列表区域 -->
        <div class="file-list-area">
          <div class="area-header">
            <span>待上传文件</span>
            <span class="file-count">({{ uploadFiles.length }} 个文件)</span>
          </div>
          <div class="file-drop-zone" 
               :class="{ 'drag-over': dragOver }"
               @drop="handleFileDrop"
               @dragover.prevent="handleDragOver"
               @dragleave="handleDragLeave"
               @dragenter.prevent>
            <div v-if="uploadFiles.length === 0" class="drop-placeholder">
              <el-icon class="drop-icon"><Upload /></el-icon>
              <p>拖拽文件到此处</p>
              <p class="drop-hint">仅支持 .html 文件</p>
            </div>
            
            <!-- 文件列表 -->
            <div v-else class="file-list">
              <div v-for="(file, index) in uploadFiles" 
                   :key="index" 
                   class="file-item"
                   :class="{ 
                     'success': file.status === 'success',
                     'error': file.status === 'error',
                     'uploading': file.status === 'uploading'
                   }">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
                <div class="file-actions">
                  <el-icon v-if="file.status === 'success'" class="status-icon success">
                    <Check />
                  </el-icon>
                  <el-icon v-else-if="file.status === 'error'" class="status-icon error">
                    <Close />
                  </el-icon>
                  <el-icon v-else-if="file.status === 'uploading'" class="status-icon uploading">
                    <Loading />
                  </el-icon>
                  <el-button 
                    v-else
                    type="danger" 
                    size="small" 
                    text
                    class="remove-btn"
                    @click="removeFile(index)"
                  >
                    移除
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮区域 -->
        <div class="action-area">
          <div class="action-buttons">
            <el-button 
              type="primary" 
              :icon="FolderOpened"
              @click="selectFiles"
              :disabled="uploading"
            >
              选择文件
            </el-button>
            
            <el-button 
              type="warning" 
              :icon="Warning"
              @click="validateFiles"
              :disabled="uploadFiles.length === 0 || uploading"
            >
              验证文件
            </el-button>
            
            <el-button 
              type="success" 
              :icon="Upload"
              @click="confirmUpload"
              :disabled="uploadFiles.length === 0 || uploading"
              :loading="uploading"
            >
              确认上传
            </el-button>
          </div>

          <!-- 赛道和平台选择 -->
          <div class="upload-config">
            <el-form :model="uploadConfig" label-width="80px" size="small">
              <el-form-item label="赛道类型" required>
                <el-select 
                  v-model="uploadConfig.trackType" 
                  placeholder="选择赛道"
                  :disabled="uploading"
                >
                  <el-option
                    v-for="option in trackTypeOptions.filter(opt => opt.value !== '')"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="平台类型" required>
                <el-select 
                  v-model="uploadConfig.platformType" 
                  placeholder="选择平台"
                  :disabled="uploading"
                >
                  <el-option
                    v-for="option in platformOptions.filter(opt => opt.value !== '')"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>

      <!-- 上传进度条 -->
      <div v-if="uploading || uploadProgress.total > 0" class="upload-progress">
        <div class="progress-info">
          <span>上传进度: {{ uploadProgress.completed }}/{{ uploadProgress.total }}</span>
          <span v-if="uploadProgress.current">当前: {{ uploadProgress.current }}</span>
        </div>
        <el-progress 
          :percentage="uploadProgressPercentage" 
          :status="uploadProgress.completed === uploadProgress.total ? 'success' : ''"
        />
      </div>

      <!-- 底部状态区域 -->
      <div class="upload-status">
        <!-- 左侧：文件状态列表 -->
        <div class="status-list">
          <div class="status-header">
            <span>文件上传状态</span>
            <span class="file-count">({{ sortedUploadStatusFiles.length }} 个文件)</span>
          </div>
          <div class="status-items">
            <div v-for="(file, index) in sortedUploadStatusFiles" 
                 :key="index" 
                 class="status-item"
                 :class="file.status">
              <span class="status-filename">{{ file.name }}</span>
              <span class="status-result">
                <el-tag v-if="file.status === 'success'" type="success" size="small">成功</el-tag>
                <el-tag v-else-if="file.status === 'error'" type="danger" size="small">失败</el-tag>
                <el-tag v-else-if="file.status === 'uploading'" type="warning" size="small">上传中</el-tag>
                <el-tag v-else type="info" size="small">待上传</el-tag>
              </span>
              <span v-if="file.error" class="status-error">{{ file.error }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧：操作按钮 -->
        <div class="retry-area">
          <el-button 
            type="warning" 
            :icon="RefreshRight"
            @click="retryFailedFiles"
            :disabled="!hasFailedFiles || uploading"
          >
            重试上传
          </el-button>
          <el-button 
            type="danger" 
            :icon="Delete"
            @click="clearCache"
            :disabled="uploading"
            plain
            class="clear-cache-button"
          >
            清除缓存
          </el-button>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeUploadDialog" :disabled="uploading">
            {{ uploading ? '上传中...' : '关闭' }}
          </el-button>
          <el-button type="primary" @click="clearAllFiles" :disabled="uploading">
            清空文件
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 隐藏的文件选择器 -->
    <input 
      ref="fileInput" 
      type="file" 
      multiple 
      accept=".html"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Document, Clock, Check, Warning, Upload, Refresh,
  FolderOpened, Close, Loading, Tickets, RefreshRight
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

// ==================== 文章上传功能 ====================

// 上传对话框状态
const uploadDialog = ref({
  visible: false
})

// 上传文件列表
const uploadFiles = ref([])
// 上传状态文件列表
const uploadStatusFiles = ref([])

// 拖拽状态
const dragOver = ref(false)

// 上传状态
const uploading = ref(false)

// 上传进度
const uploadProgress = ref({
  total: 0,
  completed: 0,
  current: ''
})

// 上传配置
const uploadConfig = ref({
  trackType: null,
  platformType: null
})

// 文件选择器引用
const fileInput = ref(null)

// 上传文章 - 打开上传面板
const handleUploadArticle = () => {
  uploadDialog.value.visible = true
  // 重置状态
  uploadFiles.value = []
  uploadProgress.value = { total: 0, completed: 0, current: '' }
  uploading.value = false
}

// 关闭上传对话框前的确认
const handleBeforeCloseUpload = (done) => {
  if (uploading.value) {
    ElMessageBox.confirm(
      '文件正在上传中，确定要关闭吗？关闭后上传将被中断。',
      '确认关闭',
      {
        confirmButtonText: '确定关闭',
        cancelButtonText: '继续上传',
        type: 'warning'
      }
    ).then(() => {
      uploading.value = false
      done()
    }).catch(() => {
      // 用户选择继续上传
    })
  } else {
    done()
  }
}

// 关闭上传对话框
const closeUploadDialog = () => {
  if (uploading.value) {
    ElMessage.warning('正在上传中，请等待完成')
    return
  }
  uploadDialog.value.visible = false
}

// 文件拖拽处理
const handleDragOver = (e) => {
  e.preventDefault()
  dragOver.value = true
}

const handleDragLeave = () => {
  dragOver.value = false
}

const handleFileDrop = (e) => {
  e.preventDefault()
  dragOver.value = false
  
  const files = Array.from(e.dataTransfer.files)
  addFiles(files)
}

// 选择文件
const selectFiles = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files)
  addFiles(files)
  // 清空input，允许重复选择同一文件
  e.target.value = ''
}

// 添加文件到列表
const addFiles = (files) => {
  const validFiles = files.filter(file => {
    const fileName = file.name.toLowerCase()
    const isValid = fileName.endsWith('.html')
    
    if (!isValid) {
      ElMessage.warning(`文件 ${file.name} 格式不支持，仅支持 .html 文件`)
      return false
    }
    
    // 检查是否已存在于待上传列表中
    const exists = uploadFiles.value.some(f => f.name === file.name && f.size === file.size)
    if (exists) {
      ElMessage.warning(`文件 ${file.name} 已存在于待上传列表中`)
      return false
    }
    
    return true
  })
  
  const newFiles = validFiles.map(file => ({
    file: file,
    name: file.name,
    size: file.size,
    status: 'pending', // pending, uploading, success, error
    error: null,
    tempFilePath: null
  }))
  
  uploadFiles.value.push(...newFiles)
  
  if (newFiles.length > 0) {
    ElMessage.success(`已添加 ${newFiles.length} 个文件`)
  }
}

// 移除文件
const removeFile = (index) => {
  uploadFiles.value.splice(index, 1)
}

// 清空所有文件
const clearAllFiles = () => {
  uploadFiles.value = []
  uploadProgress.value = { total: 0, completed: 0, current: '' }
  uploadConfig.value = { trackType: null, platformType: null }
}

// 验证文件
const validateFiles = () => {
  ElMessageBox.alert(
    '功能未开发：自动验证文件是否已经在数据库存在，请上传前手动保证，不要上传重复的文件！！！',
    '验证文件',
    {
      confirmButtonText: '知道了',
      type: 'warning'
    }
  )
}

// 确认上传
const confirmUpload = async () => {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  if (!uploadConfig.value.trackType || !uploadConfig.value.platformType) {
    ElMessage.warning('请选择赛道类型和平台类型')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要上传 ${uploadFiles.value.length} 个文件吗？`,
      '确认上传',
      {
        confirmButtonText: '确定上传',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await startUpload()
  } catch {
    // 用户取消
  }
}

// 开始上传
const startUpload = async () => {
  uploading.value = true
  uploadProgress.value = {
    total: uploadFiles.value.length,
    completed: 0,
    current: ''
  }
  
  // 显示上传提示
  const loadingInstance = ElMessage({
    message: '文件批量上传中，请耐心等待，不要关闭窗口...⌛️',
    type: 'info',
    duration: 0,
    showClose: false
  })
  
  // 重置所有文件状态
  uploadFiles.value.forEach(file => {
    if (file.status !== 'success') {
      file.status = 'pending'
      file.error = null
    }
  })
  
  const pendingFiles = uploadFiles.value.filter(file => file.status === 'pending')
  const BATCH_SIZE = 10 // 每批上传10个文件
  
  try {
    // 分批上传
    for (let i = 0; i < pendingFiles.length; i += BATCH_SIZE) {
      const batch = pendingFiles.slice(i, i + BATCH_SIZE)
      await uploadBatch(batch)
    }
    
    const successCount = uploadFiles.value.filter(f => f.status === 'success').length
    const errorCount = uploadFiles.value.filter(f => f.status === 'error').length
    
    // 关闭loading提示
    loadingInstance.close()
    
    if (errorCount === 0) {
      ElMessage.success(`所有文件上传成功！共 ${successCount} 个文件`)
    } else {
      ElMessage.warning(`上传完成：成功 ${successCount} 个，失败 ${errorCount} 个`)
    }
    
    // 🚀 上传完成后，将结果添加到状态列表，并清空待上传列表
    const completedFiles = [...uploadFiles.value]
    
    // 将完成的文件添加到状态列表（失败的文件排在前面）
    uploadStatusFiles.value.push(...completedFiles)
    
    // 清空待上传文件列表和配置
    uploadFiles.value = []
    uploadProgress.value = { total: 0, completed: 0, current: '' }
    uploadConfig.value = { trackType: null, platformType: null }
    
    // 刷新文章数据
    await loadArticleData(true)
    
  } catch (error) {
    console.error('上传过程出错:', error)
    loadingInstance.close()
    ElMessage.error('上传过程中出现错误')
  } finally {
    uploading.value = false
    uploadProgress.value.current = ''
  }
}

// 上传单批文件
const uploadBatch = async (batch) => {
  // 标记为上传中
  batch.forEach(file => {
    file.status = 'uploading'
  })
  
  try {
    // 🚀 优化：读取文件内容为 ArrayBuffer
    const files = await Promise.all(
      batch.map(async (fileItem) => {
        try {
          const arrayBuffer = await readFileAsArrayBuffer(fileItem.file)
          return {
            fileName: fileItem.name,
            fileContent: Array.from(new Uint8Array(arrayBuffer)), // 转换为数组便于传输
            fileSize: fileItem.file.size
          }
        } catch (error) {
          console.error(`读取文件 ${fileItem.name} 失败:`, error)
          throw new Error(`读取文件 ${fileItem.name} 失败: ${error.message}`)
        }
      })
    )
    
    // 调用云函数
    const result = await callAdminCloudFunction('admin-add-article', {
      trackType: uploadConfig.value.trackType,
      platformType: uploadConfig.value.platformType,
      files: files
    })
    
    if (result.result && result.result.success) {
      const { results, errors } = result.result.data
      
      // 更新成功的文件状态
      results.forEach((result, index) => {
        const file = batch[index]
        if (file) {
          file.status = 'success'
          uploadProgress.value.completed++
        }
      })
      
      // 更新失败的文件状态
      errors.forEach(error => {
        const file = batch[error.index]
        if (file) {
          file.status = 'error'
          file.error = error.error
          uploadProgress.value.completed++
        }
      })
    } else {
      // 整批失败
      batch.forEach(file => {
        file.status = 'error'
        file.error = result.result?.message || '上传失败'
        uploadProgress.value.completed++
      })
    }
  } catch (error) {
    console.error('云函数调用失败:', error)
    // 整批失败
    batch.forEach(file => {
      file.status = 'error'
      file.error = error.message || '网络错误或云函数调用失败'
      uploadProgress.value.completed++
    })
  }
}

// 🚀 新增：读取文件为 ArrayBuffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      resolve(event.target.result)
    }
    
    reader.onerror = (error) => {
      reject(new Error('文件读取失败'))
    }
    
    // 读取为 ArrayBuffer（性能最优）
    reader.readAsArrayBuffer(file)
  })
}

// 重试失败的文件
const retryFailedFiles = async () => {
  const failedFiles = uploadStatusFiles.value.filter(f => f.status === 'error')
  
  if (failedFiles.length === 0) {
    ElMessage.info('没有失败的文件需要重试')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要重试上传 ${failedFiles.length} 个失败的文件吗？`,
      '重试上传',
      {
        confirmButtonText: '确定重试',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 重置失败文件状态
    failedFiles.forEach(file => {
      file.status = 'pending'
      file.error = null
    })
    
    // 使用现有的批量上传逻辑重试失败的文件
    uploading.value = true
    uploadProgress.value = {
      total: failedFiles.length,
      completed: 0,
      current: ''
    }
    
    const loadingInstance = ElMessage({
      message: '重试上传失败文件中，请耐心等待...⌛️',
      type: 'info',
      duration: 0,
      showClose: false
    })
    
    try {
      const BATCH_SIZE = 10
      for (let i = 0; i < failedFiles.length; i += BATCH_SIZE) {
        const batch = failedFiles.slice(i, i + BATCH_SIZE)
        await uploadBatch(batch)
      }
      
      const successCount = failedFiles.filter(f => f.status === 'success').length
      const errorCount = failedFiles.filter(f => f.status === 'error').length
      
      loadingInstance.close()
      
      if (errorCount === 0) {
        ElMessage.success(`重试成功！共 ${successCount} 个文件`)
      } else {
        ElMessage.warning(`重试完成：成功 ${successCount} 个，失败 ${errorCount} 个`)
      }
      
      // 刷新文章数据
      await loadArticleData(true)
      
    } catch (error) {
      console.error('重试上传出错:', error)
      loadingInstance.close()
      ElMessage.error('重试上传过程中出现错误')
    } finally {
      uploading.value = false
      uploadProgress.value.current = ''
    }
    
  } catch {
    // 用户取消
  }
}

// 清除缓存 - 恢复到初始状态
const clearCache = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有上传记录和缓存数据吗？此操作不可恢复。',
      '清除缓存',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 重置所有状态
    uploadFiles.value = []
    uploadStatusFiles.value = []
    uploading.value = false
    uploadProgress.value = { completed: 0, total: 0 }
    uploadConfig.value = { trackType: null, platformType: null }
    
    ElMessage.success('缓存已清除')
  } catch {
    // 用户取消
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 计算上传进度百分比
const uploadProgressPercentage = computed(() => {
  if (uploadProgress.value.total === 0) return 0
  return Math.round((uploadProgress.value.completed / uploadProgress.value.total) * 100)
})

// 是否有失败的文件
const hasFailedFiles = computed(() => {
  return uploadStatusFiles.value.some(f => f.status === 'error')
})

// 排序后的上传状态文件列表（失败的排在前面）
const sortedUploadStatusFiles = computed(() => {
  const files = [...uploadStatusFiles.value]
  return files.sort((a, b) => {
    // 失败的文件排在最前面
    if (a.status === 'error' && b.status !== 'error') return -1
    if (a.status !== 'error' && b.status === 'error') return 1
    // 其他状态保持原有顺序
    return 0
  })
})

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

/* 清除缓存按钮样式优化 - 淡红色背景白色文字 */
.clear-cache-button {
  &.is-disabled {
    background-color: #f5f5f5 !important;
    border-color: #d1d5db !important;
    color: #6b7280 !important; /* 提高对比度的灰色 */
    font-weight: 500 !important;
  }
  
  &:not(.is-disabled) {
    background-color: #dc2626 !important; /* 淡红色背景 */
    border-color: #dc2626 !important;
    color: #ffffff !important; /* 白色文字 */
    font-weight: 600 !important;
    border-width: 1px !important;

    &:hover {
      background-color: #b91c1c !important; /* 悬停时更深的红色 */
      border-color: #b91c1c !important;
      color: #ffffff !important;
    }
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

// 上传面板样式
.upload-dialog {
  .upload-panel {
    display: flex;
    gap: 24px;
    min-height: 400px;

    .file-list-area {
      flex: 2;

      .file-drop-zone {
        border: 2px dashed #dcdfe6;
        border-radius: 8px;
        padding: 20px;
        min-height: 350px;
        transition: all 0.3s;
        background: #fafafa;

        &.drag-over {
          border-color: #409eff;
          background: #f0f9ff;
        }

        .drop-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #909399;

          .drop-icon {
            font-size: 48px;
            margin-bottom: 16px;
            color: #c0c4cc;
          }

          p {
            margin: 4px 0;
            font-size: 16px;

            &.drop-hint {
              font-size: 14px;
              color: #c0c4cc;
            }
          }
        }

        .file-list {
          max-height: 280px;
          overflow-y: auto;
          padding-right: 8px;

          .file-item {
            display: flex;
            align-items: center;
            padding: 8px 12px;
            margin-bottom: 6px;
            background: white;
            border-radius: 6px;
            border: 1px solid #ebeef5;
            transition: all 0.3s;

            &:hover {
              border-color: #c0c4cc;
            }

            &.success {
              border-color: #67c23a;
              background: #f0f9ff;
            }

            &.error {
              border-color: #f56c6c;
              background: #fef0f0;
            }

            &.uploading {
              border-color: #e6a23c;
              background: #fdf6ec;
            }

            .file-name {
              flex: 1;
              font-weight: 500;
              color: #303133;
              font-size: 14px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              margin-right: 12px;
            }

            .file-size {
              font-size: 12px;
              color: #909399;
              margin-right: 12px;
              white-space: nowrap;
            }

            .file-actions {
              display: flex;
              align-items: center;
              gap: 8px;

              .status-icon {
                font-size: 16px;

                &.success {
                  color: #67c23a;
                }

                &.error {
                  color: #f56c6c;
                }

                &.uploading {
                  color: #e6a23c;
                  animation: rotate 1s linear infinite;
                }
              }

              .remove-btn {
                padding: 2px 6px;
                font-size: 12px;
                min-height: auto;
              }
            }
          }
        }
      }
    }

    .action-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 24px;

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .el-button {
          width: 100%;
        }
      }

      .upload-config {
        .el-form-item {
          margin-bottom: 16px;
        }
      }
    }
  }

  .upload-progress {
    margin: 20px 0;

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;
    }
  }

  .upload-status {
    display: flex;
    gap: 24px;
    margin-top: 20px;
    min-height: 200px;

    .status-list {
      flex: 2;

      .status-header {
        font-weight: 600;
        margin-bottom: 12px;
        color: #303133;
      }

      .status-items {
        max-height: 180px;
        overflow-y: auto;

        .status-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          margin-bottom: 4px;
          border-radius: 4px;
          border-bottom: 1px solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .status-filename {
            flex: 1;
            font-size: 14px;
            color: #606266;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .status-result {
            flex-shrink: 0;
          }

          .status-error {
            font-size: 12px;
            color: #f56c6c;
            margin-left: 8px;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          &.success {
            background: #f0f9ff;
            border-left: 3px solid #67c23a;
          }

          &.error {
            background: #fef0f0;
            border-left: 3px solid #f56c6c;
          }

          &.uploading {
            background: #fdf6ec;
            border-left: 3px solid #e6a23c;
          }
        }
      }
    }

    .retry-area {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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

  .upload-dialog {
    .upload-panel {
      flex-direction: column;
      gap: 16px;

      .action-area {
        .action-buttons {
          flex-direction: row;
          flex-wrap: wrap;

          .el-button {
            width: auto;
            flex: 1;
          }
        }
      }
    }

    .upload-status {
      flex-direction: column;
      gap: 16px;
    }
  }
}
</style>