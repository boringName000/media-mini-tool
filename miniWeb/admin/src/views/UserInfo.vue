<template>
  <div class="user-info-page">
    <!-- 1. 页面标题 -->
    <div class="page-header">
      <div class="header-content">
        <h1>用户信息管理</h1>
        <p>查看和管理系统中的所有用户信息 | 最后更新：{{ lastUpdateTime }}</p>
      </div>
    </div>

    <!-- 2. 数据纵览 -->
    <el-card class="overview-section" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">数据纵览</span>
          <el-button 
            type="primary" 
            @click="handleRefresh" 
            :loading="loading" 
            size="default"
            class="refresh-button"
          >
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </template>
      
      <div class="overview-content">
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewData.totalUsers }}</div>
                <div class="stat-label">总用户数</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon with-accounts">
                <el-icon><Wallet /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewData.usersWithAccounts }}</div>
                <div class="stat-label">有账号用户</div>
              </div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon disabled">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewData.disabledUsers }}</div>
                <div class="stat-label">禁用用户</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 3. 搜索和操作栏 -->
    <el-card class="search-card" shadow="never">
      <!-- 服务器过滤区域 -->
      <div class="server-filters">
        <div class="filter-title">
          <el-icon><Download /></el-icon>
          服务器条件搜索
        </div>
        <el-form :model="serverFilters" inline class="server-filter-form">
          <el-form-item label="用户状态">
            <el-select 
              v-model="serverFilters.status" 
              placeholder="全部"
              style="width: 150px"
              @change="handleServerFilterChange"
            >
              <el-option label="全部" value="" />
              <el-option label="正常" value="1" />
              <el-option label="禁用" value="0" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="账号状态">
            <el-select 
              v-model="serverFilters.hasAccounts" 
              placeholder="全部"
              style="width: 150px"
              @change="handleServerFilterChange"
            >
              <el-option label="全部" value="" />
              <el-option label="有账号" :value="true" />
              <el-option label="无账号" :value="false" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="openUserSearchPanel">
              <el-icon><Search /></el-icon>
              搜索指定用户
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-divider />

      <!-- 本地数据过滤区域 -->
      <div class="local-filters">
        <div class="filter-title">
          <el-icon><Filter /></el-icon>
          已搜索本地数据过滤
        </div>
        <el-form :model="localFilters" inline class="local-filter-form">
          <el-form-item label="用户信息">
            <el-input
              v-model="localFilters.keyword"
              placeholder="用户名/电话/用户ID"
              clearable
              style="width: 200px"
              @input="handleLocalFilterChange"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="赛道类型">
            <el-select 
              v-model="localFilters.trackType" 
              placeholder="全部赛道"
              clearable
              style="width: 150px"
              @change="handleLocalFilterChange"
            >
              <el-option 
                v-for="track in trackTypeOptions" 
                :key="track.value" 
                :label="track.label" 
                :value="track.value"
              >
                <span v-if="track.icon" class="option-with-icon">
                  <span class="option-icon">{{ track.icon }}</span>
                  <span class="option-label">{{ track.label }}</span>
                </span>
                <span v-else>{{ track.label }}</span>
              </el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="平台类型">
            <el-select 
              v-model="localFilters.platformType" 
              placeholder="全部平台"
              clearable
              style="width: 150px"
              @change="handleLocalFilterChange"
            >
              <el-option 
                v-for="platform in platformOptions" 
                :key="platform.value" 
                :label="platform.label" 
                :value="platform.value"
              >
                <span v-if="platform.icon" class="option-with-icon">
                  <span class="option-icon">{{ platform.icon }}</span>
                  <span class="option-label">{{ platform.label }}</span>
                </span>
                <span v-else>{{ platform.label }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 4. 用户信息列表 -->
    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">用户信息列表</span>
          <div class="header-info">
            <span class="total-count">共 {{ pagination.total }} 条记录</span>
          </div>
        </div>
      </template>

      <el-table 
        :data="filteredUserList" 
        v-loading="loading"
        stripe
        style="width: 100%; table-layout: auto;"
        :default-sort="{ prop: 'lastUpdateTimestamp', order: 'descending' }"
        row-key="userId"
        :expand-row-keys="expandedRows"
        @expand-change="handleExpandChange"
      >
        <!-- 展开列 -->
        <el-table-column type="expand" width="50">
          <template #default="{ row }">
            <div class="account-details">
              <div v-if="row.accounts && row.accounts.length > 0" class="account-details-content">
                <h4 class="account-details-title">账号详情 ({{ row.accounts.length }}个)</h4>
                <el-table 
                  :data="row.accounts" 
                  size="small"
                  stripe
                  style="width: 100%; table-layout: auto;"
                  class="account-details-table"
                >
                  <!-- 账号ID -->
                  <el-table-column prop="accountId" label="账号ID" min-width="120" align="center">
                    <template #default="{ row: account }">
                      <el-tooltip :content="account.accountId || '未设置'" placement="top">
                        <el-text class="account-id">{{ truncateText(account.accountId, 10) }}</el-text>
                      </el-tooltip>
                    </template>
                  </el-table-column>

                  <!-- 账号名称 -->
                  <el-table-column prop="accountNickname" label="账号名称" min-width="140" align="center">
                    <template #default="{ row: account }">
                      <el-text>{{ account.accountNickname || '未设置' }}</el-text>
                    </template>
                  </el-table-column>

                  <!-- 账号手机 -->
                  <el-table-column prop="phoneNumber" label="账号手机" min-width="130" align="center">
                    <template #default="{ row: account }">
                      <el-text>{{ account.phoneNumber || '未设置' }}</el-text>
                    </template>
                  </el-table-column>

                  <!-- 当前账号收益 -->
                  <el-table-column prop="currentAccountEarnings" label="当前收益" min-width="100" align="center">
                    <template #default="{ row: account }">
                      <el-text class="earnings">¥{{ (account.currentAccountEarnings || 0).toFixed(2) }}</el-text>
                    </template>
                  </el-table-column>

                  <!-- 总发文数 -->
                  <el-table-column prop="posts" label="总发文数" min-width="90" align="center">
                    <template #default="{ row: account }">
                      <el-text class="post-count">{{ (account.posts || []).length }}</el-text>
                    </template>
                  </el-table-column>

                  <!-- 总拒绝文数 -->
                  <el-table-column prop="rejectPosts" label="总拒绝文数" min-width="100" align="center">
                    <template #default="{ row: account }">
                      <el-text class="reject-count">{{ (account.rejectPosts || []).length }}</el-text>
                    </template>
                  </el-table-column>

                  <!-- 平台类型 -->
                  <el-table-column prop="platform" label="平台类型" min-width="120" align="center">
                    <template #default="{ row: account }">
                      <div class="platform-cell">
                        <span class="platform-icon">{{ getPlatformIcon(account.platform) }}</span>
                        <span class="platform-name">{{ getPlatformName(account.platform) }}</span>
                      </div>
                    </template>
                  </el-table-column>

                  <!-- 赛道类型 -->
                  <el-table-column prop="trackType" label="赛道类型" min-width="120" align="center">
                    <template #default="{ row: account }">
                      <div class="track-cell">
                        <span class="track-icon">{{ getTrackTypeIcon(account.trackType) }}</span>
                        <span class="track-name">{{ getTrackTypeName(account.trackType) }}</span>
                      </div>
                    </template>
                  </el-table-column>

                  <!-- 状态 -->
                  <el-table-column prop="status" label="状态" min-width="80" align="center">
                    <template #default="{ row: account }">
                      <el-tag 
                        :type="account.status === 1 ? 'success' : 'danger'" 
                        size="small"
                      >
                        {{ account.status === 1 ? '正常' : '禁用' }}
                      </el-tag>
                    </template>
                  </el-table-column>

                  <!-- 审核状态 -->
                  <el-table-column prop="auditStatus" label="审核状态" min-width="100" align="center">
                    <template #default="{ row: account }">
                      <el-tag 
                        :type="getAccountStatusType(account.auditStatus)" 
                        size="small"
                      >
                        {{ getAuditStatusText(account.auditStatus) }}
                      </el-tag>
                    </template>
                  </el-table-column>

                  <!-- 最后发文时间 -->
                  <el-table-column prop="lastPostTime" label="最后发文时间" min-width="160" align="center">
                    <template #default="{ row: account }">
                      <el-text size="small">{{ formatTime(account.lastPostTime) || '暂无发文' }}</el-text>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else class="no-accounts">
                <el-empty description="该用户暂无账号信息" :image-size="80" />
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- 用户ID -->
        <el-table-column prop="userId" label="用户ID" min-width="140" fixed="left" align="center">
          <template #default="{ row }">
            <el-tooltip :content="row.userId || '未设置'" placement="top">
              <el-text class="user-id">{{ truncateText(row.userId, 10) }}</el-text>
            </el-tooltip>
          </template>
        </el-table-column>

        <!-- 昵称 -->
        <el-table-column prop="nickname" label="昵称" min-width="160" align="center">
          <template #default="{ row }">
            <el-text>{{ row.nickname || '未设置' }}</el-text>
          </template>
        </el-table-column>

        <!-- 手机号码 -->
        <el-table-column prop="phone" label="手机号码" min-width="130" align="center">
          <template #default="{ row }">
            <el-text>{{ row.phone || '-' }}</el-text>
          </template>
        </el-table-column>

        <!-- 状态 -->
        <el-table-column prop="status" label="状态" min-width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 注册时间 -->
        <el-table-column prop="registerTimestamp" label="注册时间" min-width="160" align="center">
          <template #default="{ row }">
            <el-text size="small">{{ formatTime(row.registerTimestamp) }}</el-text>
          </template>
        </el-table-column>

        <!-- 最后更新时间 -->
        <el-table-column prop="lastUpdateTimestamp" label="最后更新时间" min-width="160" align="center">
          <template #default="{ row }">
            <el-text size="small">{{ formatTime(row.lastUpdateTimestamp) }}</el-text>
          </template>
        </el-table-column>

        <!-- 账号数 -->
        <el-table-column label="账号数" min-width="80" align="center">
          <template #default="{ row }">
            <el-text>{{ (row.accounts || []).length }}</el-text>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          :page-count="availablePageCount"
          :disabled="loading"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 用户搜索面板 -->
    <UserSearchPanel
      v-model="showUserSearchPanel"
      :view-type="2"
      @close="showUserSearchPanel = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, Wallet, Lock, Refresh, 
  Download, Filter, Search 
} from '@element-plus/icons-vue'

// 导入工具函数和Store
import { adminCloudFunctions } from '@/utils/cloudbase'
import { formatTime, updatePageTime } from '@/utils/timeUtils'
import { getPlatformName, getPlatformIcon, getPlatformOptions } from '@/utils/platformUtils'
import { getTrackTypeName, getTrackTypeIcon, getTrackTypeOptions } from '@/utils/trackTypeUtils'
import { userInfoStore } from '@/store'
import UserSearchPanel from '@/components/UserSearchPanel.vue'

// 响应式数据
const loading = ref(false)
const lastUpdateTime = ref('')
const showUserSearchPanel = ref(false)

// 数据纵览
const overviewData = reactive({
  totalUsers: 0,
  usersWithAccounts: 0,
  disabledUsers: 0
})

// 服务器筛选条件
const serverFilters = reactive({
  status: '',
  hasAccounts: ''
})

// 本地筛选条件
const localFilters = reactive({
  keyword: '',
  trackType: '',
  platformType: ''
})

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: 0
})

// 用户列表数据
const userList = ref([])
const allUserPages = ref([]) // 缓存所有已加载的页面数据
const expandedRows = ref([]) // 展开的行

// 计算可访问的页数（基于已缓存的页面数据）
const availablePageCount = computed(() => {
  const cachedPagesCount = allUserPages.value.length
  const hasNextPage = paginationCursor.hasNext
  
  // 如果有下一页，允许访问到下一页（但实际数据需要通过翻页获取）
  return hasNextPage ? cachedPagesCount + 1 : cachedPagesCount
})

// 游标分页相关
const paginationCursor = reactive({
  nextCursor: null,
  prevCursor: null,
  hasNext: false,
  hasPrev: false
})

// 工具选项
const platformOptions = getPlatformOptions()
const trackTypeOptions = getTrackTypeOptions()

// 计算属性 - 本地过滤后的用户列表
const filteredUserList = computed(() => {
  let filtered = [...userList.value]

  // 关键词搜索
  if (localFilters.keyword) {
    const keyword = localFilters.keyword.toLowerCase()
    filtered = filtered.filter(user => 
      (user.userId && user.userId.toLowerCase().includes(keyword)) ||
      (user.nickname && user.nickname.toLowerCase().includes(keyword)) ||
      (user.phone && user.phone.includes(keyword))
    )
  }

  // 赛道类型过滤
  if (localFilters.trackType) {
    filtered = filtered.filter(user => 
      user.accounts && user.accounts.some(account => 
        account.trackType === Number(localFilters.trackType)
      )
    )
  }

  // 平台类型过滤
  if (localFilters.platformType) {
    filtered = filtered.filter(user => 
      user.accounts && user.accounts.some(account => 
        account.platformType === Number(localFilters.platformType)
      )
    )
  }

  return filtered
})

// 获取账号状态类型
const getAccountStatusType = (auditStatus) => {
  switch (auditStatus) {
    case 1: return 'success' // 审核通过
    case 0: return 'warning' // 待审核
    case -1: return 'danger' // 审核拒绝
    default: return 'info'
  }
}

// 获取审核状态文本
const getAuditStatusText = (auditStatus) => {
  switch (auditStatus) {
    case 1: return '审核通过'
    case 0: return '待审核'
    case -1: return '审核拒绝'
    default: return '未知状态'
  }
}

// 文本截断函数
const truncateText = (text, maxLength) => {
  if (!text) return '-'
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 处理展开变化
const handleExpandChange = (row, expandedRowsData) => {
  if (expandedRowsData.includes(row)) {
    // 行被展开
    if (!expandedRows.value.includes(row.userId)) {
      expandedRows.value.push(row.userId)
    }
  } else {
    // 行被收起
    const index = expandedRows.value.indexOf(row.userId)
    if (index > -1) {
      expandedRows.value.splice(index, 1)
    }
  }
}

// 检查是否有服务器筛选条件
const hasServerFilters = () => {
  return serverFilters.status !== '' || serverFilters.hasAccounts !== ''
}

// 更新数据纵览
const updateOverviewData = (overview) => {
  overviewData.totalUsers = overview.totalUsers || 0
  overviewData.usersWithAccounts = overview.usersWithAccounts || 0
  overviewData.disabledUsers = overview.disabledUsers || 0
}

// 加载用户数据
const loadUserData = async (forceRefresh = false, direction = 'next') => {
  try {
    loading.value = true

    // 检查缓存 - 只检查服务器筛选条件是否匹配
    if (!forceRefresh) {
      const cached = userInfoStore.getData()
      if (cached && cached.list && cached.list.length > 0) {
        // 检查服务器筛选条件是否匹配
        const cachedServerFilters = cached.serverFilters || { status: '', hasAccounts: '' }
        
        const filtersMatch = 
          cachedServerFilters.status === serverFilters.status &&
          cachedServerFilters.hasAccounts === serverFilters.hasAccounts
        
        if (filtersMatch) {
          console.log('使用缓存的页面状态数据')
          
          // 恢复页面状态
          userList.value = cached.list
          pagination.total = cached.total || 0
          
          // 恢复到缓存的页码
          if (cached.currentPage) {
            pagination.currentPage = cached.currentPage
          }
          
          // 恢复数据纵览
          if (cached.globalStats) {
            updateOverviewData(cached.globalStats)
          }
          
          // 恢复游标信息
          if (cached.paginationCursor) {
            Object.assign(paginationCursor, cached.paginationCursor)
          }
          
          // 重置本地筛选条件
          localFilters.keyword = ''
          localFilters.trackType = ''
          localFilters.platformType = ''
          
          updatePageTime({ lastUpdateTime }, userInfoStore)
          loading.value = false
          return
        } else {
          console.log('服务器筛选条件不匹配，需要重新请求数据')
        }
      }
    }

    // 构建请求参数
    const params = {
      pageSize: pagination.pageSize,
      direction: direction
    }

    // 添加筛选条件
    if (hasServerFilters()) {
      params.filters = {}
      if (serverFilters.status !== '') {
        params.filters.status = Number(serverFilters.status)
      }
      if (serverFilters.hasAccounts !== '') {
        params.filters.hasAccounts = serverFilters.hasAccounts
      }
    }

    // 添加游标
    if (direction === 'next' && paginationCursor.nextCursor) {
      params.cursor = paginationCursor.nextCursor
    } else if (direction === 'prev' && paginationCursor.prevCursor) {
      params.cursor = paginationCursor.prevCursor
    }

    // 调用云函数
    const result = await adminCloudFunctions.getAllUserInfo(params)
    
    console.log('云函数返回结果:', result)

    if (result.result.success) {
      const data = result.result
      
      // 更新用户列表
      userList.value = data.data || []
      
      // 更新分页信息
      pagination.total = data.pagination?.total || 0
      paginationCursor.nextCursor = data.pagination?.nextCursor
      paginationCursor.prevCursor = data.pagination?.prevCursor
      paginationCursor.hasNext = data.pagination?.hasNext || false
      paginationCursor.hasPrev = data.pagination?.hasPrev || false

      // 更新数据纵览（使用全库统计数据）
      if (data.globalStats) {
        // 首次查询时使用云函数返回的全库统计
        updateOverviewData(data.globalStats)
      }

      // 缓存页面状态（服务器筛选条件、数据纵览、页码、游标、所有页面数据）
      const cacheData = {
        list: data.data || [],
        total: data.pagination?.total || 0,
        globalStats: data.globalStats,
        serverFilters: { ...serverFilters },
        paginationCursor: { ...paginationCursor },
        currentPage: pagination.currentPage,
        allUserPages: [...allUserPages.value] // 缓存所有页面数据
      }
      userInfoStore.setData(cacheData)

      // 更新页面时间
      updatePageTime({ lastUpdateTime }, userInfoStore)

      ElMessage.success('数据加载成功')
    } else {
      ElMessage.error(result.result.message || '加载数据失败')
    }
  } catch (error) {
    console.error('加载用户数据失败:', error)
    ElMessage.error('网络错误，请重试')
  } finally {
    loading.value = false
  }
}

// 服务器筛选条件变化
const handleServerFilterChange = () => {
  // 清除缓存（筛选条件变化了）
  userInfoStore.clearData()
  
  // 重置分页
  pagination.currentPage = 1
  paginationCursor.nextCursor = null
  paginationCursor.prevCursor = null
  
  // 重新加载数据
  loadUserData(true)
}

// 本地筛选条件变化
const handleLocalFilterChange = () => {
  // 本地筛选不需要重新请求数据，computed会自动处理
}

// 分页变化
const handlePageChange = (page) => {
  const currentPage = pagination.currentPage
  const maxCachedPage = allUserPages.value.length
  
  console.log(`翻页：从第${currentPage}页到第${page}页，已缓存${maxCachedPage}页`)
  
  // 检查是否允许访问该页码
  if (page > maxCachedPage + 1) {
    // 不允许跳跃到未缓存的页码
    ElMessage.warning('请按顺序翻页，不能跳跃到未加载的页面')
    return
  }
  
  if (page > currentPage) {
    // 向后翻页 - 只允许翻到下一页
    if (page !== currentPage + 1) {
      ElMessage.warning('只能一页一页向后翻页')
      return
    }
    
    const cachedPage = allUserPages.value[page - 1]
    if (cachedPage) {
      // 缓存中有数据，直接使用缓存翻页
      console.log('向后翻页：使用缓存数据')
      userList.value = cachedPage
      pagination.currentPage = page
      updateCachedCurrentPage(page)
    } else {
      // 缓存中没有数据，检查是否是下一页且有下一页数据
      if (page === maxCachedPage + 1 && paginationCursor.hasNext) {
        // 是下一页且有更多数据，使用游标获取新数据
        console.log('向后翻页：获取下一页新数据')
        pagination.currentPage = page
        loadUserData(false, 'next')
      } else {
        ElMessage.warning('没有更多数据了')
        return
      }
    }
  } else {
    // 向前翻页 - 只能访问已缓存的页面
    const cachedPage = allUserPages.value[page - 1]
    if (cachedPage) {
      console.log('向前翻页：使用缓存数据')
      userList.value = cachedPage
      pagination.currentPage = page
      updateCachedCurrentPage(page)
    } else {
      ElMessage.error('页面数据异常，请刷新重试')
      return
    }
  }
}

// 更新缓存中的当前页码和页面数据
const updateCachedCurrentPage = (page) => {
  const cached = userInfoStore.getData()
  if (cached) {
    cached.currentPage = page
    cached.allUserPages = [...allUserPages.value] // 同时更新页面数据缓存
    userInfoStore.setData(cached)
  }
}

// 刷新数据
const handleRefresh = () => {
  // 清除所有缓存
  userInfoStore.clearData()
  allUserPages.value = []
  
  // 重置筛选条件
  serverFilters.status = ''
  serverFilters.hasAccounts = ''
  localFilters.keyword = ''
  localFilters.trackType = ''
  localFilters.platformType = ''
  
  // 重置分页
  pagination.currentPage = 1
  paginationCursor.nextCursor = null
  paginationCursor.prevCursor = null
  
  // 重新加载数据
  loadUserData(true)
}

// 打开用户搜索面板
const openUserSearchPanel = () => {
  showUserSearchPanel.value = true
}

// 监听分页变化，缓存当前页数据
watch(() => userList.value, (newList) => {
  if (newList && newList.length > 0) {
    allUserPages.value[pagination.currentPage - 1] = [...newList]
  }
}, { deep: true })

// 组件挂载时加载数据
onMounted(() => {
  // 检查缓存中是否有页面状态，如果有则恢复
  const cached = userInfoStore.getData()
  if (cached && cached.serverFilters) {
    // 恢复服务器筛选条件
    Object.assign(serverFilters, cached.serverFilters)
    
    // 恢复到缓存的页码
    if (cached.currentPage) {
      pagination.currentPage = cached.currentPage
    }
    
    // 恢复游标
    if (cached.paginationCursor) {
      Object.assign(paginationCursor, cached.paginationCursor)
    }
    
    // 恢复 allUserPages 缓存数据
    if (cached.allUserPages && Array.isArray(cached.allUserPages)) {
      allUserPages.value = [...cached.allUserPages]
    }
    
    console.log('恢复页面状态', {
      serverFilters: cached.serverFilters,
      currentPage: cached.currentPage,
      cachedPagesCount: allUserPages.value.length
    })
  }
  
  // 重置本地筛选条件（每次进入页面都重置）
  localFilters.keyword = ''
  localFilters.trackType = ''
  localFilters.platformType = ''
  
  // 加载数据
  loadUserData()
})
</script>

<style lang="scss" scoped>
.user-info-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    
    .header-content {
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
  }
  
  .overview-section,
  .search-card,
  .table-card {
    margin-bottom: 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .section-title {
      font-weight: 600;
      color: #303133;
    }
    
    .header-info {
      .total-count {
        color: #909399;
        font-size: 14px;
      }
    }

    .refresh-button {
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 800;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
      }

      .el-icon {
        font-size: 16px;
        margin-right: 6px;
      }
    }
  }

  // 数据纵览样式
  .overview-content {
    .stat-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    
    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          
          &.total {
            background: #e3f2fd;
            color: #1976d2;
          }
          
          &.with-accounts {
            background: #fff3e0;
            color: #ff9800;
          }
          
          &.disabled {
            background: #ffebee;
            color: #f44336;
          }
        }
        
        .stat-info {
          .stat-number {
            font-size: 24px;
            font-weight: 600;
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

  // 搜索卡片样式
  .search-card {
    .server-filters,
    .local-filters {
      .filter-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
        font-size: 16px;
      }
    }
    
    .server-filter-form,
    .local-filter-form {
      margin-bottom: 0;
    }
  }

  // 表格样式
  .user-info-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .user-avatar {
      flex-shrink: 0;
    }
    
    .user-nickname {
      font-weight: 500;
    }
  }

  .user-id {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
    cursor: pointer;
  }

  // 表格行样式优化
  :deep(.el-table__row) {
    &.el-table__row--level-0 {
      background-color: #f8f9fa !important;
      font-weight: 500;
      
      &:hover {
        background-color: #e9ecef !important;
      }
    }
  }

  // 账号详情展开区域样式
  .account-details {
    padding: 20px 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    border-radius: 12px;
    margin: 12px 0;
    border: 2px solid #e1e8ed;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .account-details-content {
      .account-details-title {
        margin: 0 0 20px 0;
        color: #2c3e50;
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 8px;
        border-left: 4px solid #409eff;

        &::before {
          content: '📋';
          font-size: 18px;
        }
      }

      .account-details-table {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        .account-id {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 12px;
          cursor: pointer;
        }

        .earnings {
          color: #67c23a;
          font-weight: 600;
        }

        .post-count {
          color: #409eff;
          font-weight: 600;
        }

        .reject-count {
          color: #f56c6c;
          font-weight: 600;
        }

        .platform-cell,
        .track-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          .platform-icon,
          .track-icon {
            font-size: 14px;
          }

          .platform-name,
          .track-name {
            font-size: 13px;
          }
        }
      }
    }

    .no-accounts {
      text-align: center;
      padding: 20px;
    }
  }

  // 分页样式
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  // 选项样式
  .option-with-icon {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .option-icon {
      font-size: 14px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .user-info-page {
    .page-header {
      flex-direction: column;
      gap: 16px;
      align-items: stretch;
    }
    
    .overview-content .stat-cards {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .server-filter-form,
    .local-filter-form {
      .el-form-item {
        margin-bottom: 16px;
      }
    }

    // 移动端账号详情样式调整
    .account-details {
      padding: 12px 16px;

      .account-details-content {
        .account-details-table {
          font-size: 12px;
        }
      }
    }
  }
}


</style>