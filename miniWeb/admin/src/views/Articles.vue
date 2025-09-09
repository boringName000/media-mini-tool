<template>
  <div class="articles-page">
    <div class="page-header">
      <h1>文章管理</h1>
      <p>管理系统中的文章内容</p>
    </div>

    <!-- 搜索和操作栏 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索文章标题、ID"
            prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="searchForm.platform"
            placeholder="平台类型"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="微信公众号" value="1" />
            <el-option label="今日头条" value="2" />
            <el-option label="百家号" value="3" />
            <el-option label="企鹅号" value="4" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="searchForm.trackType"
            placeholder="赛道类型"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="美食赛道" value="1" />
            <el-option label="情感赛道" value="2" />
            <el-option label="育儿赛道" value="3" />
            <el-option label="职场赛道" value="4" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-button type="primary" @click="handleSearch" :loading="loading">
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 文章列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>文章列表 ({{ pagination.total }})</span>
          <div class="header-actions">
            <el-button @click="handleRefresh" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加文章
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="articleList"
        :loading="loading"
        stripe
      >
        <el-table-column prop="articleId" label="文章ID" width="120" />
        <el-table-column prop="articleTitle" label="文章标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="平台类型" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ getPlatformName(row.platformType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="赛道类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ getTrackTypeName(row.trackType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="downloadCount" label="下载次数" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { callCloudFunction } from '@/utils/cloudbase'

// 响应式数据
const loading = ref(false)
const articleList = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  platform: '',
  trackType: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 工具函数
const getPlatformName = (platform) => {
  const platformMap = {
    1: '微信公众号',
    2: '今日头条',
    3: '百家号',
    4: '企鹅号'
  }
  return platformMap[platform] || '未知平台'
}

const getTrackTypeName = (trackType) => {
  const trackTypeMap = {
    1: '美食赛道',
    2: '情感赛道',
    3: '育儿赛道',
    4: '职场赛道'
  }
  return trackTypeMap[trackType] || '未知赛道'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 加载文章列表
const loadArticleList = async () => {
  loading.value = true
  try {
    // TODO: 调用云函数获取文章列表
    const result = await callCloudFunction('admin-get-articles', {
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    })

    if (result.result.success) {
      articleList.value = result.result.data.list || []
      pagination.total = result.result.data.total || 0
    } else {
      ElMessage.error(result.result.message || '获取文章列表失败')
    }
  } catch (error) {
    console.error('加载文章列表失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadArticleList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    platform: '',
    trackType: ''
  })
  handleSearch()
}

// 刷新
const handleRefresh = () => {
  loadArticleList()
}

// 添加文章
const handleAdd = () => {
  ElMessage.info('添加文章功能待开发')
}

// 查看文章
const handleView = (row) => {
  ElMessage.info(`查看文章: ${row.articleTitle}`)
}

// 编辑文章
const handleEdit = (row) => {
  ElMessage.info(`编辑文章: ${row.articleTitle}`)
}

// 删除文章
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除文章 "${row.articleTitle}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // TODO: 调用云函数删除文章
    const result = await callCloudFunction('admin-delete-article', {
      articleId: row.articleId
    })

    if (result.result.success) {
      ElMessage.success('删除成功')
      loadArticleList()
    } else {
      ElMessage.error(result.result.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadArticleList()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  loadArticleList()
}

onMounted(() => {
  loadArticleList()
})
</script>

<style lang="scss" scoped>
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
  
  .search-card {
    margin-bottom: 16px;
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
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>