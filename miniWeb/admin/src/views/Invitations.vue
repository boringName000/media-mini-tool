<template>
  <div class="invitations-page">
    <div class="page-header">
      <h1>邀请码管理</h1>
      <p>管理系统邀请码的生成和使用</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索邀请码"
            prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-button type="primary" @click="handleCreateInvitation">
            <el-icon><Plus /></el-icon>
            生成邀请码
          </el-button>
          <el-button @click="handleRefresh" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 邀请码统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ invitationStats.total }}</div>
            <div class="stat-label">总邀请码</div>
          </div>
          <el-icon class="stat-icon" color="#409EFF"><Ticket /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ invitationStats.used }}</div>
            <div class="stat-label">已使用</div>
          </div>
          <el-icon class="stat-icon" color="#67C23A"><Check /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ invitationStats.unused }}</div>
            <div class="stat-label">未使用</div>
          </div>
          <el-icon class="stat-icon" color="#E6A23C"><Clock /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ invitationStats.expired }}</div>
            <div class="stat-label">已过期</div>
          </div>
          <el-icon class="stat-icon" color="#F56C6C"><Warning /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 邀请码列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>邀请码列表 ({{ pagination.total }})</span>
          <div class="header-actions">
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedInvitations.length === 0">
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="invitationList"
        :loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="invitationCode" label="邀请码" width="150" />
        <el-table-column prop="createdBy" label="创建者" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usedBy" label="使用者" width="120">
          <template #default="{ row }">
            {{ row.usedBy || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="usedTime" label="使用时间" width="160">
          <template #default="{ row }">
            {{ row.usedTime ? formatTime(row.usedTime) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="expiryTime" label="过期时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.expiryTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleCopy(row.invitationCode)">
              复制
            </el-button>
            <el-button 
              v-if="row.status === 'unused'"
              type="danger" 
              size="small" 
              @click="handleDelete(row)"
            >
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

    <!-- 生成邀请码对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="生成邀请码"
      width="500px"
    >
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="数量">
          <el-input-number
            v-model="createForm.count"
            :min="1"
            :max="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="有效期">
          <el-select v-model="createForm.expiryDays" style="width: 100%">
            <el-option label="7天" :value="7" />
            <el-option label="30天" :value="30" />
            <el-option label="90天" :value="90" />
            <el-option label="永久" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createForm.remark"
            type="textarea"
            :rows="3"
            placeholder="可选，邀请码用途说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleConfirmCreate"
            :loading="createLoading"
          >
            生成
          </el-button>
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
const invitationList = ref([])
const selectedInvitations = ref([])
const searchKeyword = ref('')

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 对话框
const createDialogVisible = ref(false)
const createForm = reactive({
  count: 1,
  expiryDays: 30,
  remark: ''
})

// 邀请码统计
const invitationStats = computed(() => {
  const total = invitationList.value.length
  const used = invitationList.value.filter(item => item.status === 'used').length
  const unused = invitationList.value.filter(item => item.status === 'unused').length
  const expired = invitationList.value.filter(item => item.status === 'expired').length
  
  return {
    total,
    used,
    unused,
    expired
  }
})

// 工具函数
const getStatusText = (status) => {
  const statusMap = {
    'unused': '未使用',
    'used': '已使用',
    'expired': '已过期'
  }
  return statusMap[status] || '未知'
}

const getStatusType = (status) => {
  const typeMap = {
    'unused': 'warning',
    'used': 'success',
    'expired': 'danger'
  }
  return typeMap[status] || 'info'
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 加载邀请码列表
const loadInvitationList = async () => {
  loading.value = true
  try {
    // TODO: 调用云函数获取邀请码列表
    const result = await callCloudFunction('admin-get-invitations', {
      page: pagination.page,
      size: pagination.size,
      keyword: searchKeyword.value
    })

    if (result.result.success) {
      invitationList.value = result.result.data.list || []
      pagination.total = result.result.data.total || 0
    } else {
      ElMessage.error(result.result.message || '获取邀请码列表失败')
    }
  } catch (error) {
    console.error('加载邀请码列表失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadInvitationList()
}

// 刷新
const handleRefresh = () => {
  loadInvitationList()
}

// 生成邀请码
const handleCreateInvitation = () => {
  createDialogVisible.value = true
}

// 确认生成
const handleConfirmCreate = async () => {
  createLoading.value = true
  try {
    // TODO: 调用云函数生成邀请码
    const result = await callCloudFunction('admin-create-invitations', createForm)

    if (result.result.success) {
      ElMessage.success(`成功生成 ${createForm.count} 个邀请码`)
      createDialogVisible.value = false
      loadInvitationList()
      
      // 重置表单
      Object.assign(createForm, {
        count: 1,
        expiryDays: 30,
        remark: ''
      })
    } else {
      ElMessage.error(result.result.message || '生成邀请码失败')
    }
  } catch (error) {
    console.error('生成邀请码失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    createLoading.value = false
  }
}

// 复制邀请码
const handleCopy = async (code) => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('邀请码已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败，请手动复制')
  }
}

// 删除邀请码
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除邀请码 "${row.invitationCode}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // TODO: 调用云函数删除邀请码
    const result = await callCloudFunction('admin-delete-invitation', {
      invitationCode: row.invitationCode
    })

    if (result.result.success) {
      ElMessage.success('删除成功')
      loadInvitationList()
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

// 批量删除
const handleBatchDelete = async () => {
  if (selectedInvitations.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedInvitations.value.length} 个邀请码吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // TODO: 调用云函数批量删除邀请码
    const codes = selectedInvitations.value.map(item => item.invitationCode)
    const result = await callCloudFunction('admin-batch-delete-invitations', {
      invitationCodes: codes
    })

    if (result.result.success) {
      ElMessage.success('批量删除成功')
      loadInvitationList()
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
  selectedInvitations.value = selection
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadInvitationList()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  loadInvitationList()
}

onMounted(() => {
  loadInvitationList()
})
</script>

<style lang="scss" scoped>
.invitations-page {
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
</style>