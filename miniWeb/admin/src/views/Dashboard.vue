<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>仪表盘</h1>
      <p>欢迎使用媒体小工具管理系统</p>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="stat in stats" :key="stat.key">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
          <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
            <el-icon><ArrowUp v-if="stat.trend > 0" /><ArrowDown v-else /></el-icon>
            {{ Math.abs(stat.trend) }}%
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :lg="12">
        <el-card title="用户增长趋势" shadow="hover">
          <div class="chart-container">
            <!-- TODO: 集成图表库如 ECharts 或 Chart.js -->
            <div class="chart-placeholder">
              <el-icon size="48"><TrendCharts /></el-icon>
              <p>用户增长趋势图</p>
              <el-button type="primary" @click="loadUserTrend">加载数据</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card title="文章发布统计" shadow="hover">
          <div class="chart-container">
            <div class="chart-placeholder">
              <el-icon size="48"><PieChart /></el-icon>
              <p>文章发布统计图</p>
              <el-button type="primary" @click="loadArticleStats">加载数据</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-row :gutter="20" class="activity-row">
      <el-col :xs="24" :lg="16">
        <el-card title="最近活动" shadow="hover">
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.timestamp"
              :color="activity.color"
            >
              <div class="activity-content">
                <h4>{{ activity.title }}</h4>
                <p>{{ activity.description }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
          
          <div v-if="recentActivities.length === 0" class="empty-state">
            <el-empty description="暂无活动记录" />
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8">
        <el-card title="快速操作" shadow="hover">
          <div class="quick-actions">
            <el-button
              v-for="action in quickActions"
              :key="action.key"
              :type="action.type"
              :icon="action.icon"
              @click="handleQuickAction(action.key)"
              class="action-btn"
            >
              {{ action.label }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { callCloudFunction } from '@/utils/cloudbase'

const router = useRouter()

// 统计数据
const stats = ref([
  {
    key: 'users',
    label: '总用户数',
    value: 0,
    icon: 'User',
    color: '#409EFF',
    trend: 12.5
  },
  {
    key: 'accounts',
    label: '账号总数',
    value: 0,
    icon: 'UserFilled',
    color: '#67C23A',
    trend: 8.2
  },
  {
    key: 'articles',
    label: '文章总数',
    value: 0,
    icon: 'Document',
    color: '#E6A23C',
    trend: -2.1
  },
  {
    key: 'tasks',
    label: '任务总数',
    value: 0,
    icon: 'List',
    color: '#F56C6C',
    trend: 15.3
  }
])

// 最近活动
const recentActivities = ref([])

// 快速操作
const quickActions = [
  { key: 'add-user', label: '添加用户', type: 'primary', icon: 'Plus' },
  { key: 'create-invitation', label: '生成邀请码', type: 'success', icon: 'Ticket' },
  { key: 'view-reports', label: '查看报告', type: 'info', icon: 'DataAnalysis' },
  { key: 'system-settings', label: '系统设置', type: 'warning', icon: 'Setting' }
]

// 加载仪表盘数据
const loadDashboardData = async () => {
  try {
    // TODO: 调用云函数获取仪表盘统计数据
    const result = await callCloudFunction('admin-get-dashboard-stats')
    
    if (result.result.success) {
      const data = result.result.data
      
      // 更新统计数据
      stats.value.forEach(stat => {
        if (data[stat.key] !== undefined) {
          stat.value = data[stat.key]
        }
      })
      
      // 更新最近活动
      recentActivities.value = data.recentActivities || []
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

// 加载用户增长趋势
const loadUserTrend = async () => {
  try {
    // TODO: 调用云函数获取用户增长数据
    const result = await callCloudFunction('admin-get-user-trend')
    console.log('用户增长趋势数据:', result)
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('加载用户趋势失败:', error)
    ElMessage.error('加载失败')
  }
}

// 加载文章统计
const loadArticleStats = async () => {
  try {
    // TODO: 调用云函数获取文章统计数据
    const result = await callCloudFunction('admin-get-article-stats')
    console.log('文章统计数据:', result)
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('加载文章统计失败:', error)
    ElMessage.error('加载失败')
  }
}

// 处理快速操作
const handleQuickAction = (actionKey) => {
  switch (actionKey) {
    case 'add-user':
      router.push('/users')
      break
    case 'create-invitation':
      router.push('/invitations')
      break
    case 'view-reports':
      ElMessage.info('报告功能开发中')
      break
    case 'system-settings':
      router.push('/settings')
      break
    default:
      ElMessage.info(`执行操作: ${actionKey}`)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .dashboard-header {
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
  
  .stats-row {
    margin-bottom: 24px;
    
    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-right: 16px;
        }
        
        .stat-info {
          flex: 1;
          
          .stat-value {
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
      
      .stat-trend {
        margin-top: 12px;
        font-size: 12px;
        display: flex;
        align-items: center;
        
        &.up {
          color: #67C23A;
        }
        
        &.down {
          color: #F56C6C;
        }
        
        .el-icon {
          margin-right: 4px;
        }
      }
    }
  }
  
  .charts-row {
    margin-bottom: 24px;
    
    .chart-container {
      height: 300px;
      
      .chart-placeholder {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #909399;
        
        p {
          margin: 16px 0;
          font-size: 16px;
        }
      }
    }
  }
  
  .activity-row {
    .activity-content {
      h4 {
        margin: 0 0 8px 0;
        color: #303133;
      }
      
      p {
        margin: 0;
        color: #606266;
        font-size: 14px;
      }
    }
    
    .empty-state {
      padding: 40px 0;
    }
    
    .quick-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      
      .action-btn {
        width: 100%;
        justify-content: flex-start;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .dashboard {
    .stats-row {
      .stat-card {
        margin-bottom: 16px;
      }
    }
    
    .charts-row {
      .el-col {
        margin-bottom: 16px;
      }
    }
  }
}
</style>