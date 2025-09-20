<template>
  <el-dialog
    v-model="visible"
    title="搜索用户"
    width="90%"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline class="search-form">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8" :md="6">
            <el-form-item label="搜索类型">
              <el-select v-model="searchForm.type" placeholder="搜索类型" style="width: 120px;">
                <el-option label="用户ID" value="userId" />
                <el-option label="电话" value="phone" />
                <el-option label="昵称" value="nickname" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="12">
            <el-form-item label="搜索关键词">
              <el-input 
                v-model="searchForm.keyword" 
                placeholder="请输入搜索关键词" 
                style="width: 300px;"
                @keyup.enter="handleSearch"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="4" :md="6">
            <el-form-item>
              <el-button type="primary" @click="handleSearch" :loading="searchLoading">
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

    <!-- 搜索结果区域 -->
    <div v-if="searchResultData" class="user-detail-container">
      <!-- 用户基本信息 -->
      <el-card class="user-basic-info" shadow="never">
        <template #header>
          <div class="card-header">
            <span>用户基本信息</span>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="用户ID">{{ searchResultData.userId }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ searchResultData.nickname }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ searchResultData.phone }}</el-descriptions-item>
          <el-descriptions-item label="邀请码">{{ searchResultData.inviteCode }}</el-descriptions-item>
          <el-descriptions-item label="用户状态">
            <el-tag :type="searchResultData.status === 1 ? 'success' : 'danger'">
              {{ searchResultData.status === 1 ? '正常' : '禁用' }}
            </el-tag>
            <el-button 
              v-if="searchResultData.status === 1" 
              size="small" 
              type="warning" 
              style="margin-left: 10px;"
              @click="handleDisableUser(searchResultData)"
            >
              禁用用户
            </el-button>
            <el-button 
              v-else 
              size="small" 
              type="success" 
              style="margin-left: 10px;"
              @click="handleEnableUser(searchResultData)"
            >
              启用用户
            </el-button>
          </el-descriptions-item>
          <el-descriptions-item label="用户等级">{{ searchResultData.userLevel }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">{{ searchResultData.userType }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatTime(searchResultData.registerTimestamp, 'YYYY-MM-DD HH:mm:ss') }}</el-descriptions-item>
          <el-descriptions-item label="最后登录">{{ formatTime(searchResultData.lastLoginTimestamp, 'YYYY-MM-DD HH:mm:ss') }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 统计信息 -->
        <div class="user-stats" style="margin-top: 20px;">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-statistic title="总账号数" :value="searchResultData.totalAccounts" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="待审核账号数" :value="searchResultData.pendingAuditAccounts" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="禁用账号数" :value="searchResultData.disabledAccounts" />
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 账号列表 -->
      <el-card v-if="searchResultData.accounts && searchResultData.accounts.length > 0" class="accounts-info" shadow="never" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>账号列表 ({{ searchResultData.accounts.length }})</span>
          </div>
        </template>
        
        <div v-for="(account, index) in searchResultData.accounts" :key="account.accountId" class="account-item">
          <el-card shadow="hover" style="margin-bottom: 15px;">
            <template #header>
              <div class="account-header">
                <span class="account-title">账号 {{ index + 1 }}: {{ account.accountNickname }}</span>
                <div class="account-actions">
                  <!-- 账号状态 -->
                  <div style="display: flex; align-items: center; margin-right: 15px;">
                    <span style="margin-right: 8px;">账号状态：</span>
                    <el-tag :type="account.status === 1 ? 'success' : 'danger'" style="margin-right: 8px;">
                      {{ account.status === 1 ? '正常' : '禁用' }}
                    </el-tag>
                    <el-button 
                      v-if="account.status === 1" 
                      size="small" 
                      type="warning" 
                      @click="handleDisableAccount(searchResultData, account)"
                    >
                      禁用账号
                    </el-button>
                    <el-button 
                      v-else 
                      size="small" 
                      type="success" 
                      @click="handleEnableAccount(searchResultData, account)"
                    >
                      启用账号
                    </el-button>
                  </div>
                  
                  <!-- 审核状态 -->
                  <div style="display: flex; align-items: center; margin-right: 15px;">
                    <span style="margin-right: 8px;">审核状态：</span>
                    <el-tag 
                      :type="account.auditStatus === 1 ? 'success' : account.auditStatus === 2 ? 'danger' : 'warning'" 
                      style="margin-right: 8px;"
                    >
                      {{ account.auditStatus === 1 ? '已通过' : account.auditStatus === 2 ? '已拒绝' : '待审核' }}
                    </el-tag>
                    <el-button 
                      v-if="account.auditStatus === 0" 
                      size="small" 
                      type="success" 
                      @click="handleApprove(searchResultData, account)"
                    >
                      通过审核
                    </el-button>
                    <el-button 
                      v-if="account.auditStatus === 0" 
                      size="small" 
                      type="danger" 
                      @click="handleReject(searchResultData, account)"
                    >
                      拒绝审核
                    </el-button>
                  </div>
                  
                  <!-- 删除账号按钮 -->
                  <el-button 
                    size="small" 
                    type="danger"
                    @click="handleDeleteAccount(searchResultData, account)"
                    :loading="account.deleting"
                  >
                    删除账号
                  </el-button>
                </div>
              </div>
            </template>
            
            <!-- 账号详细信息 -->
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="账号ID">{{ account.accountId }}</el-descriptions-item>
              <el-descriptions-item label="原始账号ID">{{ account.originalAccountId }}</el-descriptions-item>
              <el-descriptions-item label="手机号">{{ account.phoneNumber }}</el-descriptions-item>
              <el-descriptions-item label="平台">
                <span>{{ getPlatformIcon(account.platform) }} {{ getPlatformName(account.platform) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="赛道">
                <span>{{ getTrackTypeIcon(account.trackType) }} {{ getTrackTypeName(account.trackType) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatTime(account.createTimestamp, 'YYYY-MM-DD HH:mm:ss') }}</el-descriptions-item>
              <el-descriptions-item label="已发布文章">{{ (account.posts && account.posts.length) || 0 }}</el-descriptions-item>
              <el-descriptions-item label="已拒绝文章">{{ (account.rejectPosts && account.rejectPosts.length) || 0 }}</el-descriptions-item>
              <el-descriptions-item v-if="props.viewType === 2" label="当前收益">{{ account.currentAccountEarnings || 0 }}</el-descriptions-item>
            </el-descriptions>

            <!-- 收益信息 (仅在查看全部信息时显示) -->
            <div v-if="props.viewType === 2 && account.earnings && account.earnings.length > 0" style="margin-top: 15px;">
              <el-collapse>
                <el-collapse-item :title="`收益记录 (${account.earnings.length})`" name="earnings">
                  <el-table :data="account.earnings" size="small" max-height="300">
                    <el-table-column prop="startTime" label="开始时间" width="120">
                      <template #default="{ row }">
                        {{ formatTime(row.startTime, 'YYYY-MM-DD') }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="endTime" label="结束时间" width="120">
                      <template #default="{ row }">
                        {{ formatTime(row.endTime, 'YYYY-MM-DD') }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="monthlyPostCount" label="月发文数" width="100" />
                    <el-table-column prop="accountEarnings" label="账号收益" width="100" />
                    <el-table-column prop="settlementEarnings" label="结算收益" width="100" />
                    <el-table-column prop="settlementStatus" label="结算状态" width="100">
                      <template #default="{ row }">
                        <el-tag :type="row.settlementStatus === 2 ? 'success' : row.settlementStatus === 1 ? 'warning' : 'info'" size="small">
                          {{ row.settlementStatus === 2 ? '已结算' : row.settlementStatus === 1 ? '待结算' : '未结算' }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="settlementTime" label="结算时间" width="120">
                      <template #default="{ row }">
                        {{ row.settlementTime ? formatTime(row.settlementTime, 'YYYY-MM-DD') : '-' }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="transferOrderNo" label="转账订单号" width="150" show-overflow-tooltip />
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </div>

            <!-- 已发布文章列表 -->
            <div v-if="account.posts && account.posts.length > 0" style="margin-top: 15px;">
              <el-collapse>
                <el-collapse-item :title="`已发布文章 (${account.posts.length})`" name="posts">
                  <el-table :data="account.posts" size="small" max-height="300">
                    <el-table-column prop="articleId" label="文章ID" width="150" show-overflow-tooltip />
                    <el-table-column prop="title" label="文章标题" min-width="200" show-overflow-tooltip />
                    <el-table-column prop="trackType" label="赛道" width="100">
                      <template #default="{ row }">
                        {{ getTrackTypeName(row.trackType) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="publishTime" label="发布时间" width="150">
                      <template #default="{ row }">
                        {{ formatTime(row.publishTime, 'YYYY-MM-DD HH:mm') }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="viewCount" label="浏览量" width="100" />
                    <el-table-column v-if="props.viewType === 2" prop="dailyEarnings" label="日收益" width="100" />
                    <el-table-column prop="callbackUrl" label="回传地址" width="120">
                      <template #default="{ row }">
                        <el-button 
                          v-if="row.callbackUrl" 
                          size="small" 
                          type="primary" 
                          link 
                          @click="handleOpenUrl(row.callbackUrl)"
                        >
                          查看链接
                        </el-button>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </div>

            <!-- 已拒绝文章列表 -->
            <div v-if="account.rejectPosts && account.rejectPosts.length > 0" style="margin-top: 15px;">
              <el-collapse>
                <el-collapse-item :title="`已拒绝文章 (${account.rejectPosts.length})`" name="rejectPosts">
                  <el-table :data="account.rejectPosts" size="small" max-height="300">
                    <el-table-column prop="articleId" label="文章ID" width="150" show-overflow-tooltip />
                    <el-table-column prop="title" label="文章标题" min-width="200" show-overflow-tooltip />
                    <el-table-column prop="trackType" label="赛道" width="100">
                      <template #default="{ row }">
                        {{ getTrackTypeName(row.trackType) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="rejectTime" label="拒绝时间" width="150">
                      <template #default="{ row }">
                        {{ formatTime(row.rejectTime, 'YYYY-MM-DD HH:mm') }}
                      </template>
                    </el-table-column>
                  </el-table>
                </el-collapse-item>
              </el-collapse>
            </div>

            <!-- 账号资料图 -->
            <div v-if="account.screenshotUrl" style="margin-top: 15px;">
              <el-button size="small" type="primary" @click="handleViewAccountImage(account)" :loading="account.viewingImage">
                <el-icon><Picture /></el-icon>
                查看账号资料图
              </el-button>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty v-else-if="hasSearched" description="未找到匹配的用户" />

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Picture } from '@element-plus/icons-vue'
import { adminCloudFunctions } from '@/utils/cloudbase'
import { formatTime } from '@/utils/timeUtils'
import { getPlatformName, getPlatformIcon } from '@/utils/platformUtils'
import { getTrackTypeName, getTrackTypeIcon } from '@/utils/trackTypeUtils'
import { viewImage } from '@/utils/imageUtils'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  viewType: {
    type: Number,
    default: 1, // 1-查看用户状态，2-查看全部信息
    validator: (value) => [1, 2].includes(value)
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'refresh-data'])

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const searchLoading = ref(false)
const hasSearched = ref(false)
const searchResultData = ref(null)

// 搜索表单
const searchForm = reactive({
  type: 'userId',
  keyword: ''
})

// 搜索用户
const handleSearch = async () => {
  if (!searchForm.keyword.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  try {
    searchLoading.value = true
    hasSearched.value = true
    
    const params = {
      [searchForm.type]: searchForm.keyword.trim()
    }
    
    const result = await adminCloudFunctions.getUserInfo(params)
    
    if (result?.result?.success && result.result.data) {
      if (result.result.data.length > 0) {
        searchResultData.value = result.result.data[0] // 取第一个用户
        ElMessage.success('找到用户信息')
      } else {
        searchResultData.value = null
        ElMessage.info('未找到匹配的用户')
      }
    } else {
      searchResultData.value = null
      ElMessage.warning('未找到匹配的用户')
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    ElMessage.error('搜索用户失败')
    searchResultData.value = null
  } finally {
    searchLoading.value = false
  }
}

// 重置搜索
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.type = 'userId'
  searchResultData.value = null
  hasSearched.value = false
}

// 关闭面板
const handleClose = () => {
  visible.value = false
  handleReset()
}

// 查看账号资料图
const handleViewAccountImage = async (account) => {
  try {
    account.viewingImage = true
    await viewImage(account.screenshotUrl, {
      emptyMessage: '该账号暂无资料图',
      errorMessage: '获取账号资料图失败'
    })
  } catch (error) {
    console.error('查看账号资料图失败:', error)
  } finally {
    account.viewingImage = false
  }
}

// 打开URL链接
const handleOpenUrl = (url) => {
  if (url) {
    window.open(url, '_blank')
  }
}

// 用户操作方法
const handleDisableUser = async (userData) => {
  try {
    await ElMessageBox.confirm('确认禁用该用户？', '确认操作', {
      type: 'warning'
    })
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 1,        // 更新用户状态
      userId: userData.userId,
      statusValue: 0           // 禁用用户
    })
    
    if (result?.result?.success) {
      ElMessage.success('用户禁用成功')
      // 更新弹出面板中的数据
      searchResultData.value.status = 0
      // 通知父组件刷新数据
      emit('refresh-data')
    } else {
      ElMessage.error('用户禁用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('用户禁用失败:', error)
      ElMessage.error('用户禁用失败')
    }
  }
}

const handleEnableUser = async (userData) => {
  try {
    await ElMessageBox.confirm('确认启用该用户？', '确认操作', {
      type: 'warning'
    })
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 1,        // 更新用户状态
      userId: userData.userId,
      statusValue: 1           // 启用用户
    })
    
    if (result?.result?.success) {
      ElMessage.success('用户启用成功')
      // 更新弹出面板中的数据
      searchResultData.value.status = 1
      // 通知父组件刷新数据
      emit('refresh-data')
    } else {
      ElMessage.error('用户启用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('用户启用失败:', error)
      ElMessage.error('用户启用失败')
    }
  }
}

// 账号操作方法
const handleDisableAccount = async (userData, accountData) => {
  try {
    await ElMessageBox.confirm('确认禁用该账号？', '确认操作', {
      type: 'warning'
    })
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 2,        // 更新账号状态
      userId: userData.userId,
      accountId: accountData.accountId,
      statusValue: 0           // 禁用账号
    })
    
    if (result?.result?.success) {
      ElMessage.success('账号禁用成功')
      // 更新账号状态
      accountData.status = 0
      // 更新统计数据
      searchResultData.value.activeAccounts--
      searchResultData.value.disabledAccounts++
      // 通知父组件刷新数据
      emit('refresh-data')
    } else {
      ElMessage.error('账号禁用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('账号禁用失败:', error)
      ElMessage.error('账号禁用失败')
    }
  }
}

const handleEnableAccount = async (userData, accountData) => {
  try {
    await ElMessageBox.confirm('确认启用该账号？', '确认操作', {
      type: 'warning'
    })
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 2,        // 更新账号状态
      userId: userData.userId,
      accountId: accountData.accountId,
      statusValue: 1           // 启用账号
    })
    
    if (result?.result?.success) {
      ElMessage.success('账号启用成功')
      // 更新账号状态
      accountData.status = 1
      // 更新统计数据
      searchResultData.value.activeAccounts++
      searchResultData.value.disabledAccounts--
      // 通知父组件刷新数据
      emit('refresh-data')
    } else {
      ElMessage.error('账号启用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('账号启用失败:', error)
      ElMessage.error('账号启用失败')
    }
  }
}

const handleApprove = async (userData, accountData) => {
  try {
    await ElMessageBox.confirm('确认通过该账号的审核？', '确认操作', {
      type: 'warning'
    })
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 3,        // 更新账号审核状态
      userId: userData.userId,
      accountId: accountData.accountId,
      statusValue: 1           // 审核通过
    })
    
    if (result?.result?.success) {
      ElMessage.success('审核通过成功')
      // 更新账号审核状态
      accountData.auditStatus = 1
      // 更新统计数据
      searchResultData.value.pendingAuditAccounts--
      searchResultData.value.approvedAccounts++
      // 通知父组件刷新数据
      emit('refresh-data')
    } else {
      ElMessage.error('审核通过失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核通过失败:', error)
      ElMessage.error('审核通过失败')
    }
  }
}

const handleReject = async (userData, accountData) => {
  try {
    await ElMessageBox.confirm('确认拒绝该账号的审核？', '确认操作', {
      type: 'warning'
    })
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 3,        // 更新账号审核状态
      userId: userData.userId,
      accountId: accountData.accountId,
      statusValue: 2           // 审核拒绝
    })
    
    if (result?.result?.success) {
      ElMessage.success('审核拒绝成功')
      // 更新账号审核状态
      accountData.auditStatus = 2
      // 更新统计数据
      searchResultData.value.pendingAuditAccounts--
      searchResultData.value.rejectedAccounts++
      // 通知父组件刷新数据
      emit('refresh-data')
    } else {
      ElMessage.error('审核拒绝失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核拒绝失败:', error)
      ElMessage.error('审核拒绝失败')
    }
  }
}

// 删除账号
const handleDeleteAccount = async (userData, accountData) => {
  try {
    // 二次确认删除操作
    await ElMessageBox.confirm(
      `确认删除账号 "${accountData.accountNickname}" (${accountData.accountId})？\n\n⚠️ 警告：此操作不可逆，将永久删除该账号及其所有相关数据（文章、收益、任务等）！`, 
      '危险操作确认', 
      {
        type: 'error',
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        dangerouslyUseHTMLString: false
      }
    )
    
    // 设置删除状态
    accountData.deleting = true
    
    const result = await adminCloudFunctions.deleteAccount(userData.userId, accountData.accountId)
    
    if (result?.result?.success) {
      ElMessage.success('账号删除成功')
      
      // 从账号列表中移除该账号
      const accountIndex = searchResultData.value.accounts.findIndex(
        account => account.accountId === accountData.accountId
      )
      if (accountIndex !== -1) {
        searchResultData.value.accounts.splice(accountIndex, 1)
      }
      
      // 更新统计数据
      searchResultData.value.totalAccounts--
      
      // 根据删除的账号状态更新对应的统计数据
      if (accountData.status === 1) {
        searchResultData.value.activeAccounts--
      } else {
        searchResultData.value.disabledAccounts--
      }
      
      // 根据删除的账号审核状态更新对应的统计数据
      if (accountData.auditStatus === 0) {
        searchResultData.value.pendingAuditAccounts--
      } else if (accountData.auditStatus === 1) {
        searchResultData.value.approvedAccounts--
      } else if (accountData.auditStatus === 2) {
        searchResultData.value.rejectedAccounts--
      }
      
      // 更新发文和拒绝文章统计
      if (accountData.posts && accountData.posts.length > 0) {
        searchResultData.value.totalPosts -= accountData.posts.length
      }
      if (accountData.rejectPosts && accountData.rejectPosts.length > 0) {
        searchResultData.value.totalRejectPosts -= accountData.rejectPosts.length
      }
      
      // 通知父组件刷新数据
      emit('refresh-data')
    } else {
      ElMessage.error(result?.result?.message || '账号删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除账号失败:', error)
      ElMessage.error('删除账号失败')
    }
  } finally {
    // 清除删除状态
    if (accountData.deleting) {
      accountData.deleting = false
    }
  }
}
</script>

<style scoped>
.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin: 0;
}

.user-detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

.user-basic-info .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.user-stats {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.accounts-info .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.account-item .account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.account-title {
  font-weight: 600;
  color: #303133;
}

.account-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-descriptions) {
  margin-bottom: 0;
}

:deep(.el-statistic) {
  text-align: center;
}
</style>