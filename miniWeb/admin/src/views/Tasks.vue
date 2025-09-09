<template>
  <div class="tasks-page">
    <div class="page-header">
      <h1>任务管理</h1>
      <p>管理每日文章任务的创建和分发</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-date-picker
            v-model="selectedDate"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-button type="primary" @click="handleCreateTasks" :loading="createLoading">
            <el-icon><Plus /></el-icon>
            创建今日任务
          </el-button>
          <el-button @click="handleRefresh" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 任务统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ taskStats.total }}</div>
            <div class="stat-label">总任务数</div>
          </div>
          <el-icon class="stat-icon" color="#409EFF"><Document /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ taskStats.claimed }}</div>
            <div class="stat-label">已领取</div>
          </div>
          <el-icon class="stat-icon" color="#67C23A"><Check /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ taskStats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <el-icon class="stat-icon" color="#E6A23C"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ taskStats.unclaimed }}</div>
            <div class="stat-label">未领取</div>
          </div>
          <el-icon class="stat-icon" color="#F56C6C"><Warning /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 任务列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>任务列表 ({{ selectedDate }})</span>
          <div class="header-actions">
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedTasks.length === 0">
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="taskList"
        :loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
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
        <el-table-column label="任务状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getTaskStatusType(row)">
              {{ getTaskStatusText(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userId" label="领取用户" width="120" />
        <el-table-column prop="taskTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.taskTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button 
              v-if="!row.isClaimed"
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
            <el-button 
              v-if="row.isClaimed && !row.isCompleted"
              type="warning" 
              size="small" 
              @click="handleResetTask(row)"
            >
              重置
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

    <!-- 任务详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="任务详情"
      width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="文章ID">{{ taskDetail.articleId }}</el-descriptions-item>
        <el-descriptions-item label="文章标题">{{ taskDetail.articleTitle }}</el-descriptions-item>
        <el-descriptions-item label="平台类型">
          <el-tag type="info">{{ getPlatformName(taskDetail.platformType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="赛道类型">
          <el-tag>{{ getTrackTypeName(taskDetail.trackType) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="任务状态">
          <el-tag :type="getTaskStatusType(taskDetail)">
            {{ getTaskStatusText(taskDetail) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="领取用户">{{ taskDetail.userId || '未领取' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(taskDetail.taskTime) }}</el-descriptions-item>
        <el-descriptions-item label="下载链接" :span="2">
          <el-link :href="taskDetail.downloadUrl" target="_blank" type="primary">
            {{ taskDetail.downloadUrl }}
          </el-link>
        </el-descriptions-item>
      </el-descriptions>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { callCloudFunction } from '@/utils/cloudbase'

// 响应式数据
const loading = ref(false)
const createLoading = ref(false)
const taskList = ref([])
const selectedTasks = ref([])
const selectedDate = ref(new Date().toISOString().split('T')[0])

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const taskDetail = ref({})

// 任务统计
const taskStats = computed(() => {
  const total = taskList.value.length
  const claimed = taskList.value.filter(task => task.isClaimed).length
  const completed = taskList.value.filter(task => task.isCompleted).length
  const unclaimed = total - claimed
  
  return {
    total,
    claimed,
    completed,
    unclaimed
  }
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

const getTaskStatusText = (task) => {
  if (task.isCompleted) return '已完成'
  if (task.isClaimed) return '已领取'
  return '未领取'
}

const getTaskStatusType = (task) => {
  if (task.isCompleted) return 'success'
  if (task.isClaimed) return 'warning'
  return 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 加载任务列表
const loadTaskList = async () => {
  loading.value = true
  try {
    // TODO: 调用云函数获取任务列表
    const result = await callCloudFunction('admin-get-daily-tasks', {
      date: selectedDate.value,
      page: pagination.page,
      size: pagination.size
    })

    if (result.result.success) {
      taskList.value = result.result.data.list || []
      pagination.total = result.result.data.total || 0
    } else {
      ElMessage.error(result.result.message || '获取任务列表失败')
    }
  } catch (error) {
    console.error('加载任务列表失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 创建今日任务
const handleCreateTasks = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要为 ${selectedDate.value} 创建每日任务吗？这将会为所有用户生成新的文章任务。`,
      '创建任务确认',
      {
        confirmButtonText: '确定创建',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    createLoading.value = true

    // TODO: 调用云函数创建每日任务
    const result = await callCloudFunction('admin-create-daily-tasks', {
      date: selectedDate.value
    })

    if (result.result.success) {
      ElMessage.success(`成功创建 ${result.result.data.count} 个任务`)
      loadTaskList()
    } else {
      ElMessage.error(result.result.message || '创建任务失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('创建任务失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  } finally {
    createLoading.value = false
  }
}

// 刷新
const handleRefresh = () => {
  loadTaskList()
}

// 查看任务详情
const handleView = (row) => {
  taskDetail.value = { ...row }
  dialogVisible.value = true
}

// 删除任务
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除文章 "${row.articleTitle}" 的任务吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // TODO: 调用云函数删除任务
    const result = await callCloudFunction('admin-delete-task', {
      taskId: row._id,
      articleId: row.articleId
    })

    if (result.result.success) {
      ElMessage.success('删除成功')
      loadTaskList()
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

// 重置任务
const handleResetTask = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要重置任务 "${row.articleTitle}" 吗？这将清除该任务的领取状态，用户可以重新领取。`,
      '重置任务确认',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // TODO: 调用云函数重置任务
    const result = await callCloudFunction('admin-reset-task', {
      taskId: row._id,
      articleId: row.articleId
    })

    if (result.result.success) {
      ElMessage.success('重置成功')
      loadTaskList()
    } else {
      ElMessage.error(result.result.message || '重置失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重置失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedTasks.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTasks.value.length} 个任务吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // TODO: 调用云函数批量删除任务
    const taskIds = selectedTasks.value.map(task => task._id)
    const result = await callCloudFunction('admin-batch-delete-tasks', {
      taskIds: taskIds
    })

    if (result.result.success) {
      ElMessage.success('批量删除成功')
      loadTaskList()
    } else {
      ElMessage.error(result.result.message || '批量删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedTasks.value = selection
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadTaskList()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  loadTaskList()
}

// 监听日期变化
const handleDateChange = () => {
  pagination.page = 1
  loadTaskList()
}

onMounted(() => {
  loadTaskList()
})
</script>

<style lang="scss" scoped>
.tasks-page {
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
  
  .action-card {
    margin-bottom: 16px;
  }
  
  .stats-row {
    margin-bottom: 16px;
    
    .stat-card {
      .el-card__body {
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .stat-content {
        .stat-number {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          line-height: 1;
        }
        
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 8px;
        }
      }
      
      .stat-icon {
        font-size: 40px;
        opacity: 0.8;
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
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
  }
  
  .dialog-footer {
    text-align: right;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .tasks-page {
    .action-card {
      .el-col {
        margin-bottom: 16px;
      }
    }
    
    .stats-row {
      .el-col {
        margin-bottom: 16px;
      }
    }
    
    .table-card {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        
        .header-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    }
  }
}
</style>