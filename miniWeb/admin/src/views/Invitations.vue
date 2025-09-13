<template>
  <div class="invitations-page">
    <div class="page-header">
      <h1>邀请码管理</h1>
      <p>管理系统邀请码的生成和使用</p>
    </div>

    <!-- 操作栏 -->
    <el-card class="action-card" shadow="never">
      <el-row :gutter="20" justify="space-between" align="middle">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索邀请码"
            prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" class="action-buttons">
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
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.totalCount || 0 }}</div>
            <div class="stat-label">总邀请码</div>
          </div>
          <el-icon class="stat-icon" color="#409EFF"><Ticket /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.validCount || 0 }}</div>
            <div class="stat-label">有效邀请码</div>
          </div>
          <el-icon class="stat-icon" color="#67C23A"><Check /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ statistics.expiredCount || 0 }}</div>
            <div class="stat-label">已过期</div>
          </div>
          <el-icon class="stat-icon" color="#F56C6C"><Warning /></el-icon>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ filteredInvitations.length }}</div>
            <div class="stat-label">当前显示</div>
          </div>
          <el-icon class="stat-icon" color="#909399"><View /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <!-- 邀请码列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>邀请码列表 ({{ filteredInvitations.length }})</span>
        </div>
      </template>

      <el-table
        :data="paginatedInvitations"
        :loading="loading"
        stripe
        empty-text="暂无邀请码数据"
        style="width: 100%"
        table-layout="auto"
      >
        <el-table-column prop="invitationCode" label="邀请码" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text class="invitation-code" @click="handleCopy(row.invitationCode)">
              {{ row.invitationCode }}
            </el-text>
          </template>
        </el-table-column>
        
        <el-table-column prop="creatorId" label="创建者" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <el-text type="info" size="small">{{ formatCreatorId(row.creatorId) }}</el-text>
          </template>
        </el-table-column>
        
        <el-table-column label="状态" min-width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.isExpired)" size="small">
              {{ getStatusText(row.isExpired) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="剩余天数" min-width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.isExpired" class="expired-text">已过期</span>
            <span v-else-if="row.remainingDays !== null" class="remaining-days">
              {{ row.remainingDays }}天
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createTime" label="创建时间" min-width="130">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" size="small" @click="handleCopy(row.invitationCode)">
                <el-icon><DocumentCopy /></el-icon>
                复制
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                @click="handleVerify(row)"
                :loading="verifyingCodes.has(row.invitationCode)"
              >
                <el-icon><CircleCheck /></el-icon>
                验证
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="handleDelete(row)"
                :loading="deletingCodes.has(row.invitationCode)"
              >
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredInvitations.length"
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
      width="400px"
    >
      <el-alert
        title="提示"
        description="邀请码有效期为30天，生成后不可修改"
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      />
      
      <div class="create-actions">
        <el-button
          type="primary"
          size="large"
          @click="handleConfirmCreate"
          :loading="createLoading"
          style="width: 100%"
        >
          <el-icon><Plus /></el-icon>
          生成一个邀请码
        </el-button>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { callAdminCloudFunction } from '@/utils/cloudbase'
import { invitationsStore } from '@/store/index.js'
import { formatTime } from '@/utils/timeUtils'

// 响应式数据
const loading = ref(false)
const createLoading = ref(false)
const invitationList = ref([])
const statistics = ref({
  totalCount: 0,
  validCount: 0,
  expiredCount: 0
})
const searchKeyword = ref('')
const verifyingCodes = ref(new Set())
const deletingCodes = ref(new Set())
const initialized = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  size: 20
})

// 对话框
const createDialogVisible = ref(false)

// 过滤后的邀请码列表
const filteredInvitations = computed(() => {
  if (!searchKeyword.value.trim()) {
    return invitationList.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return invitationList.value.filter(item => 
    item.invitationCode.toLowerCase().includes(keyword) ||
    item.creatorId.toLowerCase().includes(keyword)
  )
})

// 分页后的邀请码列表
const paginatedInvitations = computed(() => {
  const start = (pagination.page - 1) * pagination.size
  const end = start + pagination.size
  return filteredInvitations.value.slice(start, end)
})

// 工具函数
const getStatusText = (isExpired) => {
  return isExpired ? '已过期' : '有效'
}

const getStatusType = (isExpired) => {
  return isExpired ? 'danger' : 'success'
}



const formatCreatorId = (creatorId) => {
  if (!creatorId) return '-'
  // 只显示前8位和后4位，中间用...代替
  if (creatorId.length > 12) {
    return `${creatorId.substring(0, 8)}...${creatorId.substring(creatorId.length - 4)}`
  }
  return creatorId
}

// 使用Store加载邀请码列表
const loadInvitationList = async (forceRefresh = false) => {
  // 防止重复加载
  if (loading.value && !forceRefresh) {
    console.log('正在加载中，跳过重复请求')
    return
  }

  try {
    loading.value = true
    
    // 检查是否有缓存数据且未过期
    if (!forceRefresh) {
      const cachedData = invitationsStore.getData()
      if (cachedData) {
        invitationList.value = cachedData.data || []
        statistics.value = cachedData.statistics || {}
        console.log('使用缓存的邀请码数据')
        return
      }
    }
    
    // 设置加载状态
    invitationsStore.setLoading(true)
    
    // 调用云函数获取新数据
    const cloudResult = await callAdminCloudFunction('admin-get-all-invitation-code')
    
    if (cloudResult && cloudResult.result && cloudResult.result.success) {
      const result = cloudResult.result
      
      // 缓存数据到Store
      invitationsStore.setData(result)
      
      // 更新页面数据
      invitationList.value = result.data || []
      statistics.value = result.statistics || {}
      
      console.log('邀请码数据加载成功:', {
        total: statistics.value.totalCount,
        valid: statistics.value.validCount,
        expired: statistics.value.expiredCount
      })
    } else {
      const errorMsg = cloudResult?.result?.error || '获取邀请码列表失败'
      console.error('云函数返回错误:', errorMsg)
      // 只在非初始化时显示错误消息
      if (invitationList.value.length > 0 || forceRefresh) {
        ElMessage.error(errorMsg)
      }
    }
  } catch (error) {
    console.error('加载邀请码列表失败:', error)
    
    // 只在非初始化或强制刷新时显示错误消息
    if (invitationList.value.length > 0 || forceRefresh) {
      if (error.message === 'ADMIN_LOGIN_REQUIRED') {
        ElMessage.error('请先登录管理员账号')
      } else {
        ElMessage.error('网络错误，请重试')
      }
    }
  } finally {
    loading.value = false
    invitationsStore.setLoading(false)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
}

// 刷新
const handleRefresh = () => {
  loadInvitationList(true)
}

// 生成邀请码
const handleCreateInvitation = () => {
  createDialogVisible.value = true
}

// 确认生成
const handleConfirmCreate = async () => {
  createLoading.value = true
  try {
    const result = await callAdminCloudFunction('create-invitation-code')

    if (result && result.result && result.result.success) {
      ElMessage.success('邀请码生成成功')
      createDialogVisible.value = false
      // 强制刷新数据
      loadInvitationList(true)
    } else {
      const errorMsg = result?.result?.error || '生成邀请码失败'
      ElMessage.error(errorMsg)
    }
  } catch (error) {
    console.error('生成邀请码失败:', error)
    if (error.message === 'ADMIN_LOGIN_REQUIRED') {
      ElMessage.error('请先登录管理员账号')
    } else {
      ElMessage.error('操作失败，请重试')
    }
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
    // 降级方案：创建临时输入框复制
    const textArea = document.createElement('textarea')
    textArea.value = code
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      ElMessage.success('邀请码已复制到剪贴板')
    } catch (err) {
      ElMessage.error('复制失败，请手动复制')
    }
    document.body.removeChild(textArea)
  }
}

// 验证邀请码
const handleVerify = async (row) => {
  verifyingCodes.value.add(row.invitationCode)
  try {
    const result = await callAdminCloudFunction('verify-invitation-code', {
      invitationCode: row.invitationCode
    })

    if (result && result.result && result.result.success) {
      ElMessage.success('邀请码验证通过，可正常使用')
    } else {
      const errorMsg = result?.result?.error || '邀请码验证失败'
      ElMessage.warning(errorMsg)
    }
  } catch (error) {
    console.error('验证邀请码失败:', error)
    if (error.message === 'ADMIN_LOGIN_REQUIRED') {
      ElMessage.error('请先登录管理员账号')
    } else {
      ElMessage.error('验证失败，请重试')
    }
  } finally {
    verifyingCodes.value.delete(row.invitationCode)
  }
}

// 删除邀请码
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除邀请码 "${row.invitationCode}" 吗？删除后无法恢复。`, 
      '删除确认', 
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    deletingCodes.value.add(row.invitationCode)
    
    const result = await callAdminCloudFunction('delete-invitation-code', {
      invitationCode: row.invitationCode
    })

    if (result && result.result && result.result.success) {
      ElMessage.success('删除成功')
      // 强制刷新数据
      loadInvitationList(true)
    } else {
      const errorMsg = result?.result?.error || '删除失败'
      ElMessage.error(errorMsg)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      if (error.message === 'ADMIN_LOGIN_REQUIRED') {
        ElMessage.error('请先登录管理员账号')
      } else {
        ElMessage.error('操作失败，请重试')
      }
    }
  } finally {
    deletingCodes.value.delete(row.invitationCode)
  }
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
}

onMounted(async () => {
  try {
    console.log('邀请码页面开始初始化')
    await loadInvitationList()
    initialized.value = true
    console.log('邀请码页面初始化完成')
  } catch (error) {
    console.error('页面初始化失败:', error)
    initialized.value = true
    // 不显示错误消息，因为loadInvitationList内部已经处理了错误显示
  }
})
</script>

<style lang="scss" scoped>
.invitations-page {
  .page-header {
    margin-bottom: 24px;
    
    h1 {
      margin: 0 0 8px 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }
  
  .action-card {
    margin-bottom: 20px;
    
    .action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      
      @media (max-width: 768px) {
        justify-content: flex-start;
        margin-top: 12px;
      }
    }
  }
  
  .stats-row {
    margin-bottom: 20px;
    
    .stat-card {
      cursor: default;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      :deep(.el-card__body) {
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
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #909399;
          font-weight: 500;
        }
      }
      
      .stat-icon {
        font-size: 36px;
        opacity: 0.8;
      }
    }
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      color: #303133;
    }
    
    .invitation-code {
      cursor: pointer;
      color: #409EFF;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .expired-text {
      color: #F56C6C;
      font-weight: 500;
    }
    
    .remaining-days {
      color: #67C23A;
      font-weight: 500;
    }
    
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
  
  .create-actions {
    text-align: center;
    
    .el-button {
      height: 50px;
      font-size: 16px;
      border-radius: 8px;
    }
  }
  
  .dialog-footer {
    text-align: right;
  }
  
  // 响应式设计
  @media (max-width: 768px) {
    .stats-row {
      .stat-card {
        margin-bottom: 12px;
        
        :deep(.el-card__body) {
          padding: 16px;
        }
        
        .stat-content .stat-number {
          font-size: 24px;
        }
        
        .stat-icon {
          font-size: 28px;
        }
      }
    }
    
    .table-card {
      :deep(.el-table) {
        font-size: 12px;
        
        .el-button {
          padding: 4px 8px;
          font-size: 12px;
        }
      }
    }
  }
  
  // 表格操作按钮样式优化
  .table-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 4px;
    flex-wrap: nowrap;
    
    .el-button {
      margin: 0 !important;
      flex-shrink: 0;
      padding: 4px 8px !important;
      font-size: 11px;
      height: 28px;
      
      .el-icon {
        margin-right: 2px;
        font-size: 12px;
      }
    }
    
    .el-button--small {
      min-width: auto;
      border-radius: 4px;
    }
    
    // 确保按钮文字不换行
    .el-button span {
      white-space: nowrap;
    }
  }
  
  :deep(.el-table) {
    // 表格布局优化
    .el-table__cell {
      padding: 12px 8px;
    }
    
    // 操作列特殊处理
    .el-table__fixed-right {
      .el-table__cell {
        padding: 12px 4px;
      }
    }
    
    // 状态和剩余天数列居中
    .el-table__cell.is-center {
      text-align: center;
    }
  }
  
  // 响应式处理
  @media (max-width: 1200px) {
    .table-actions {
      gap: 2px;
      
      .el-button {
        padding: 3px 6px !important;
        font-size: 10px;
        height: 26px;
        
        .el-icon {
          margin-right: 1px;
          font-size: 11px;
        }
      }
    }
  }
  
  @media (max-width: 768px) {
    .table-actions {
      .el-button {
        padding: 2px 4px !important;
        font-size: 9px;
        height: 24px;
        
        span {
          display: none; // 小屏幕只显示图标
        }
        
        .el-icon {
          margin-right: 0;
          font-size: 10px;
        }
      }
    }
  }
  
  // 加载状态优化
  :deep(.el-loading-mask) {
    background-color: rgba(255, 255, 255, 0.8);
  }
}

// 全局样式：邀请码文本选择
.invitation-code {
  user-select: all;
}
</style>