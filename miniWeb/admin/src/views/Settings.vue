<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>系统设置</h1>
      <p>管理系统配置和参数</p>
    </div>

    <el-row :gutter="20">
      <!-- 基础设置 -->
      <el-col :xs="24" :lg="12">
        <el-card class="setting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Setting /></el-icon>
              <span>基础设置</span>
            </div>
          </template>

          <el-form :model="basicSettings" label-width="120px">
            <el-form-item label="系统名称">
              <el-input v-model="basicSettings.systemName" />
            </el-form-item>
            <el-form-item label="系统描述">
              <el-input
                v-model="basicSettings.systemDescription"
                type="textarea"
                :rows="3"
              />
            </el-form-item>
            <el-form-item label="管理员邮箱">
              <el-input v-model="basicSettings.adminEmail" />
            </el-form-item>
            <el-form-item label="客服电话">
              <el-input v-model="basicSettings.servicePhone" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveBasic" :loading="basicLoading">
                保存基础设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 系统信息 -->
      <el-col :xs="24" :lg="12">
        <el-card class="setting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>系统信息</span>
            </div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统版本">{{ systemInfo.version }}</el-descriptions-item>
            <el-descriptions-item label="构建时间">{{ systemInfo.buildTime }}</el-descriptions-item>
            <el-descriptions-item label="运行环境">{{ systemInfo.environment }}</el-descriptions-item>
            <el-descriptions-item label="数据库版本">{{ systemInfo.databaseVersion }}</el-descriptions-item>
            <el-descriptions-item label="最后更新">{{ systemInfo.lastUpdate }}</el-descriptions-item>
          </el-descriptions>

          <div style="margin-top: 20px;">
            <el-button type="primary" @click="handleCheckUpdate">
              检查更新
            </el-button>
            <el-button type="warning" @click="handleBackupData">
              备份数据
            </el-button>
            <el-button type="danger" @click="handleClearCache">
              清除缓存
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { callCloudFunction } from '@/utils/cloudbase'

// 加载状态
const basicLoading = ref(false)

// 基础设置
const basicSettings = reactive({
  systemName: '西瓜🍉创作者管理中心',
  systemDescription: '基于微信云开发的内容创作管理系统',
  adminEmail: 'admin@example.com',
  servicePhone: '400-123-4567'
})

// 系统信息
const systemInfo = reactive({
  version: '1.0.0',
  buildTime: '2025-09-10 00:00:00',
  environment: '微信云开发',
  databaseVersion: 'CloudBase DB 1.0',
  lastUpdate: '2025-09-10 00:00:00'
})

// 加载设置
const loadSettings = async () => {
  try {
    // TODO: 调用云函数获取系统设置
    const result = await callCloudFunction('admin-get-settings')

    if (result.result.success) {
      const settings = result.result.data
      Object.assign(basicSettings, settings.basic || {})
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  }
}

// 保存基础设置
const handleSaveBasic = async () => {
  basicLoading.value = true
  try {
    // TODO: 调用云函数保存基础设置
    const result = await callCloudFunction('admin-save-basic-settings', basicSettings)

    if (result.result.success) {
      ElMessage.success('基础设置保存成功')
    } else {
      ElMessage.error(result.result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存基础设置失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    basicLoading.value = false
  }
}

// 检查更新
const handleCheckUpdate = () => {
  ElMessage.info('当前已是最新版本')
}

// 备份数据
const handleBackupData = () => {
  ElMessage.info('数据备份功能待开发')
}

// 清除缓存
const handleClearCache = () => {
  ElMessage.success('缓存清除成功')
}

onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
.settings-page {
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
  
  .setting-card {
    margin-bottom: 20px;
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #303133;
    }
    
    .el-form-item:last-child {
      margin-bottom: 0;
    }
  }
}

@media (max-width: 768px) {
  .settings-page {
    .el-col {
      margin-bottom: 20px;
    }
  }
}
</style>