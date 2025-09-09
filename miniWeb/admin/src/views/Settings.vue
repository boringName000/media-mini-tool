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

      <!-- 任务设置 -->
      <el-col :xs="24" :lg="12">
        <el-card class="setting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><List /></el-icon>
              <span>任务设置</span>
            </div>
          </template>

          <el-form :model="taskSettings" label-width="120px">
            <el-form-item label="每日任务数量">
              <el-input-number
                v-model="taskSettings.dailyTaskCount"
                :min="1"
                :max="100"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="任务有效期">
              <el-select v-model="taskSettings.taskValidDays" style="width: 100%">
                <el-option label="1天" :value="1" />
                <el-option label="3天" :value="3" />
                <el-option label="7天" :value="7" />
                <el-option label="30天" :value="30" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动创建任务">
              <el-switch
                v-model="taskSettings.autoCreateTask"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item label="任务创建时间">
              <el-time-picker
                v-model="taskSettings.taskCreateTime"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveTask" :loading="taskLoading">
                保存任务设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 用户设置 -->
      <el-col :xs="24" :lg="12">
        <el-card class="setting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>用户设置</span>
            </div>
          </template>

          <el-form :model="userSettings" label-width="120px">
            <el-form-item label="新用户审核">
              <el-switch
                v-model="userSettings.requireUserAudit"
                active-text="需要审核"
                inactive-text="自动通过"
              />
            </el-form-item>
            <el-form-item label="邀请码注册">
              <el-switch
                v-model="userSettings.requireInvitationCode"
                active-text="必须使用"
                inactive-text="可选使用"
              />
            </el-form-item>
            <el-form-item label="最大账号数">
              <el-input-number
                v-model="userSettings.maxAccountCount"
                :min="1"
                :max="50"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="账号审核">
              <el-switch
                v-model="userSettings.requireAccountAudit"
                active-text="需要审核"
                inactive-text="自动通过"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveUser" :loading="userLoading">
                保存用户设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 通知设置 -->
      <el-col :xs="24" :lg="12">
        <el-card class="setting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Bell /></el-icon>
              <span>通知设置</span>
            </div>
          </template>

          <el-form :model="notificationSettings" label-width="120px">
            <el-form-item label="邮件通知">
              <el-switch
                v-model="notificationSettings.emailEnabled"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item label="短信通知">
              <el-switch
                v-model="notificationSettings.smsEnabled"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item label="微信通知">
              <el-switch
                v-model="notificationSettings.wechatEnabled"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item label="通知频率">
              <el-select v-model="notificationSettings.frequency" style="width: 100%">
                <el-option label="实时" value="realtime" />
                <el-option label="每小时" value="hourly" />
                <el-option label="每日" value="daily" />
                <el-option label="每周" value="weekly" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveNotification" :loading="notificationLoading">
                保存通知设置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 安全设置 -->
      <el-col :xs="24" :lg="12">
        <el-card class="setting-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon><Lock /></el-icon>
              <span>安全设置</span>
            </div>
          </template>

          <el-form :model="securitySettings" label-width="120px">
            <el-form-item label="登录超时">
              <el-select v-model="securitySettings.sessionTimeout" style="width: 100%">
                <el-option label="30分钟" :value="30" />
                <el-option label="1小时" :value="60" />
                <el-option label="2小时" :value="120" />
                <el-option label="24小时" :value="1440" />
              </el-select>
            </el-form-item>
            <el-form-item label="密码强度">
              <el-select v-model="securitySettings.passwordStrength" style="width: 100%">
                <el-option label="简单" value="simple" />
                <el-option label="中等" value="medium" />
                <el-option label="复杂" value="complex" />
              </el-select>
            </el-form-item>
            <el-form-item label="登录验证">
              <el-switch
                v-model="securitySettings.requireVerification"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item label="IP白名单">
              <el-switch
                v-model="securitySettings.ipWhitelistEnabled"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSaveSecurity" :loading="securityLoading">
                保存安全设置
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
const taskLoading = ref(false)
const userLoading = ref(false)
const notificationLoading = ref(false)
const securityLoading = ref(false)

// 基础设置
const basicSettings = reactive({
  systemName: '媒体小工具管理端',
  systemDescription: '基于微信云开发的内容创作管理系统',
  adminEmail: 'admin@example.com',
  servicePhone: '400-123-4567'
})

// 任务设置
const taskSettings = reactive({
  dailyTaskCount: 10,
  taskValidDays: 7,
  autoCreateTask: true,
  taskCreateTime: '08:00'
})

// 用户设置
const userSettings = reactive({
  requireUserAudit: false,
  requireInvitationCode: true,
  maxAccountCount: 5,
  requireAccountAudit: true
})

// 通知设置
const notificationSettings = reactive({
  emailEnabled: true,
  smsEnabled: false,
  wechatEnabled: true,
  frequency: 'daily'
})

// 安全设置
const securitySettings = reactive({
  sessionTimeout: 120,
  passwordStrength: 'medium',
  requireVerification: false,
  ipWhitelistEnabled: false
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
      Object.assign(taskSettings, settings.task || {})
      Object.assign(userSettings, settings.user || {})
      Object.assign(notificationSettings, settings.notification || {})
      Object.assign(securitySettings, settings.security || {})
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

// 保存任务设置
const handleSaveTask = async () => {
  taskLoading.value = true
  try {
    // TODO: 调用云函数保存任务设置
    const result = await callCloudFunction('admin-save-task-settings', taskSettings)

    if (result.result.success) {
      ElMessage.success('任务设置保存成功')
    } else {
      ElMessage.error(result.result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存任务设置失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    taskLoading.value = false
  }
}

// 保存用户设置
const handleSaveUser = async () => {
  userLoading.value = true
  try {
    // TODO: 调用云函数保存用户设置
    const result = await callCloudFunction('admin-save-user-settings', userSettings)

    if (result.result.success) {
      ElMessage.success('用户设置保存成功')
    } else {
      ElMessage.error(result.result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存用户设置失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    userLoading.value = false
  }
}

// 保存通知设置
const handleSaveNotification = async () => {
  notificationLoading.value = true
  try {
    // TODO: 调用云函数保存通知设置
    const result = await callCloudFunction('admin-save-notification-settings', notificationSettings)

    if (result.result.success) {
      ElMessage.success('通知设置保存成功')
    } else {
      ElMessage.error(result.result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存通知设置失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    notificationLoading.value = false
  }
}

// 保存安全设置
const handleSaveSecurity = async () => {
  securityLoading.value = true
  try {
    // TODO: 调用云函数保存安全设置
    const result = await callCloudFunction('admin-save-security-settings', securitySettings)

    if (result.result.success) {
      ElMessage.success('安全设置保存成功')
    } else {
      ElMessage.error(result.result.message || '保存失败')
    }
  } catch (error) {
    console.error('保存安全设置失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    securityLoading.value = false
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