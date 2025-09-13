<template>
  <div class="article-audit-page">
    <div class="page-header">
      <h1>用户文章审核</h1>
      <p>审核用户提交的文章内容</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" :inline="true" class="filter-form">
        <el-form-item label="审核状态">
          <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="文章标题">
          <el-input v-model="filterForm.title" placeholder="请输入文章标题" clearable />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="filterForm.author" placeholder="请输入作者名称" clearable />
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="loading">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文章列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>文章列表</span>
          <div class="header-actions">
            <el-button type="success" @click="handleBatchApprove" :disabled="!selectedArticles.length">
              <el-icon><Check /></el-icon>
              批量通过
            </el-button>
            <el-button type="danger" @click="handleBatchReject" :disabled="!selectedArticles.length">
              <el-icon><Close /></el-icon>
              批量拒绝
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="articleList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="title" label="文章标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="handlePreview(row)">
              {{ row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="{ row }">
            <el-tag :type="getPlatformTagType(row.platform)">
              {{ getPlatformName(row.platform) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="wordCount" label="字数" width="80" />
        <el-table-column prop="status" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="160" />
        <el-table-column prop="auditTime" label="审核时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handlePreview(row)">
              预览
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="row.status !== 'pending'"
              type="warning"
              size="small"
              @click="handleReaudit(row)"
            >
              重新审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 文章预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="文章预览"
      width="80%"
      :before-close="handleClosePreview"
    >
      <div v-if="currentArticle" class="article-preview">
        <div class="article-meta">
          <h2>{{ currentArticle.title }}</h2>
          <div class="meta-info">
            <span>作者：{{ currentArticle.author }}</span>
            <span>平台：{{ getPlatformName(currentArticle.platform) }}</span>
            <span>字数：{{ currentArticle.wordCount }}</span>
            <span>提交时间：{{ currentArticle.submitTime }}</span>
          </div>
        </div>
        <el-divider />
        <div class="article-content" v-html="currentArticle.content"></div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="previewVisible = false">关闭</el-button>
          <el-button
            v-if="currentArticle?.status === 'pending'"
            type="success"
            @click="handleApprove(currentArticle)"
          >
            通过审核
          </el-button>
          <el-button
            v-if="currentArticle?.status === 'pending'"
            type="danger"
            @click="handleReject(currentArticle)"
          >
            拒绝审核
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 拒绝原因对话框 -->
    <el-dialog v-model="rejectVisible" title="拒绝原因" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-select v-model="rejectForm.reason" placeholder="请选择拒绝原因">
            <el-option label="内容违规" value="violation" />
            <el-option label="质量不达标" value="quality" />
            <el-option label="格式不规范" value="format" />
            <el-option label="抄袭内容" value="plagiarism" />
            <el-option label="其他原因" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input
            v-model="rejectForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入详细的拒绝说明（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmReject" :loading="rejectLoading">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { callCloudFunction } from '@/utils/cloudbase'

// 响应式数据
const loading = ref(false)
const rejectLoading = ref(false)
const previewVisible = ref(false)
const rejectVisible = ref(false)
const articleList = ref([])
const selectedArticles = ref([])
const currentArticle = ref(null)
const currentRejectArticle = ref(null)

// 筛选表单
const filterForm = reactive({
  status: '',
  title: '',
  author: '',
  dateRange: []
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 拒绝表单
const rejectForm = reactive({
  reason: '',
  comment: ''
})

// 获取文章列表
const getArticleList = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...filterForm
    }

    const result = await callCloudFunction('admin-get-article-audit-list', params)

    if (result.result.success) {
      articleList.value = result.result.data.list
      pagination.total = result.result.data.total
    } else {
      ElMessage.error(result.result.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取文章列表失败:', error)
    ElMessage.error('获取数据失败，请重试')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  getArticleList()
}

// 重置
const handleReset = () => {
  Object.assign(filterForm, {
    status: '',
    title: '',
    author: '',
    dateRange: []
  })
  pagination.page = 1
  getArticleList()
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedArticles.value = selection
}

// 预览文章
const handlePreview = (article) => {
  currentArticle.value = article
  previewVisible.value = true
}

// 关闭预览
const handleClosePreview = () => {
  previewVisible.value = false
  currentArticle.value = null
}

// 通过审核
const handleApprove = async (article) => {
  try {
    await ElMessageBox.confirm('确定要通过这篇文章的审核吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    const result = await callCloudFunction('admin-approve-article', {
      articleId: article.id
    })

    if (result.result.success) {
      ElMessage.success('审核通过成功')
      previewVisible.value = false
      getArticleList()
    } else {
      ElMessage.error(result.result.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('通过审核失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 拒绝审核
const handleReject = (article) => {
  currentRejectArticle.value = article
  rejectForm.reason = ''
  rejectForm.comment = ''
  rejectVisible.value = true
}

// 确认拒绝
const confirmReject = async () => {
  if (!rejectForm.reason) {
    ElMessage.warning('请选择拒绝原因')
    return
  }

  rejectLoading.value = true
  try {
    const result = await callCloudFunction('admin-reject-article', {
      articleId: currentRejectArticle.value.id,
      reason: rejectForm.reason,
      comment: rejectForm.comment
    })

    if (result.result.success) {
      ElMessage.success('审核拒绝成功')
      rejectVisible.value = false
      previewVisible.value = false
      getArticleList()
    } else {
      ElMessage.error(result.result.message || '操作失败')
    }
  } catch (error) {
    console.error('拒绝审核失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    rejectLoading.value = false
  }
}

// 重新审核
const handleReaudit = async (article) => {
  try {
    await ElMessageBox.confirm('确定要重新审核这篇文章吗？', '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const result = await callCloudFunction('admin-reaudit-article', {
      articleId: article.id
    })

    if (result.result.success) {
      ElMessage.success('重新审核成功')
      getArticleList()
    } else {
      ElMessage.error(result.result.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新审核失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 批量通过
const handleBatchApprove = async () => {
  try {
    await ElMessageBox.confirm(`确定要批量通过选中的 ${selectedArticles.value.length} 篇文章吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    const articleIds = selectedArticles.value.map(item => item.id)
    const result = await callCloudFunction('admin-batch-approve-articles', {
      articleIds
    })

    if (result.result.success) {
      ElMessage.success('批量通过成功')
      getArticleList()
    } else {
      ElMessage.error(result.result.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量通过失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 批量拒绝
const handleBatchReject = async () => {
  try {
    await ElMessageBox.confirm(`确定要批量拒绝选中的 ${selectedArticles.value.length} 篇文章吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    })

    const articleIds = selectedArticles.value.map(item => item.id)
    const result = await callCloudFunction('admin-batch-reject-articles', {
      articleIds,
      reason: 'batch_reject',
      comment: '批量拒绝'
    })

    if (result.result.success) {
      ElMessage.success('批量拒绝成功')
      getArticleList()
    } else {
      ElMessage.error(result.result.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量拒绝失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  getArticleList()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  getArticleList()
}

// 获取状态标签类型
const getStatusTagType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const textMap = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return textMap[status] || '未知'
}

// 获取平台标签类型
const getPlatformTagType = (platform) => {
  const typeMap = {
    wechat: 'success',
    weibo: 'warning',
    xiaohongshu: 'danger',
    douyin: 'info'
  }
  return typeMap[platform] || 'info'
}

// 获取平台名称
const getPlatformName = (platform) => {
  const nameMap = {
    wechat: '微信',
    weibo: '微博',
    xiaohongshu: '小红书',
    douyin: '抖音'
  }
  return nameMap[platform] || platform
}

onMounted(() => {
  getArticleList()
})
</script>

<style lang="scss" scoped>
.article-audit-page {
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
  
  .filter-card {
    margin-bottom: 20px;
    
    .filter-form {
      .el-form-item {
        margin-bottom: 0;
      }
    }
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
  
  .article-preview {
    .article-meta {
      h2 {
        margin: 0 0 16px 0;
        color: #303133;
      }
      
      .meta-info {
        display: flex;
        gap: 20px;
        color: #909399;
        font-size: 14px;
      }
    }
    
    .article-content {
      max-height: 400px;
      overflow-y: auto;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 4px;
      line-height: 1.6;
    }
  }
}

@media (max-width: 768px) {
  .article-audit-page {
    .filter-form {
      .el-form-item {
        display: block;
        margin-bottom: 16px;
      }
    }
    
    .card-header {
      flex-direction: column;
      gap: 12px;
      align-items: flex-start !important;
    }
  }
}
</style>