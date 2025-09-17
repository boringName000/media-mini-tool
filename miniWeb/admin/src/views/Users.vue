<template>
  <div class="users-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>用户权限管理</h1>
      <p>管理系统中的所有用户权限信息 | 最后更新：{{ lastUpdateTime }}</p>
    </div>

    <!-- 数据纵览 -->
    <el-card class="overview-card" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">数据纵览</span>
          <div class="header-actions">
            <el-button type="primary" @click="refreshOverviewData" :loading="overviewLoading">
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
              <div class="stat-icon pending">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewData.pendingAudit }}</div>
                <div class="stat-label">待审核账号数</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon disabled-users">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewData.disabledUsers }}</div>
                <div class="stat-label">禁用用户数</div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon disabled-accounts">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-number">{{ overviewData.disabledAccounts }}</div>
                <div class="stat-label">禁用账号数</div>
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
            <el-form-item label="本地筛选">
              <el-input
                v-model="filterForm.localSearch"
                placeholder="用户ID/昵称/电话"
                clearable
                style="width: 200px"
                @input="handleLocalFilter"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="平台类型">
              <el-select 
                v-model="filterForm.platformType" 
                :placeholder="filterForm.platformType ? getSelectedPlatformDisplay() : '选择平台类型'"
                clearable
                style="width: 160px"
                @change="handleLocalFilter"
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
                @change="handleLocalFilter"
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
        </el-row>

        <!-- 分割线 -->
        <div class="filter-divider"></div>

        <!-- 第二行：服务器搜索 -->
        <el-row class="filter-row" :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="搜索选项">
              <el-select v-model="serverSearch.type" placeholder="搜索类型" style="width: 120px;">
                <el-option label="昵称" value="nickname" />
                <el-option label="用户ID" value="userId" />
                <el-option label="电话" value="phone" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item label="搜索数据库用户">
              <el-input 
                v-model="serverSearch.keyword" 
                placeholder="请输入搜索关键词" 
                style="width: 200px;"
                @keyup.enter="handleServerSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6">
            <el-form-item>
              <el-button type="primary" @click="handleServerSearch" :loading="searchLoading">
                确定
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 用户信息列表区域 -->
    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="section-header">
          <span class="section-title">用户信息列表</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待审核账号" name="pendingAudit">
          <el-table :data="paginatedData" v-loading="loading" stripe>
            <el-table-column prop="userId" label="用户ID" min-width="150" show-overflow-tooltip />
            <el-table-column label="用户昵称" width="120">
              <template #default="{ row }">
                {{ row.nickname }}
              </template>
            </el-table-column>
            <el-table-column label="注册手机" width="120">
              <template #default="{ row }">
                {{ row.phoneNumber || row.phone || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="账号昵称" width="120">
              <template #default="{ row }">
                {{ row.accountNickname || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="账号手机" width="120">
              <template #default="{ row }">
                {{ row.phoneNumber || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="平台" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getPlatformName(row.platform) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="赛道" width="100">
              <template #default="{ row }">
                <el-tag size="small" type="success">{{ getTrackTypeName(row.trackType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="绑定时间" width="180" sortable>
              <template #default="{ row }">
                {{ formatTime(row.createTimestamp, 'YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
            <el-table-column label="账号资料图" width="120">
              <template #default="{ row }">
                <el-button size="small" type="primary" link>查看</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="success" @click="handleApprove(row)" :loading="row.approving">
                  通过
                </el-button>
                <el-button size="small" type="danger" @click="handleReject(row)" :loading="row.rejecting">
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :small="false"
              :disabled="false"
              :background="true"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredData.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="禁用用户" name="disabledUsers">
          <el-table :data="paginatedData" v-loading="loading" stripe>
            <el-table-column prop="userId" label="用户ID" min-width="150" show-overflow-tooltip />
            <el-table-column prop="nickname" label="用户昵称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="phoneNumber" label="注册手机" min-width="130" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.phoneNumber || row.phone || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="accountCount" label="账号数" width="100" align="center">
              <template #default="{ row }">
                {{ (row.accounts && row.accounts.length) || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="registerTimestamp" label="注册时间" min-width="180" sortable>
              <template #default="{ row }">
                {{ formatTime(row.registerTimestamp, 'YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="warning" @click="handleDisableUser(row)" :loading="row.disabling">
                  禁止使用
                </el-button>
                <el-button size="small" type="success" @click="handleEnableUser(row)" :loading="row.enabling">
                  正常使用
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :small="false"
              :disabled="false"
              :background="true"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredData.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="禁用账号" name="disabledAccounts">
          <el-table :data="paginatedData" v-loading="loading" stripe>
            <el-table-column prop="userId" label="用户ID" min-width="200" show-overflow-tooltip />
            <el-table-column label="用户昵称" width="120">
              <template #default="{ row }">
                {{ row.nickname }}
              </template>
            </el-table-column>
            <el-table-column label="注册手机" width="120">
              <template #default="{ row }">
                {{ row.phoneNumber || row.phone || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="账号昵称" width="120">
              <template #default="{ row }">
                {{ row.accountNickname || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="账号手机" width="120">
              <template #default="{ row }">
                {{ row.phoneNumber || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="平台" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getPlatformName(row.platform) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="赛道" width="100">
              <template #default="{ row }">
                <el-tag size="small" type="success">{{ getTrackTypeName(row.trackType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="绑定时间" width="180" sortable>
              <template #default="{ row }">
                {{ formatTime(row.createTimestamp,'YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
            <el-table-column label="账号资料图" width="120">
              <template #default="{ row }">
                <el-button size="small" type="primary" link>查看</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="warning" @click="handleDisableAccount(row)" :loading="row.disabling">
                  禁止使用
                </el-button>
                <el-button size="small" type="success" @click="handleEnableAccount(row)" :loading="row.enabling">
                  正常使用
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页控件 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :small="false"
              :disabled="false"
              :background="true"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredData.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 用户详情弹出面板 -->
    <el-dialog
      v-model="showUserDetailDialog"
      title="用户详细信息"
      width="80%"
      :close-on-click-modal="false"
    >
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
                @click="handleDisableUserFromDetail(searchResultData)"
              >
                禁用用户
              </el-button>
              <el-button 
                v-else 
                size="small" 
                type="success" 
                style="margin-left: 10px;"
                @click="handleEnableUserFromDetail(searchResultData)"
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
              <el-col :span="6">
                <el-statistic title="总账号数" :value="searchResultData.totalAccounts" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="活跃账号" :value="searchResultData.activeAccounts" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="禁用账号" :value="searchResultData.disabledAccounts" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="待审核账号" :value="searchResultData.pendingAuditAccounts" />
              </el-col>
            </el-row>
            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :span="6">
                <el-statistic title="已通过账号" :value="searchResultData.approvedAccounts" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="已拒绝账号" :value="searchResultData.rejectedAccounts" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="总发文数" :value="searchResultData.totalPosts" />
              </el-col>
              <el-col :span="6">
                <el-statistic title="总拒绝文章" :value="searchResultData.totalRejectPosts" />
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
                    <!-- 账号状态操作 -->
                    <el-tag :type="account.status === 1 ? 'success' : 'danger'" style="margin-right: 10px;">
                      {{ account.status === 1 ? '正常' : '禁用' }}
                    </el-tag>
                    <el-button 
                      v-if="account.status === 1" 
                      size="small" 
                      type="warning"
                      @click="handleDisableAccountFromDetail(searchResultData, account)"
                    >
                      禁用账号
                    </el-button>
                    <el-button 
                      v-else 
                      size="small" 
                      type="success"
                      @click="handleEnableAccountFromDetail(searchResultData, account)"
                    >
                      启用账号
                    </el-button>
                    
                    <!-- 审核状态操作 -->
                    <el-tag 
                      :type="account.auditStatus === 1 ? 'success' : account.auditStatus === 2 ? 'danger' : 'warning'" 
                      style="margin-left: 10px; margin-right: 10px;"
                    >
                      {{ account.auditStatus === 1 ? '审核通过' : account.auditStatus === 2 ? '审核拒绝' : '待审核' }}
                    </el-tag>
                    <el-button 
                      v-if="account.auditStatus === 0" 
                      size="small" 
                      type="success"
                      @click="handleApproveFromDetail(searchResultData, account)"
                    >
                      审核通过
                    </el-button>
                    <el-button 
                      v-if="account.auditStatus === 0" 
                      size="small" 
                      type="danger"
                      @click="handleRejectFromDetail(searchResultData, account)"
                    >
                      审核拒绝
                    </el-button>
                  </div>
                </div>
              </template>
              
              <!-- 账号详细信息 -->
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="账号ID">{{ account.accountId }}</el-descriptions-item>
                <el-descriptions-item label="原始账号ID">{{ account.originalAccountId }}</el-descriptions-item>
                <el-descriptions-item label="手机号">{{ account.phoneNumber }}</el-descriptions-item>
                <el-descriptions-item label="平台">{{ getPlatformName(account.platform) }}</el-descriptions-item>
                <el-descriptions-item label="赛道">{{ getTrackTypeName(account.trackType) }}</el-descriptions-item>
                <el-descriptions-item label="每日发文数">{{ account.dailyPostCount }}</el-descriptions-item>
                <el-descriptions-item label="是否违规">
                  <el-tag :type="account.isViolation ? 'danger' : 'success'">
                    {{ account.isViolation ? '是' : '否' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="创建时间">{{ formatTime(account.createTimestamp, 'YYYY-MM-DD HH:mm:ss') }}</el-descriptions-item>
              </el-descriptions>
              
              <!-- 账号统计 -->
              <div class="account-stats" style="margin-top: 15px;">
                <el-row :gutter="15">
                  <el-col :span="6">
                    <el-statistic title="发文数" :value="account.totalPosts" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="拒绝文章" :value="account.totalRejectPosts" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="每日任务" :value="account.totalDailyTasks" />
                  </el-col>
                  <el-col :span="6">
                    <el-statistic title="已完成任务" :value="account.completedTasks" />
                  </el-col>
                </el-row>
              </div>
              
              <!-- 拒绝文章列表 -->
              <div v-if="account.rejectPosts && account.rejectPosts.length > 0" style="margin-top: 15px;">
                <el-divider content-position="left">拒绝文章 ({{ account.rejectPosts.length }})</el-divider>
                <el-table :data="account.rejectPosts" size="small" max-height="200">
                  <el-table-column prop="articleId" label="文章ID" width="150" />
                  <el-table-column prop="title" label="文章标题" show-overflow-tooltip />
                  <el-table-column prop="rejectTime" label="拒绝时间" width="180">
                    <template #default="{ row }">
                      {{ formatTime(row.rejectTime, 'YYYY-MM-DD HH:mm:ss') }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              
              <!-- 每日任务列表 -->
              <div v-if="account.dailyTasks && account.dailyTasks.length > 0" style="margin-top: 15px;">
                <el-divider content-position="left">每日任务 ({{ account.dailyTasks.length }})</el-divider>
                <el-table :data="account.dailyTasks" size="small" max-height="200">
                  <el-table-column prop="articleId" label="文章ID" width="150" />
                  <el-table-column prop="articleTitle" label="文章标题" show-overflow-tooltip />
                  <el-table-column label="完成状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.isCompleted ? 'success' : 'info'" size="small">
                        {{ row.isCompleted ? '已完成' : '未完成' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="领取状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.isClaimed ? 'success' : 'warning'" size="small">
                        {{ row.isClaimed ? '已领取' : '未领取' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="taskTime" label="任务时间" width="180">
                    <template #default="{ row }">
                      {{ formatTime(row.taskTime, 'YYYY-MM-DD HH:mm:ss') }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              
              <!-- 收益记录 -->
              <div v-if="account.earnings && account.earnings.length > 0" style="margin-top: 15px;">
                <el-divider content-position="left">收益记录 ({{ account.earnings.length }})</el-divider>
                <el-table :data="account.earnings" size="small" max-height="200">
                  <el-table-column label="结算方式" width="100">
                    <template #default="{ row }">
                      {{ row.settlementMethod === 1 ? '微信' : '其他' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="accountEarnings" label="账号收益" width="100" />
                  <el-table-column prop="settlementEarnings" label="结算收益" width="100" />
                  <el-table-column label="结算状态" width="100">
                    <template #default="{ row }">
                      <el-tag :type="row.settlementStatus === 2 ? 'success' : 'warning'" size="small">
                        {{ row.settlementStatus === 2 ? '已结算' : '待结算' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="settlementTime" label="结算时间" width="180">
                    <template #default="{ row }">
                      {{ formatTime(row.settlementTime, 'YYYY-MM-DD HH:mm:ss') }}
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-card>
          </div>
        </el-card>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUserDetailDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, Refresh, UserFilled, Lock, Search } from '@element-plus/icons-vue'
import { adminCloudFunctions } from '@/utils/cloudbase'
import { formatTime, updatePageTime } from '@/utils/timeUtils'
import { getPlatformOptions, getPlatformName } from '@/utils/platformUtils'
import { getTrackTypeOptions, getTrackTypeName } from '@/utils/trackTypeUtils'
import { usersStore } from '@/store'

// Store - 直接使用导入的usersStore
const lastUpdateTime = ref('')

// 响应式数据
const activeTab = ref('pendingAudit')
const loading = ref(false)
const overviewLoading = ref(false)
const searchLoading = ref(false)

// 分页相关数据
const currentPage = ref(1)
const pageSize = ref(20)

// 原始数据存储
const rawData = reactive({
  pendingAudit: [],
  disabledUsers: [],
  disabledAccounts: []
})

// 数据纵览
const overviewData = reactive({
  pendingAudit: 0,
  disabledUsers: 0,
  disabledAccounts: 0
})

// 筛选表单
const filterForm = reactive({
  localSearch: '',
  platformType: '',
  trackType: ''
})

// 服务器搜索
const serverSearch = reactive({
  type: 'nickname',
  keyword: ''
})

// 用户详情弹出面板
const showUserDetailDialog = ref(false)
const searchResultData = ref(null)

// 平台和赛道选项
const platformOptions = getPlatformOptions()
const trackTypeOptions = getTrackTypeOptions()

// 计算属性 - 过滤后的数据
const filteredData = computed(() => {
  let data = rawData[activeTab.value] || []
  
  // 本地筛选
  if (filterForm.localSearch) {
    const keyword = filterForm.localSearch.toLowerCase()
    data = data.filter(item => {
      const userId = (item.userId || '').toLowerCase()
      const nickname = (item.nickname || '').toLowerCase()
      const phone = (item.phoneNumber || item.phone || '').toLowerCase()
      return userId.includes(keyword) || nickname.includes(keyword) || phone.includes(keyword)
    })
  }
  
  // 平台类型筛选
  if (filterForm.platformType) {
    data = data.filter(item => item.platform === filterForm.platformType)
  }
  
  // 赛道类型筛选
  if (filterForm.trackType) {
    data = data.filter(item => item.trackType === filterForm.trackType)
  }
  
  return data
})

// 分页后的数据
const paginatedData = computed(() => {
  try {
    const filtered = filteredData.value || []
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filtered.slice(start, end)
  } catch (error) {
    console.error('分页处理时出错:', error)
    return []
  }
})

// Tab名称到queryType的映射
const getQueryType = (tabName) => {
  const mapping = {
    'pendingAudit': 3,      // 待审核账号
    'disabledUsers': 1,     // 禁用用户
    'disabledAccounts': 2   // 禁用账号
  }
  return mapping[tabName]
}

// 方法
const fetchDataByType = async (type) => {
  try {
    // 检查缓存
    const cached = usersStore.getData()
    if (cached && cached[type] && cached[type].length > 0) {
      console.log(`使用缓存数据: ${type}`)
      rawData[type] = cached[type]
      return
    }
    
    // 检查内存数据
    if (rawData[type] && rawData[type].length > 0) {
      console.log(`使用内存数据: ${type}`)
      return
    }
    
    console.log(`请求服务器数据: ${type}`)
    loading.value = true
    
    // 获取正确的queryType参数
    const queryType = getQueryType(type)
    if (!queryType) {
      throw new Error(`无效的查询类型: ${type}`)
    }
    
    const result = await adminCloudFunctions.getUserPermissionsQuery({ queryType })
    
    console.log(`${type} 云函数返回结果:`, result)
    
    // 处理云函数返回的数据结构
    let data = []
    if (result && result.result && result.result.success && result.result.data) {
      data = result.result.data
    } else if (result?.result?.success && result.result.data) {
      data = result.result.data
    }
    
    if (data && data.length >= 0) {
      rawData[type] = data
      
      // 更新缓存
      const existingData = usersStore.getData() || {}
      const updatedData = {
        ...existingData,
        [type]: data
      }
      usersStore.setData(updatedData)
      
      console.log(`${type} 数据获取成功:`, data.length, '条')
      console.log(`${type} 数据内容:`, data)
    } else {
      console.warn(`${type} 数据获取失败:`, result)
      rawData[type] = []
    }
  } catch (error) {
    console.error(`获取 ${type} 数据失败:`, error)
    ElMessage.error(`获取 ${type} 数据失败`)
    rawData[type] = []
  } finally {
    loading.value = false
  }
}

const refreshOverviewData = async () => {
  try {
    overviewLoading.value = true
    
    // 用户主动刷新时清除缓存
    usersStore.clearData()
    
    // 清空内存数据，强制重新获取
    rawData.pendingAudit = []
    rawData.disabledUsers = []
    rawData.disabledAccounts = []
    
    // 重新加载所有数据
    await loadAllData()
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新数据失败')
  } finally {
    overviewLoading.value = false
  }
}

const handleTabChange = async (tabName) => {
  activeTab.value = tabName
  // 切换标签时重置分页
  currentPage.value = 1
  await fetchDataByType(tabName)
}

const handleLocalFilter = () => {
  // 本地筛选，无需额外操作，computed 会自动更新
  // 筛选时重置到第一页
  currentPage.value = 1
}

// 分页事件处理
const handleSizeChange = (newSize) => {
  try {
    pageSize.value = newSize
    currentPage.value = 1
  } catch (error) {
    console.error('分页大小变更时出错:', error)
  }
}

const handleCurrentChange = (newPage) => {
  try {
    currentPage.value = newPage
  } catch (error) {
    console.error('分页变更时出错:', error)
  }
}

const handleServerSearch = async () => {
  if (!serverSearch.keyword.trim()) {
    ElMessage.warning('请输入搜索关键词')
    return
  }
  
  try {
    searchLoading.value = true
    
    const params = {
      [serverSearch.type]: serverSearch.keyword.trim()
    }
    
    const result = await adminCloudFunctions.getUserInfo(params)
    
    if (result?.result?.success && result.result.data) {
      if (result.result.data.length > 0) {
        // 显示用户详情弹出面板
        searchResultData.value = result.result.data[0] // 取第一个用户
        showUserDetailDialog.value = true
        ElMessage.success(`找到用户信息`)
      } else {
        ElMessage.info('未找到匹配的用户')
      }
    } else {
      ElMessage.warning('未找到匹配的用户')
    }
  } catch (error) {
    console.error('搜索用户失败:', error)
    ElMessage.error('搜索用户失败')
  } finally {
    searchLoading.value = false
  }
}

// 操作方法
const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确认通过该账号的审核？', '确认操作', {
      type: 'warning'
    })
    
    row.approving = true
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 3,        // 更新账号审核状态
      userId: row.userId,
      accountId: row.accountId,
      statusValue: 1           // 审核通过
    })
    
    if (result?.result?.success) {
      ElMessage.success('审核通过成功')
      // 清除缓存并刷新数据（不显示刷新成功消息）
      usersStore.clearData()
      rawData.pendingAudit = []
      rawData.disabledUsers = []
      rawData.disabledAccounts = []
      await loadAllData()
    } else {
      ElMessage.error('审核通过失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核通过失败:', error)
      ElMessage.error('审核通过失败')
    }
  } finally {
    row.approving = false
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm('确认拒绝该账号的审核？', '确认操作', {
      type: 'warning'
    })
    
    row.rejecting = true
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 3,        // 更新账号审核状态
      userId: row.userId,
      accountId: row.accountId,
      statusValue: 2           // 审核拒绝
    })
    
    if (result?.result?.success) {
      ElMessage.success('审核拒绝成功')
      // 清除缓存并刷新数据（不显示刷新成功消息）
      usersStore.clearData()
      rawData.pendingAudit = []
      rawData.disabledUsers = []
      rawData.disabledAccounts = []
      await loadAllData()
    } else {
      ElMessage.error('审核拒绝失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核拒绝失败:', error)
      ElMessage.error('审核拒绝失败')
    }
  } finally {
    row.rejecting = false
  }
}

const handleDisableUser = async (row) => {
  try {
    await ElMessageBox.confirm('确认禁用该用户？', '确认操作', {
      type: 'warning'
    })
    
    row.disabling = true
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 1,        // 更新用户状态
      userId: row.userId,
      statusValue: 0           // 禁用用户
    })
    
    if (result?.result?.success) {
      ElMessage.success('用户禁用成功')
      // 清除缓存并刷新数据（不显示刷新成功消息）
      usersStore.clearData()
      rawData.pendingAudit = []
      rawData.disabledUsers = []
      rawData.disabledAccounts = []
      await loadAllData()
    } else {
      ElMessage.error('用户禁用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('用户禁用失败:', error)
      ElMessage.error('用户禁用失败')
    }
  } finally {
    row.disabling = false
  }
}

const handleEnableUser = async (row) => {
  try {
    await ElMessageBox.confirm('确认启用该用户？', '确认操作', {
      type: 'warning'
    })
    
    row.enabling = true
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 1,        // 更新用户状态
      userId: row.userId,
      statusValue: 1           // 启用用户
    })
    
    if (result?.result?.success) {
      ElMessage.success('用户启用成功')
      // 清除缓存并刷新数据（不显示刷新成功消息）
      usersStore.clearData()
      rawData.pendingAudit = []
      rawData.disabledUsers = []
      rawData.disabledAccounts = []
      await loadAllData()
    } else {
      ElMessage.error('用户启用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('用户启用失败:', error)
      ElMessage.error('用户启用失败')
    }
  } finally {
    row.enabling = false
  }
}

const handleDisableAccount = async (row) => {
  try {
    await ElMessageBox.confirm('确认禁用该账号？', '确认操作', {
      type: 'warning'
    })
    
    row.disabling = true
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 2,        // 更新账号状态
      userId: row.userId,
      accountId: row.accountId,
      statusValue: 0           // 禁用账号
    })
    
    if (result?.result?.success) {
      ElMessage.success('账号禁用成功')
      // 清除缓存并刷新数据（不显示刷新成功消息）
      usersStore.clearData()
      rawData.pendingAudit = []
      rawData.disabledUsers = []
      rawData.disabledAccounts = []
      await loadAllData()
    } else {
      ElMessage.error('账号禁用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('账号禁用失败:', error)
      ElMessage.error('账号禁用失败')
    }
  } finally {
    row.disabling = false
  }
}

const handleEnableAccount = async (row) => {
  try {
    await ElMessageBox.confirm('确认启用该账号？', '确认操作', {
      type: 'warning'
    })
    
    row.enabling = true
    
    const result = await adminCloudFunctions.manageUserPermissions({
      operationType: 2,        // 更新账号状态
      userId: row.userId,
      accountId: row.accountId,
      statusValue: 1           // 启用账号
    })
    
    if (result?.result?.success) {
      ElMessage.success('账号启用成功')
      // 清除缓存并刷新数据（不显示刷新成功消息）
      usersStore.clearData()
      rawData.pendingAudit = []
      rawData.disabledUsers = []
      rawData.disabledAccounts = []
      await loadAllData()
    } else {
      ElMessage.error('账号启用失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('账号启用失败:', error)
      ElMessage.error('账号启用失败')
    }
  } finally {
    row.enabling = false
  }
}

// 弹出面板中的操作方法
const handleDisableUserFromDetail = async (userData) => {
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

const handleEnableUserFromDetail = async (userData) => {
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

const handleDisableAccountFromDetail = async (userData, accountData) => {
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
      // 更新弹出面板中的数据
      accountData.status = 0
      // 更新统计数据
      searchResultData.value.activeAccounts--
      searchResultData.value.disabledAccounts++
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

const handleEnableAccountFromDetail = async (userData, accountData) => {
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
      // 更新弹出面板中的数据
      accountData.status = 1
      // 更新统计数据
      searchResultData.value.activeAccounts++
      searchResultData.value.disabledAccounts--
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

const handleApproveFromDetail = async (userData, accountData) => {
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
      // 更新弹出面板中的数据
      accountData.auditStatus = 1
      // 更新统计数据
      searchResultData.value.pendingAuditAccounts--
      searchResultData.value.approvedAccounts++
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

const handleRejectFromDetail = async (userData, accountData) => {
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
      // 更新弹出面板中的数据
      accountData.auditStatus = 2
      // 更新统计数据
      searchResultData.value.pendingAuditAccounts--
      searchResultData.value.rejectedAccounts++
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

// 辅助方法
const getSelectedPlatformDisplay = () => {
  const platform = platformOptions.find(p => p.value === filterForm.platformType)
  return platform ? platform.label : ''
}

const getSelectedTrackDisplay = () => {
  const track = trackTypeOptions.find(t => t.value === filterForm.trackType)
  return track ? track.label : ''
}

// 初始化数据加载（优先使用缓存）
const initializeData = async () => {
  try {
    overviewLoading.value = true
    
    // 检查是否有缓存数据
    const cached = usersStore.getData()
    let hasAnyCache = false
    
    if (cached) {
      // 检查三种数据类型是否都有缓存
      const types = ['pendingAudit', 'disabledUsers', 'disabledAccounts']
      for (const type of types) {
        if (cached[type] && cached[type].length >= 0) {
          rawData[type] = cached[type]
          hasAnyCache = true
        }
      }
    }
    
    // 如果有缓存数据，使用缓存并更新统计
    if (hasAnyCache) {
      console.log('使用缓存数据初始化页面')
      overviewData.pendingAudit = rawData.pendingAudit.length
      overviewData.disabledUsers = rawData.disabledUsers.length
      overviewData.disabledAccounts = rawData.disabledAccounts.length
      
      // 更新页面时间（使用缓存时间）
      updatePageTime({ lastUpdateTime }, usersStore)
      return
    }
    
    // 没有缓存时才获取数据
    console.log('没有缓存数据，从服务器获取')
    await loadAllData()
    
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败')
  } finally {
    overviewLoading.value = false
  }
}

// 加载所有数据（不清除缓存）
const loadAllData = async () => {
  // 并发获取三种数据
  const promises = [
    fetchDataByType('pendingAudit'),
    fetchDataByType('disabledUsers'),
    fetchDataByType('disabledAccounts')
  ]
  
  await Promise.all(promises)
  
  // 更新统计数据
  overviewData.pendingAudit = rawData.pendingAudit.length
  overviewData.disabledUsers = rawData.disabledUsers.length
  overviewData.disabledAccounts = rawData.disabledAccounts.length
  
  // 更新页面时间
  updatePageTime({ lastUpdateTime }, usersStore)
}

// 生命周期
onMounted(async () => {
  // 初始化数据（优先使用缓存）
  await initializeData()
})
</script>

<style lang="scss" scoped>
.users-page {
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
}

.overview-card, .filter-card, .list-card {
  margin-bottom: 20px;
  border-radius: 8px;
  border: none;
  
  :deep(.el-card__header) {
    background-color: #fafafa;
    border-bottom: 1px solid #ebeef5;
    padding: 16px 20px;
  }
  
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .section-title {
    font-size: 16px;
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
  }
  
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
        color: white;
        flex-shrink: 0;
        
        &.pending {
          background: #e6a23c;
        }
        
        &.disabled-users {
          background: #6c5ce7;
        }
        
        &.disabled-accounts {
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

.filter-form {
  .filter-row {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .filter-divider {
    height: 1px;
    background: linear-gradient(to right, transparent, #e4e7ed 20%, #e4e7ed 80%, transparent);
    margin: 20px 0;
    opacity: 0.6;
  }
  
  :deep(.el-form-item) {
    margin-bottom: 0;
    
    .el-form-item__label {
      font-weight: 500;
      color: #606266;
    }
  }
  
  .option-with-icon {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .option-icon {
      font-size: 16px;
    }
  }
}

.user-info {
  .user-id {
    font-size: 12px;
    color: #909399;
    margin-bottom: 4px;
    
    .truncate-text {
      display: inline-block;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: top;
    }
  }
  
  .user-details {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .nickname {
      font-weight: 500;
      color: #303133;
    }
    
    .phone {
      font-size: 12px;
      color: #909399;
    }
  }
}

.account-info {
  .account-nickname {
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }
  
  .account-phone {
    font-size: 12px;
    color: #909399;
  }
}

:deep(.el-table) {
  .el-table__header {
    th {
      background-color: #fafafa;
      color: #606266;
      font-weight: 500;
    }
  }
  
  .el-table__row {
    &:hover {
      background-color: #f5f7fa;
    }
  }
}

:deep(.el-tabs) {
  .el-tabs__header {
    margin-bottom: 20px;
    
    .el-tabs__nav-wrap {
      &::after {
        background-color: #ebeef5;
      }
    }
    
    .el-tabs__item {
      font-weight: 500;
      color: #606266;
      
      &.is-active {
        color: #409eff;
        font-weight: 600;
      }
    }
    
    .el-tabs__active-bar {
      background-color: #409eff;
    }
  }
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
  
  .data-count {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  padding: 16px 0;
  border-top: 1px solid #ebeef5;
}

@media (max-width: 768px) {
  .overview-content .stat-cards {
    grid-template-columns: 1fr;
  }
  
  .filter-form {
    :deep(.el-col) {
      margin-bottom: 16px;
    }
  }
}

/* 用户详情弹出面板样式 */
.user-detail-container {
  max-height: 70vh;
  overflow-y: auto;
}

.user-basic-info {
  .card-header {
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
    margin-top: 20px;
  }
}

.accounts-info {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    color: #303133;
  }
  
  .account-item {
    .account-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .account-title {
        font-weight: 600;
        color: #303133;
      }
      
      .account-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
    
    .account-stats {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .user-detail-container {
    max-height: 60vh;
  }
  
  .account-header {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 10px;
    
    .account-actions {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }
  
  .user-stats .el-row,
  .account-stats .el-row {
    .el-col {
      margin-bottom: 10px;
    }
  }
}
</style>