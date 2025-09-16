<template>
  <div class="dashboard-page">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="page-title">仪表盘</h1>
        <p class="page-subtitle" v-if="lastUpdateTime">
          最后更新：{{ lastUpdateTime }}
        </p>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          :icon="RefreshRight" 
          :loading="loading"
          @click="refreshData"
          size="default"
        >
          {{ loading ? '刷新中...' : '刷新数据' }}
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !dashboardData" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 仪表盘内容 -->
    <div v-else-if="dashboardData" class="dashboard-content">
      <!-- 核心统计卡片 -->
      <div class="stats-cards">
        <div class="stats-card">
          <div class="card-icon users">
            <el-icon><User /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ dashboardData.totalUsers }}</div>
            <div class="card-label">总用户数</div>
          </div>
        </div>

        <div class="stats-card">
          <div class="card-icon accounts">
            <el-icon><Link /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ dashboardData.totalAccounts }}</div>
            <div class="card-label">总账号数</div>
          </div>
        </div>

        <div class="stats-card">
          <div class="card-icon no-accounts">
            <el-icon><User /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ dashboardData.usersWithoutAccounts }}</div>
            <div class="card-label">未绑定账号用户数</div>
          </div>
        </div>

        <div class="stats-card">
          <div class="card-icon multi-accounts">
            <el-icon><Connection /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ dashboardData.usersWithMultipleAccounts }}</div>
            <div class="card-label">绑定多账号用户数</div>
          </div>
        </div>

        <div class="stats-card">
          <div class="card-icon uncompleted-tasks">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ dashboardData.todayClaimedTasksCount }}</div>
            <div class="card-label">今日已领取文章数</div>
          </div>
        </div>

        <div class="stats-card">
          <div class="card-icon completed-tasks">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ dashboardData.todayCompletedTasksCount }}</div>
            <div class="card-label">今日已领取已发布数</div>
          </div>
        </div>

      </div>

      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="chart-row">
          <!-- 活跃用户趋势 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>最近7天活跃用户</h3>
              <span class="chart-total">总计: {{ getTotalFromTrend(dashboardData.activeUsersLast7Days) }}</span>
            </div>
            <div class="chart-content">
              <div class="trend-chart">
                <div 
                  v-for="item in dashboardData.activeUsersLast7Days" 
                  :key="item.date"
                  class="trend-bar"
                >
                  <div 
                    class="bar active-users"
                    :style="{ height: getBarHeight(item.count, dashboardData.activeUsersLast7Days) }"
                  ></div>
                  <div class="bar-label">{{ formatDate(item.date) }}</div>
                  <div class="bar-value">{{ item.count }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 用户注册趋势 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>最近7天注册用户</h3>
              <span class="chart-total">总计: {{ getTotalFromTrend(dashboardData.userRegistrationsLast7Days) }}</span>
            </div>
            <div class="chart-content">
              <div class="trend-chart">
                <div 
                  v-for="item in dashboardData.userRegistrationsLast7Days" 
                  :key="item.date"
                  class="trend-bar"
                >
                  <div 
                    class="bar registrations"
                    :style="{ height: getBarHeight(item.count, dashboardData.userRegistrationsLast7Days) }"
                  ></div>
                  <div class="bar-label">{{ formatDate(item.date) }}</div>
                  <div class="bar-value">{{ item.count }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-row">
          <!-- 文章发布趋势 -->
          <div class="chart-card full-width">
            <div class="chart-header">
              <h3>最近7天文章发布</h3>
              <span class="chart-total">总计: {{ getTotalFromTrend(dashboardData.articlePublishLast7Days) }}</span>
            </div>
            <div class="chart-content">
              <div class="trend-chart">
                <div 
                  v-for="item in dashboardData.articlePublishLast7Days" 
                  :key="item.date"
                  class="trend-bar"
                >
                  <div 
                    class="bar articles"
                    :style="{ height: getBarHeight(item.count, dashboardData.articlePublishLast7Days) }"
                  ></div>
                  <div class="bar-label">{{ formatDate(item.date) }}</div>
                  <div class="bar-value">{{ item.count }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <el-result
        icon="error"
        title="数据加载失败"
        :sub-title="error"
      >
        <template #extra>
          <el-button type="primary" @click="loadDashboardData">重新加载</el-button>
        </template>
      </el-result>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-container">
      <el-empty description="暂无数据">
        <el-button type="primary" @click="loadDashboardData">加载数据</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight, User, CircleCheck, CircleClose, Link, Connection } from '@element-plus/icons-vue'
import { adminCloudFunctions } from '@/utils/cloudbase'
import { dashboardStore } from '@/store'
import { formatTime, updatePageTime } from '@/utils/timeUtils'

// 响应式数据
const loading = ref(false)
const dashboardData = ref(null)
const error = ref('')
const lastUpdateTime = ref(null)



// 加载仪表盘数据
const loadDashboardData = async (forceRefresh = false) => {
  try {
    // 1. 检查缓存（如果不是强制刷新）
    if (!forceRefresh) {
      const cached = dashboardStore.getData() // 内部已检查isDataValid()
      if (cached) {
        console.log('使用缓存的仪表盘数据')
        dashboardData.value = cached
        
        // 显示缓存时间
        const cachedTime = dashboardStore.getUpdateTime()
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

    // 检查是否正在加载
    if (dashboardStore.isLoading()) {
      console.log('数据正在加载中，跳过重复请求')
      return
    }

    // 2. 缓存过期或无缓存，获取新数据
    loading.value = true
    dashboardStore.setLoading(true)
    error.value = ''

    console.log('开始加载仪表盘数据...')
    const result = await adminCloudFunctions.getUserDashboard()

    if (result.result.success) {
      const data = result.result.data
      console.log('仪表盘数据加载成功:', data)
      
      // 3. 更新数据、缓存、store、时间
      dashboardData.value = data
      dashboardStore.setData(data)
      updatePageTime({ lastUpdateTime }, dashboardStore)
      
      ElMessage.success('数据加载成功')
    } else {
      throw new Error(result.result.error || '数据加载失败')
    }
  } catch (err) {
    console.error('加载仪表盘数据失败:', err)
    error.value = err.message || '数据加载失败'
    ElMessage.error('数据加载失败: ' + error.value)
  } finally {
    loading.value = false
    dashboardStore.setLoading(false)
  }
}

// 刷新数据
const refreshData = async () => {
  await loadDashboardData(true)
}

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 计算趋势数据总计
const getTotalFromTrend = (trendData) => {
  if (!trendData || !Array.isArray(trendData)) return 0
  return trendData.reduce((sum, item) => sum + (item.count || 0), 0)
}

// 计算柱状图高度
const getBarHeight = (value, dataArray) => {
  if (!dataArray || dataArray.length === 0) return '0%'
  const maxValue = Math.max(...dataArray.map(item => item.count || 0))
  if (maxValue === 0) return '0%'
  const percentage = Math.max((value / maxValue) * 100, 5) // 最小5%高度
  return `${percentage}%`
}

// 组件挂载时加载数据
onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left .page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-left .page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.loading-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-content {
  space-y: 24px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

@media (min-width: 1200px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1600px) {
  .stats-cards {
    grid-template-columns: repeat(6, 1fr);
  }
}

.stats-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.card-icon.users { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.card-icon.accounts { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.card-icon.no-accounts { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); }
.card-icon.multi-accounts { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.card-icon.completed-tasks { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
.card-icon.uncompleted-tasks { background: linear-gradient(135deg, #ff8a80 0%, #ffab91 100%); }

.card-content {
  flex: 1;
}

.card-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.card-label {
  font-size: 14px;
  color: #909399;
}

/* 图表区域 */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chart-card.full-width {
  grid-column: 1 / -1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-total {
  font-size: 14px;
  color: #909399;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  padding: 20px 0;
  gap: 8px;
}

.trend-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar {
  width: 100%;
  max-width: 40px;
  border-radius: 4px 4px 0 0;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  min-height: 4px;
}

.bar:hover {
  opacity: 0.8;
  transform: scaleY(1.05);
}

.bar.active-users { background: linear-gradient(to top, #667eea, #764ba2); }
.bar.registrations { background: linear-gradient(to top, #f093fb, #f5576c); }
.bar.articles { background: linear-gradient(to top, #4facfe, #00f2fe); }

.bar-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.bar-value {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}



/* 错误和空状态 */
.error-container,
.empty-container {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .stats-cards {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }
  
  .chart-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .detail-items {
    grid-template-columns: 1fr;
  }
  
  .trend-chart {
    height: 150px;
  }
}
</style>