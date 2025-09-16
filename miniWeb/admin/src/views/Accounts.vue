<template>
  <div class="accounts-page">
    <div class="page-header">
      <h1>账号管理</h1>
      <p>管理用户的创作账号信息 | 最后更新：{{ lastUpdateTime }}</p>
    </div>

    <!-- 搜索和操作栏 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索账号名称、ID"
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
          <el-select
            v-model="searchForm.auditStatus"
            placeholder="审核状态"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="待审核" value="0" />
            <el-option label="已通过" value="1" />
            <el-option label="已拒绝" value="2" />
          </el-select>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top: 16px;">
        <el-col :xs="24" :sm="12" :md="6">
          <el-button type="primary" @click="handleSearch" :loading="loading">
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 账号列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>账号列表 ({{ pagination.total }})</span>
          <div class="header-actions">
            <el-button @click="handleRefresh" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="success" @click="handleBatchApprove" :disabled="selectedAccounts.length === 0">
              批量通过
            </el-button>
            <el-button type="danger" @click="handleBatchReject" :disabled="selectedAccounts.length === 0">
              批量拒绝
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="accountList"
        :loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="accountId" label="账号ID" width="120" />
        <el-table-column prop="accountNickname" label="账号名称" width="150" />
        <el-table-column prop="userId" label="用户ID" width="120" />
        <el-table-column label="平台" width="120">
          <template #default="{ row }">
            <el-tag type="info">{{ getPlatformName(row.platform) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="赛道" width="120">
          <template #default="{ row }">
            <el-tag>{{ getTrackTypeName(row.trackType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)">
              {{ getAuditStatusText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="违规状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isViolation ? 'danger' : 'success'">
              {{ row.isViolation ? '违规' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phoneNumber" label="手机号" width="130" />
        <el-table-column prop="registerDate" label="注册时间" width="160" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button 
              v-if="row.auditStatus === 0"
              type="success" 
              size="small" 
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.auditStatus === 0"
              type="danger" 
              size="small" 
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">
              编辑
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

    <!-- 账号详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="accountFormRef"
        :model="accountForm"
        :rules="accountFormRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号ID" prop="accountId">
              <el-input v-model="accountForm.accountId" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号名称" prop="accountNickname">
              <el-input v-model="accountForm.accountNickname" :disabled="isViewMode" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户ID" prop="userId">
              <el-input v-model="accountForm.userId" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phoneNumber">
              <el-input v-model="accountForm.phoneNumber" :disabled="isViewMode" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="平台类型" prop="platform">
              <el-select v-model="accountForm.platform" :disabled="isViewMode" style="width: 100%">
                <el-option label="微信公众号" value="1" />
                <el-option label="今日头条" value="2" />
                <el-option label="百家号" value="3" />
                <el-option label="企鹅号" value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="赛道类型" prop="trackType">
              <el-select v-model="accountForm.trackType" :disabled="isViewMode" style="width: 100%">
                <el-option label="美食赛道" value="1" />
                <el-option label="情感赛道" value="2" />
                <el-option label="育儿赛道" value="3" />
                <el-option label="职场赛道" value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="审核状态" prop="auditStatus">
              <el-select v-model="accountForm.auditStatus" :disabled="isViewMode" style="width: 100%">
                <el-option label="待审核" value="0" />
                <el-option label="已通过" value="1" />
                <el-option label="已拒绝" value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="违规状态" prop="isViolation">
              <el-switch
                v-model="accountForm.isViolation"
                :disabled="isViewMode"
                active-text="违规"
                inactive-text="正常"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="注册时间" prop="registerDate">
          <el-input v-model="accountForm.registerDate" :disabled="true" />
        </el-form-item>
        
        <el-form-item label="资料页截图" prop="screenshotUrl">
          <div v-if="accountForm.screenshotUrl" class="screenshot-preview">
            <el-image
              :src="accountForm.screenshotUrl"
              :preview-src-list="[accountForm.screenshotUrl]"
              fit="cover"
              style="width: 200px; height: 150px;"
            />
          </div>
          <div v-else class="no-screenshot">
            <el-text type="info">暂无截图</el-text>
          </div>
        </el-form-item>
        
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="accountForm.remark"
            type="textarea"
            :rows="3"
            :disabled="isViewMode"
            placeholder="审核备注或其他说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            v-if="!isViewMode"
            type="primary"
            @click="handleSubmit"
            :loading="submitLoading"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminCloudFunctions } from '@/utils/cloudbase'
import { updatePageTime } from '@/utils/timeUtils'
import { accountsStore } from '@/store/index.js'

// 响应式数据
const loading = ref(false)
const lastUpdateTime = ref('')
const submitLoading = ref(false)
const accountList = ref([])
const selectedAccounts = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  platform: '',
  trackType: '',
  auditStatus: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isViewMode = ref(false)
const accountFormRef = ref()

// 账号表单
const accountForm = reactive({
  accountId: '',
  accountNickname: '',
  userId: '',
  phoneNumber: '',
  platform: '',
  trackType: '',
  auditStatus: '',
  isViolation: false,
  registerDate: '',
  screenshotUrl: '',
  remark: ''
})

// 表单验证规则
const accountFormRules = {
  accountNickname: [
    { required: true, message: '请输入账号名称', trigger: 'blur' }
  ],
  phoneNumber: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 工具函数
const getPlatformName = (platform) => {
  const platformMap = {
    '1': '微信公众号',
    '2': '今日头条',
    '3': '百家号',
    '4': '企鹅号'
  }
  return platformMap[platform] || '未知平台'
}

const getTrackTypeName = (trackType) => {
  const trackTypeMap = {
    '1': '美食赛道',
    '2': '情感赛道',
    '3': '育儿赛道',
    '4': '职场赛道'
  }
  return trackTypeMap[trackType] || '未知赛道'
}

const getAuditStatusText = (status) => {
  const statusMap = {
    '0': '待审核',
    '1': '已通过',
    '2': '已拒绝'
  }
  return statusMap[status] || '未知状态'
}

const getAuditStatusType = (status) => {
  const typeMap = {
    '0': 'warning',
    '1': 'success',
    '2': 'danger'
  }
  return typeMap[status] || 'info'
}

// 加载账号列表
const loadAccountList = async (forceRefresh = false) => {
  try {
    // 1. 检查缓存（如果不是强制刷新且是第一页无搜索条件）
    if (!forceRefresh && pagination.page === 1 && !searchForm.keyword && !searchForm.platform && !searchForm.trackType && !searchForm.auditStatus) {
      const cached = accountsStore.getData() // 内部已检查isDataValid()
      if (cached) {
        console.log('使用缓存的账号数据')
        accountList.value = cached.list || []
        pagination.total = cached.total || 0
        
        // 显示缓存时间
        const cachedTime = accountsStore.getUpdateTime()
        if (cachedTime) {
          lastUpdateTime.value = cachedTime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        }
        return
      }
    }

    // 2. 缓存过期或无缓存，获取新数据
    loading.value = true
    accountsStore.setLoading(true)
    
    const result = await adminCloudFunctions.getAllAccounts({
      page: pagination.page,
      size: pagination.size,
      ...searchForm
    })

    if (result.result.success) {
      const data = {
        list: result.result.data.list || [],
        total: result.result.data.total || 0
      }
      
      accountList.value = data.list
      pagination.total = data.total
      
      // 3. 更新缓存（只缓存第一页无搜索条件的数据）
      if (pagination.page === 1 && !searchForm.keyword && !searchForm.platform && !searchForm.trackType && !searchForm.auditStatus) {
        accountsStore.setData(data)
      }
      
      // 更新时间
      updatePageTime({ lastUpdateTime }, accountsStore)
    } else {
      ElMessage.error(result.result.message || '获取账号列表失败')
    }
  } catch (error) {
    console.error('加载账号列表失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
    accountsStore.setLoading(false)
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadAccountList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    platform: '',
    trackType: '',
    auditStatus: ''
  })
  handleSearch()
}

// 刷新
const handleRefresh = () => {
  loadAccountList()
}

// 查看账号
const handleView = (row) => {
  dialogTitle.value = '查看账号'
  isViewMode.value = true
  Object.assign(accountForm, row)
  dialogVisible.value = true
}

// 编辑账号
const handleEdit = (row) => {
  dialogTitle.value = '编辑账号'
  isViewMode.value = false
  Object.assign(accountForm, row)
  dialogVisible.value = true
}

// 审核通过
const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要通过账号 "${row.accountNickname}" 的审核吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    // TODO: 调用云函数审核通过
    const result = await adminCloudFunctions.approveAccount({
      accountId: row.accountId,
      userId: row.userId
    })

    if (result.result.success) {
      ElMessage.success('审核通过成功')
      loadAccountList()
    } else {
      ElMessage.error(result.result.message || '审核失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 审核拒绝
const handleReject = async (row) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '拒绝审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝原因'
    })

    // TODO: 调用云函数审核拒绝
    const result = await adminCloudFunctions.rejectAccount({
      accountId: row.accountId,
      userId: row.userId,
      reason: reason
    })

    if (result.result.success) {
      ElMessage.success('审核拒绝成功')
      loadAccountList()
    } else {
      ElMessage.error(result.result.message || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 批量审核通过
const handleBatchApprove = async () => {
  if (selectedAccounts.value.length === 0) return

  try {
    await ElMessageBox.confirm(`确定要批量通过 ${selectedAccounts.value.length} 个账号的审核吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    // TODO: 调用云函数批量审核通过
    const accountIds = selectedAccounts.value.map(item => item.accountId)
    const result = await adminCloudFunctions.batchApproveAccounts({
      accountIds: accountIds
    })

    if (result.result.success) {
      ElMessage.success('批量审核通过成功')
      loadAccountList()
    } else {
      ElMessage.error(result.result.message || '批量审核失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 批量审核拒绝
const handleBatchReject = async () => {
  if (selectedAccounts.value.length === 0) return

  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因', '批量拒绝审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入拒绝原因'
    })

    // TODO: 调用云函数批量审核拒绝
    const accountIds = selectedAccounts.value.map(item => item.accountId)
    const result = await adminCloudFunctions.batchRejectAccounts({
      accountIds: accountIds,
      reason: reason
    })

    if (result.result.success) {
      ElMessage.success('批量审核拒绝成功')
      loadAccountList()
    } else {
      ElMessage.error(result.result.message || '批量操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedAccounts.value = selection
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadAccountList()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  loadAccountList()
}

// 提交表单
const handleSubmit = async () => {
  if (!accountFormRef.value) return

  try {
    const valid = await accountFormRef.value.validate()
    if (!valid) return

    submitLoading.value = true

    // TODO: 调用云函数更新账号信息
    const result = await adminCloudFunctions.updateAccountInfo(accountForm.accountId, accountForm)

    if (result.result.success) {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      loadAccountList()
    } else {
      ElMessage.error(result.result.message || '更新失败')
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    submitLoading.value = false
  }
}

// 对话框关闭
const handleDialogClose = () => {
  resetAccountForm()
}

// 重置账号表单
const resetAccountForm = () => {
  Object.assign(accountForm, {
    accountId: '',
    accountNickname: '',
    userId: '',
    phoneNumber: '',
    platform: '',
    trackType: '',
    auditStatus: '',
    isViolation: false,
    registerDate: '',
    screenshotUrl: '',
    remark: ''
  })
  accountFormRef.value?.clearValidate()
}

onMounted(() => {
  loadAccountList()
})
</script>

<style lang="scss" scoped>
.accounts-page {
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
  
  .screenshot-preview {
    .el-image {
      border-radius: 4px;
      border: 1px solid #dcdfe6;
    }
  }
  
  .no-screenshot {
    padding: 20px;
    text-align: center;
    border: 1px dashed #dcdfe6;
    border-radius: 4px;
    background-color: #fafafa;
  }
  
  .dialog-footer {
    text-align: right;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .accounts-page {
    .search-card {
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