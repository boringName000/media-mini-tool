<template>
  <div class="users-page">
    <div class="page-header">
      <h1>用户管理</h1>
      <p>管理系统中的所有用户信息 | 最后更新：{{ lastUpdateTime }}</p>
    </div>

    <!-- 搜索和操作栏 -->
    <el-card class="search-card" shadow="never">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索用户名、手机号"
            prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="searchForm.status"
            placeholder="用户状态"
            clearable
          >
            <el-option label="全部" value="" />
            <el-option label="正常" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="4">
          <el-button type="primary" @click="handleSearch" :loading="loading">
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户列表 ({{ pagination.total }})</span>
          <div class="header-actions">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              添加用户
            </el-button>
            <el-button @click="handleRefresh" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="userList"
        :loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="userId" label="用户ID" width="120" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column label="账号数量" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.accountCount || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerTime" label="注册时间" width="160" />
        <el-table-column prop="lastLoginTime" label="最后登录" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleView(row)">
              查看
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button
              :type="row.status === 'active' ? 'danger' : 'success'"
              size="small"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '禁用' : '启用' }}
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

    <!-- 用户详情/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userFormRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" :disabled="isViewMode" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" :disabled="isViewMode" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" :disabled="isViewMode" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status" :disabled="isViewMode">
            <el-radio label="active">正常</el-radio>
            <el-radio label="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="userForm.remark"
            type="textarea"
            :rows="3"
            :disabled="isViewMode"
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
import { callCloudFunction } from '@/utils/cloudbase'

// 响应式数据
const loading = ref(false)
const lastUpdateTime = ref('')
const submitLoading = ref(false)
const userList = ref([])
const selectedUsers = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: '',
  dateRange: []
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
const userFormRef = ref()

// 用户表单
const userForm = reactive({
  userId: '',
  username: '',
  phone: '',
  email: '',
  status: 'active',
  remark: ''
})

// 表单验证规则
const userFormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 加载用户列表
const loadUserList = async () => {
  loading.value = true
  try {
    // TODO: 调用云函数获取用户列表
    const result = await callCloudFunction('admin-get-users', {
      page: pagination.page,
      size: pagination.size,
      keyword: searchForm.keyword,
      status: searchForm.status,
      dateRange: searchForm.dateRange
    })

    if (result.result.success) {
      userList.value = result.result.data.list || []
      pagination.total = result.result.data.total || 0
      
      // 更新数据更新时间
      lastUpdateTime.value = new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } else {
      ElMessage.error(result.result.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadUserList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    status: '',
    dateRange: []
  })
  handleSearch()
}

// 刷新
const handleRefresh = () => {
  loadUserList()
}

// 添加用户
const handleAdd = () => {
  dialogTitle.value = '添加用户'
  isViewMode.value = false
  resetUserForm()
  dialogVisible.value = true
}

// 查看用户
const handleView = (row) => {
  dialogTitle.value = '查看用户'
  isViewMode.value = true
  Object.assign(userForm, row)
  dialogVisible.value = true
}

// 编辑用户
const handleEdit = (row) => {
  dialogTitle.value = '编辑用户'
  isViewMode.value = false
  Object.assign(userForm, row)
  dialogVisible.value = true
}

// 切换用户状态
const handleToggleStatus = async (row) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定要${action}用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // TODO: 调用云函数更新用户状态
    const result = await callCloudFunction('admin-update-user-status', {
      userId: row.userId,
      status: row.status === 'active' ? 'disabled' : 'active'
    })

    if (result.result.success) {
      ElMessage.success(`${action}成功`)
      loadUserList()
    } else {
      ElMessage.error(result.result.message || `${action}失败`)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新用户状态失败:', error)
      ElMessage.error('操作失败，请重试')
    }
  }
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  loadUserList()
}

// 页码变化
const handlePageChange = (page) => {
  pagination.page = page
  loadUserList()
}

// 提交表单
const handleSubmit = async () => {
  if (!userFormRef.value) return

  try {
    const valid = await userFormRef.value.validate()
    if (!valid) return

    submitLoading.value = true

    // TODO: 调用云函数保存用户信息
    const isEdit = !!userForm.userId
    const result = await callCloudFunction(
      isEdit ? 'admin-update-user' : 'admin-create-user',
      userForm
    )

    if (result.result.success) {
      ElMessage.success(isEdit ? '更新成功' : '创建成功')
      dialogVisible.value = false
      loadUserList()
    } else {
      ElMessage.error(result.result.message || '操作失败')
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
  resetUserForm()
}

// 重置用户表单
const resetUserForm = () => {
  Object.assign(userForm, {
    userId: '',
    username: '',
    phone: '',
    email: '',
    status: 'active',
    remark: ''
  })
  userFormRef.value?.clearValidate()
}

onMounted(() => {
  loadUserList()
})
</script>

<style lang="scss" scoped>
.users-page {
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
  
  .dialog-footer {
    text-align: right;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .users-page {
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