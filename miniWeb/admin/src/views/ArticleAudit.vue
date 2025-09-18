<template>
  <div class="expired-task-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>过期文章任务管理</h1>
      <p>管理用户过期没有按时回传的文章任务，查看文章任务统计信息 | 最后更新：{{ lastUpdateTime }}</p>
    </div>

    <!-- 数据纵览 -->
    <el-card class="overview-card" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">数据纵览</span>
          <div class="header-actions">
            <el-button type="primary" @click="() => fetchExpiredTasks(true)" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="overview-content">
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon users">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ filteredGroupedUsers.length }}</div>
                <div class="stat-label">过期文章任务用户</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon tasks">
                <el-icon><Document /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ totalAccountsWithExpiredTasks }}</div>
                <div class="stat-label">过期文章任务账号</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon accounts">
                <el-icon><Avatar /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ moderateExpiredCount }}</div>
                <div class="stat-label">严重过期时间 (>3天)</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon severe">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ severeExpiredCount }}</div>
                <div class="stat-label">严重过期时间 (>7天)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="filterForm" inline class="filter-form">
        <!-- 第一行：平台和赛道 -->
        <el-row class="filter-row" :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="平台类型">
              <el-select 
                v-model="filterForm.platformType" 
                :placeholder="filterForm.platformType ? getSelectedPlatformDisplay() : '选择平台类型'"
                clearable
                style="width: 160px"
              >
                <el-option 
                  v-for="platform in platformOptions" 
                  :key="platform.value" 
                  :label="platform.label" 
                  :value="platform.value"
                >
                  <span v-if="platform.icon" class="option-with-icon">
                    <span class="option-icon">{{ platform.icon }}</span>
                    <span>{{ platform.label }}</span>
                  </span>
                  <span v-else>{{ platform.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="赛道类型">
              <el-select 
                v-model="filterForm.trackType" 
                :placeholder="filterForm.trackType ? getSelectedTrackDisplay() : '选择赛道类型'"
                clearable
                style="width: 160px"
              >
                <el-option 
                  v-for="track in trackTypeOptions" 
                  :key="track.value" 
                  :label="track.label" 
                  :value="track.value"
                >
                  <span v-if="track.icon" class="option-with-icon">
                    <span class="option-icon">{{ track.icon }}</span>
                    <span>{{ track.label }}</span>
                  </span>
                  <span v-else>{{ track.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="过期天数">
              <el-select 
                v-model="filterForm.expiredDays" 
                :placeholder="filterForm.expiredDays ? getExpiredDaysLabel(filterForm.expiredDays) : '选择过期天数'"
                clearable
                style="width: 160px"
              >
                <el-option label="1-3天" value="1-3" />
                <el-option label="4-7天" value="4-7" />
                <el-option label="超过7天" value="7+" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="搜索">
              <el-input
                v-model="filterForm.searchKeyword"
                placeholder="用户ID/用户名/手机号"
                clearable
                style="width: 100%"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 第三行：操作按钮 -->
        <el-row class="filter-actions">
          <el-col>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
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

    <!-- 用户列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>过期没回传文章任务用户列表 ({{ filteredGroupedUsers.length }} 用户，{{ filteredUserList.length }} 任务)</span>
          <div class="header-actions">
            <el-button type="danger" @click="handleBatchReject" :disabled="!selectedUsers.length">
              <el-icon><Close /></el-icon>
              批量拒绝
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table
          :data="paginatedGroupedUsers"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          stripe
          empty-text="暂无过期任务数据"
          :default-sort="{ prop: 'totalExpiredTasks', order: 'descending' }"
          row-key="userId"
          :expand-row-keys="expandedRows"
          @expand-change="handleExpandChange"
          class="user-table"
          style="width: 100%"
        >
        <el-table-column type="expand" width="50">
          <template #default="{ row }">
            <div class="expanded-content">
              <div class="account-header">
                <h4>{{ row.username }} 的账号详情 ({{ row.accounts.length }} 个账号)</h4>
              </div>
              <el-table :data="row.accounts" size="small" class="account-table">
                <el-table-column prop="accountNickname" label="账号昵称" width="150" show-overflow-tooltip />
                <el-table-column prop="platformType" label="平台" width="100" align="center">
                  <template #default="{ row: account }">
                    <el-tag size="small">{{ getPlatformName(account.platformType) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="trackType" label="赛道" width="100" align="center">
                  <template #default="{ row: account }">
                    <el-tag size="small">{{ getTrackTypeName(account.trackType) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="phoneNumber" label="账号手机" width="130" show-overflow-tooltip />
                <el-table-column prop="expiredTasksCount" label="过期文章数" width="100" align="center">
                  <template #default="{ row: account }">
                    <el-tag type="danger" size="small">{{ account.expiredTasksCount }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="过期时间" width="120" align="center">
                  <template #default="{ row: account }">
                    <el-tag :type="getExpiredDaysTagType(account.maxExpiredDays)" size="small">
                      {{ account.maxExpiredDays }}天
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center">
                  <template #default="{ row: account }">
                    <el-button type="primary" size="small" @click="showAccountTasks(account)">
                      查看任务
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="userId" label="用户ID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" min-width="150" show-overflow-tooltip />
        <el-table-column prop="phone" label="手机号" min-width="130" show-overflow-tooltip />
        <el-table-column prop="totalAccounts" label="账号数" width="100" align="center" />
        <el-table-column prop="accountsWithExpiredTasks" label="过期文章账号" width="140" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">{{ row.accountsWithExpiredTasks }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" width="120" align="center" sortable="maxExpiredDays">
          <template #default="{ row }">
            <el-tag :type="getExpiredDaysTagType(row.maxExpiredDays)" size="small">
              {{ row.maxExpiredDays }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              @click="handleRejectUserTasks(row)"
            >
              拒绝全部
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
            :total="filteredGroupedUsers.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 账号任务详情弹窗 -->
    <el-dialog
      v-model="taskDialogVisible"
      :title="`${selectedAccount?.accountNickname} 的过期任务详情`"
      width="80%"
      :before-close="handleCloseTaskDialog"
    >
      <el-table :data="selectedAccountTasks" stripe>
        <el-table-column prop="taskTitle" label="任务标题" show-overflow-tooltip />
        <el-table-column prop="taskTime" label="任务时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.taskTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="expiredDays" label="过期天数" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getExpiredDaysTagType(row.expiredDays)" size="small">
              {{ row.expiredDays }}天
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="任务状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.taskStatus || '待处理' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="领取状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success" size="small">{{ row.claimStatus || '已领取' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="danger" size="small" @click="handleRejectTask(row)">
              拒绝任务
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Refresh, 
  Close, 
  User, 
  Document, 
  Avatar, 
  Warning 
} from '@element-plus/icons-vue'
import { adminCloudFunctions } from '@/utils/cloudbase'
import { articleAuditStore } from '@/store'
import { getPlatformName, getPlatformOptions } from '@/utils/platformUtils'
import { getTrackTypeName, getTrackTypeOptions } from '@/utils/trackTypeUtils'
import { formatTime, updatePageTime } from '@/utils/timeUtils'

// 响应式数据
const loading = ref(false)
const cachedData = ref([])
const expandedRows = ref([])
const selectedUsers = ref([])
const taskDialogVisible = ref(false)
const selectedAccount = ref(null)
const selectedAccountTasks = ref([])

// 页面更新时间
const lastUpdateTime = ref('')

// 更新页面时间（使用封装的工具函数）
const updateLastUpdateTime = () => {
  updatePageTime({ lastUpdateTime }, articleAuditStore)
}

// 筛选表单
const filterForm = ref({
  platformType: '',
  trackType: '',
  expiredDays: '',
  searchKeyword: ''
})

// 分页
const pagination = ref({
  page: 1,
  size: 20
})

// 使用工具函数获取选项
const platformOptions = getPlatformOptions()
const trackTypeOptions = getTrackTypeOptions()

// 计算属性
const filteredUserList = computed(() => {
  if (!cachedData.value || cachedData.value.length === 0) return []
  
  let filtered = [...cachedData.value]
  
  // 平台筛选
  if (filterForm.value.platformType) {
    filtered = filtered.filter(item => item.platform === filterForm.value.platformType)
  }
  
  // 赛道筛选
  if (filterForm.value.trackType) {
    filtered = filtered.filter(item => item.trackType === filterForm.value.trackType)
  }
  
  // 过期天数筛选
  if (filterForm.value.expiredDays) {
    const [min, max] = filterForm.value.expiredDays === '7+' 
      ? [7, Infinity] 
      : filterForm.value.expiredDays.split('-').map(Number)
    
    filtered = filtered.filter(item => {
      const days = item.expiredDays
      return days >= min && (max === Infinity ? true : days <= max)
    })
  }
  
  // 关键词搜索
  if (filterForm.value.searchKeyword) {
    const keyword = filterForm.value.searchKeyword.toLowerCase()
    filtered = filtered.filter(item => 
      item.userId?.toLowerCase().includes(keyword) ||
      item.userNickname?.toLowerCase().includes(keyword) ||
      item.userPhone?.includes(keyword) ||
      item.accountNickname?.toLowerCase().includes(keyword) ||
      item.taskTitle?.toLowerCase().includes(keyword)
    )
  }
  
  return filtered
})

const filteredGroupedUsers = computed(() => {
  const userMap = new Map()
  
  filteredUserList.value.forEach(item => {
    const userId = item.userId
    
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId: item.userId,
        username: item.userNickname,
        phone: item.userPhone,
        accounts: [],
        totalAccounts: 0,
        accountsWithExpiredTasks: 0,
        totalExpiredTasks: 0,
        maxExpiredDays: 0
      })
    }
    
    const user = userMap.get(userId)
    
    // 查找或创建账号
    let account = user.accounts.find(acc => acc.accountId === item.accountId)
    if (!account) {
      account = {
        accountId: item.accountId,
        accountNickname: item.accountNickname,
        platformType: item.platform,
        trackType: item.trackType,
        phoneNumber: item.userPhone,
        expiredTasks: [],
        expiredTasksCount: 0,
        maxExpiredDays: 0
      }
      user.accounts.push(account)
    }
    
    // 添加任务到账号
    account.expiredTasks.push({
      taskId: item.taskId,
      taskTitle: item.taskTitle,
      expiredDays: item.expiredDays,
      taskTime: item.taskTime || new Date().toISOString()
    })
    
    account.expiredTasksCount = account.expiredTasks.length
    account.maxExpiredDays = Math.max(account.maxExpiredDays, item.expiredDays)
    
    // 更新用户统计
    user.totalExpiredTasks++
    user.maxExpiredDays = Math.max(user.maxExpiredDays, item.expiredDays)
  })
  
  // 完善用户统计
  userMap.forEach(user => {
    user.totalAccounts = user.accounts.length
    user.accountsWithExpiredTasks = user.accounts.filter(acc => acc.expiredTasksCount > 0).length
  })
  
  return Array.from(userMap.values()).sort((a, b) => b.totalExpiredTasks - a.totalExpiredTasks)
})

const paginatedGroupedUsers = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.size
  const end = start + pagination.value.size
  return filteredGroupedUsers.value.slice(start, end)
})

const totalExpiredTasks = computed(() => {
  return filteredUserList.value.length
})

const totalAccountsWithExpiredTasks = computed(() => {
  const accountIds = new Set()
  filteredUserList.value.forEach(item => {
    if (item.accountId) {
      accountIds.add(item.accountId)
    }
  })
  return accountIds.size
})

const moderateExpiredCount = computed(() => {
  return filteredUserList.value.filter(item => item.expiredDays > 3).length
})

const severeExpiredCount = computed(() => {
  return filteredUserList.value.filter(item => item.expiredDays > 7).length
})

// 方法
const fetchExpiredTasks = async (forceRefresh = false) => {
  try {
    // 1. 检查缓存（如果不是强制刷新）
    if (!forceRefresh) {
      const cached = articleAuditStore.getData() // 内部已检查isDataValid()
      if (cached) {
        console.log('[ArticleAudit] 使用缓存数据')
        cachedData.value = cached
        
        // 显示缓存时间
        const cachedTime = articleAuditStore.getUpdateTime()
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
    articleAuditStore.setLoading(true)
    console.log('开始获取过期任务数据...')
    
    const result = await adminCloudFunctions.getExpiredTaskUsers({
      includeUserInfo: true
    })
    console.log('云函数返回结果:', result)
    
    if (result.result && result.result.success && result.result.data && result.result.data.users) {
      console.log('原始用户数据:', result.result.data.users)
      
      // 将嵌套的用户-账号-任务数据扁平化
      const flattened = flattenUserData(result.result.data.users)
      console.log('扁平化后的数据:', flattened)
      
      // 3. 更新数据、缓存、store、时间
      cachedData.value = flattened
      articleAuditStore.setData(flattened)
      updatePageTime({ lastUpdateTime }, articleAuditStore)
      
      ElMessage.success(`获取成功，共 ${flattened.length} 条过期任务`)
    } else {
      console.error('数据格式错误:', result)
      ElMessage.error(result.result?.message || '获取过期任务失败')
      cachedData.value = []
    }
  } catch (error) {
    console.error('获取过期任务失败:', error)
    ElMessage.error('获取过期任务失败: ' + error.message)
    cachedData.value = []
  } finally {
    loading.value = false
    articleAuditStore.setLoading(false)
  }
}

const flattenUserData = (users) => {
  const flattened = []
  
  users.forEach(user => {
    user.accounts?.forEach(account => {
      account.expiredTasks?.forEach(task => {
        flattened.push({
          // 用户信息
          userId: user.userId,
          userNickname: user.nickname,
          userPhone: user.phone,
          // 账号信息  
          accountId: account.accountId,
          accountNickname: account.accountNickname,
          platform: task.platformType || account.platform,
          trackType: task.trackType || account.trackType,
          // 任务信息
          taskId: task.articleId,
          taskTitle: task.articleTitle,
          expiredDays: task.expiredDays,
          taskTime: task.taskTime || new Date().toISOString()
        })
      })
    })
  })
  
  return flattened
}

const handleSearch = () => {
  pagination.value.page = 1
}

const handleReset = () => {
  filterForm.value = {
    platformType: '',
    trackType: '',
    expiredDays: '',
    searchKeyword: ''
  }
  pagination.value.page = 1
}

const handleExpandChange = (row, expandedRowsData) => {
  if (expandedRowsData.includes(row)) {
    if (!expandedRows.value.includes(row.userId)) {
      expandedRows.value.push(row.userId)
    }
  } else {
    const index = expandedRows.value.indexOf(row.userId)
    if (index > -1) {
      expandedRows.value.splice(index, 1)
    }
  }
}

const handleSelectionChange = (selection) => {
  selectedUsers.value = selection
}

const handleSizeChange = (size) => {
  pagination.value.size = size
  pagination.value.page = 1
}

const handlePageChange = (page) => {
  pagination.value.page = page
}

const showAccountTasks = (account) => {
  // 需要从原始数据中找到对应的用户信息
  const user = filteredGroupedUsers.value.find(u => 
    u.accounts.some(acc => acc.accountId === account.accountId)
  )
  
  selectedAccount.value = {
    ...account,
    userId: user?.userId
  }
  selectedAccountTasks.value = account.expiredTasks || []
  taskDialogVisible.value = true
}

const handleCloseTaskDialog = () => {
  taskDialogVisible.value = false
  selectedAccount.value = null
  selectedAccountTasks.value = []
}

// 分批处理任务的辅助函数
const processBatchTasks = async (tasks, batchSize = 15) => {
  const results = {
    successfulOperations: 0,
    failedOperations: 0,
    errors: []
  }
  
  // 将任务分批
  const batches = []
  for (let i = 0; i < tasks.length; i += batchSize) {
    batches.push(tasks.slice(i, i + batchSize))
  }
  
  console.log(`开始分批处理 ${tasks.length} 个任务，共 ${batches.length} 批，每批最多 ${batchSize} 个`)
  
  // 逐批处理
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`处理第 ${i + 1}/${batches.length} 批，包含 ${batch.length} 个任务`)
    
    try {
      const result = await adminCloudFunctions.adminRemoveTask({ tasks: batch })
      
      // 修正数据结构解析：云函数返回的是 result.result.success 和 result.result.data
      if (result.result && result.result.success && result.result.data) {
        results.successfulOperations += result.result.data.successfulOperations || 0
        results.failedOperations += result.result.data.failedOperations || 0
      } else {
        results.failedOperations += batch.length
        results.errors.push(`第 ${i + 1} 批处理失败: ${result.result?.message || result.error || '未知错误'}`)
      }
    } catch (error) {
      console.error(`第 ${i + 1} 批处理异常:`, error)
      results.failedOperations += batch.length
      results.errors.push(`第 ${i + 1} 批处理异常: ${error.message}`)
    }
    
    // 批次间稍作延迟，避免请求过于频繁
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}

const handleRejectTask = async (task) => {
  try {
    await ElMessageBox.confirm(
      `确定要拒绝任务"${task.taskTitle}"吗？`,
      '确认拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 调用云函数拒绝单个任务
    const tasks = [{
      userId: selectedAccount.value.userId || task.userId,
      accountId: selectedAccount.value.accountId,
      articleId: task.taskId
    }]
    
    const result = await adminCloudFunctions.adminRemoveTask({ tasks })
    
    // 修正数据结构解析：云函数返回的是 result.result.success
    if (result.result && result.result.success) {
      ElMessage.success('任务已拒绝')
      // 刷新数据
      await fetchExpiredTasks(true)
      handleCloseTaskDialog()
    } else {
      throw new Error(result.result?.message || result.error || '拒绝任务失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝任务失败:', error)
      ElMessage.error(error.message || '拒绝任务失败')
    }
  } finally {
    loading.value = false
  }
}

const handleRejectUserTasks = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要拒绝用户"${user.username}"的所有过期任务吗？共 ${user.totalExpiredTasks} 个任务。`,
      '确认批量拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 收集该用户的所有过期任务
    const tasks = []
    user.accounts.forEach(account => {
      if (account.expiredTasks && account.expiredTasks.length > 0) {
        account.expiredTasks.forEach(task => {
          tasks.push({
            userId: user.userId,
            accountId: account.accountId,
            articleId: task.taskId
          })
        })
      }
    })
    
    if (tasks.length === 0) {
      ElMessage.warning('该用户没有过期任务')
      return
    }
    
    // 使用分批处理拒绝任务
    const result = await processBatchTasks(tasks)
    
    // 显示处理结果
    if (result.successfulOperations > 0) {
      ElMessage.success(
        `已拒绝用户 ${user.username} 的任务：成功 ${result.successfulOperations} 个，失败 ${result.failedOperations} 个`
      )
      // 刷新数据
      await fetchExpiredTasks(true)
    } else {
      throw new Error('所有任务处理失败')
    }
    
    // 如果有错误，显示详细信息
    if (result.errors.length > 0) {
      console.warn('处理过程中的错误:', result.errors)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('拒绝用户任务失败:', error)
      ElMessage.error(error.message || '批量拒绝失败')
    }
  } finally {
    loading.value = false
  }
}

const handleBatchReject = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请先选择要操作的用户')
    return
  }
  
  try {
    const totalTasks = selectedUsers.value.reduce((sum, user) => sum + user.totalExpiredTasks, 0)
    
    await ElMessageBox.confirm(
      `确定要拒绝选中的 ${selectedUsers.value.length} 个用户的所有过期任务吗？共 ${totalTasks} 个任务。`,
      '确认批量拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    // 收集所有选中用户的过期任务
    const tasks = []
    selectedUsers.value.forEach(user => {
      user.accounts.forEach(account => {
        if (account.expiredTasks && account.expiredTasks.length > 0) {
          account.expiredTasks.forEach(task => {
            tasks.push({
              userId: user.userId,
              accountId: account.accountId,
              articleId: task.taskId
            })
          })
        }
      })
    })
    
    if (tasks.length === 0) {
      ElMessage.warning('选中的用户没有过期任务')
      return
    }
    
    // 使用分批处理拒绝任务
    const result = await processBatchTasks(tasks)
    
    // 显示处理结果
    if (result.successfulOperations > 0) {
      ElMessage.success(
        `批量拒绝完成：成功 ${result.successfulOperations} 个，失败 ${result.failedOperations} 个`
      )
      
      // 清空选择
      selectedUsers.value = []
      
      // 刷新数据
      await fetchExpiredTasks(true)
    } else {
      throw new Error('所有任务处理失败')
    }
    
    // 如果有错误，显示详细信息
    if (result.errors.length > 0) {
      console.warn('批量处理过程中的错误:', result.errors)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量拒绝失败:', error)
      ElMessage.error(error.message || '批量拒绝失败')
    }
  } finally {
    loading.value = false
  }
}

// 辅助方法 - 使用工具函数
// getPlatformName 和 getTrackTypeName 已从工具函数导入

const getSelectedPlatformDisplay = () => {
  const option = platformOptions.find(opt => opt.value === filterForm.value.platformType)
  return option ? `${option.icon || ''} ${option.label}` : ''
}

const getSelectedTrackDisplay = () => {
  const option = trackTypeOptions.find(opt => opt.value === filterForm.value.trackType)
  return option ? `${option.icon || ''} ${option.label}` : ''
}

const getExpiredDaysLabel = (value) => {
  const labels = {
    '1-3': '1-3天',
    '4-7': '4-7天',
    '7+': '超过7天'
  }
  return labels[value] || value
}

const getExpiredDaysTagType = (days) => {
  if (days <= 3) return 'warning'
  if (days <= 7) return 'danger'
  return 'info'
}

// 生命周期
onMounted(() => {
  // 初始化页面时间
  updateLastUpdateTime()
  // 尝试从store获取缓存数据，如果没有或过期则重新获取
  fetchExpiredTasks()
})

// 监听筛选条件变化
watch(
  () => [filterForm.value.platformType, filterForm.value.trackType, filterForm.value.expiredDays],
  () => {
    pagination.value.page = 1
  }
)
</script>

<style lang="scss" scoped>
.expired-task-page {
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

  .overview-card {
    margin-bottom: 20px;
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
      
      .header-actions {
        display: flex;
        gap: 10px;
      }
    }
    
    .overview-content {
      .stat-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        
        .stat-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 120px;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
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
              
              &.users {
                background: #409eff;
              }
              
              &.tasks {
                background: #e6a23c;
              }
              
              &.accounts {
                background: #67c23a;
              }
              
              &.severe {
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
    }
  }

  /* 选项图标样式 */
  .option-with-icon,
  .selected-option {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .option-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }
  }

  .filter-card {
    margin-bottom: 20px;
    
    .filter-form {
      .filter-row {
        margin-bottom: 0;
      }
      
      .filter-actions {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #EBEEF5;
      }
      
      .el-form-item {
        margin-bottom: 16px;
        
        :deep(.el-form-item__label) {
          font-weight: 600;
          color: #303133;
        }
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
    
    .user-table {
      width: 100%;
      
      :deep(.el-table) {
        width: 100% !important;
        table-layout: fixed;
      }
      
      :deep(.el-table__header-wrapper) {
        width: 100%;
      }
      
      :deep(.el-table__body-wrapper) {
        width: 100%;
      }
      
      :deep(.el-table__header) {
        width: 100%;
        
        th {
          background-color: #F5F7FA;
          font-weight: 600;
          color: #303133;
        }
      }
      
      :deep(.el-table__body) {
        width: 100%;
        
        tr {
          &:hover > td {
            background-color: #F5F7FA;
          }
        }
      }
      
      :deep(.el-table__expand-icon) {
        color: #409EFF;
      }
    }
    
    .expanded-content {
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin: 12px 0;
      border: 1px solid #E4E7ED;
      
      .account-header {
        margin-bottom: 20px;
        
        h4 {
          margin: 0;
          color: #303133;
          font-size: 16px;
          font-weight: 600;
        }
      }
      
      .account-table {
        background-color: #fff;
        border-radius: 6px;
        overflow: hidden;
        
        :deep(.el-table) {
          border: 1px solid #EBEEF5;
        }
        
        :deep(.el-table__header) {
          th {
            background-color: #F5F7FA;
            font-weight: 600;
            color: #303133;
          }
        }
        
        :deep(.el-table__body) {
          tr:hover > td {
            background-color: #F5F7FA;
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .overview-section {
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      
      .header-actions {
        width: 100%;
        
        .el-button {
          width: 100%;
        }
      }
    }
    
    .overview-content {
      .stat-cards {
        grid-template-columns: 1fr;
        gap: 12px;
        
        .stat-card {
          padding: 16px;
          
          .stat-content {
            gap: 12px;
            
            .stat-icon {
              width: 40px;
              height: 40px;
              
              .el-icon {
                font-size: 20px;
              }
            }
            
            .stat-info {
              .stat-number {
                font-size: 24px;
              }
            }
          }
        }
      }
    }
  }
  
  .filter-card {
    .filter-row {
      margin-bottom: 12px;
    }
    
    .el-form-item {
      margin-bottom: 12px;
      
      :deep(.el-form-item__content) {
        width: 100%;
      }
    }
  }
  
  .expanded-content {
    padding: 16px;
    
    .account-table {
      font-size: 12px;
      
      :deep(.el-table__cell) {
        padding: 8px 4px;
      }
    }
  }
}

/* 修复表格宽度和分页边距 */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.user-table {
  width: 100% !important;
  min-width: 100%;
}

.pagination-wrapper {
  margin-top: 16px;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
}

/* 确保表格完全填充容器 */
.table-card :deep(.el-card__body) {
  padding: 20px;
}

.table-card :deep(.el-table) {
  width: 100% !important;
  table-layout: auto;
}

.table-card :deep(.el-table__header-wrapper),
.table-card :deep(.el-table__body-wrapper) {
  width: 100% !important;
}

.table-card :deep(.el-table__header),
.table-card :deep(.el-table__body) {
  width: 100% !important;
}
</style>