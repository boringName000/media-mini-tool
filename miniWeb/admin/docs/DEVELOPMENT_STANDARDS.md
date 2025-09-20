# 管理后台开发规范文档

## 📋 概述

本文档规定了管理后台项目的开发规范，包括数据缓存机制、云函数调用规范等核心开发标准。所有开发人员在开发新功能前必须先阅读并遵循本文档。

## 🗄️ 数据缓存和Store使用规范

### 1. BaseStore 缓存机制

项目使用自定义的 `BaseStore` 实现数据缓存，位于 `src/store/BaseStore.js`。

对于需要缓存多种相关数据类型的场景（如用户管理页面的三种用户状态），可以在 Store 中存储一个包含多个数据类型的对象，页面自己维护需要的数据结构。

#### 基本用法

```javascript
import { xxxStore } from '@/store/index.js'

// 1. 检查缓存
const cached = xxxStore.getData() // 内部已检查 isDataValid()
if (cached) {
  console.log('使用缓存数据')
  // 使用缓存数据
  dataList.value = cached.list || []
  pagination.total = cached.total || 0
  return
}

// 2. 缓存过期或无缓存，获取新数据
loading.value = true
xxxStore.setLoading(true)

try {
  const result = await adminCloudFunctions.getXxxData(params)
  
  if (result.result.success) {
    const data = {
      list: result.result.data.list || [],
      total: result.result.data.total || 0
    }
    
    // 3. 更新UI
    dataList.value = data.list
    pagination.total = data.total
    
    // 4. 更新缓存
    xxxStore.setData(data)
    
    // 5. 更新时间
    updatePageTime({ lastUpdateTime }, xxxStore)
  }
} finally {
  loading.value = false
  xxxStore.setLoading(false)
}
```

#### 缓存策略

- **缓存条件**: 只缓存第一页无搜索条件的数据
- **缓存时效**: 默认5分钟，可在 BaseStore 中配置
- **强制刷新**: 通过 `forceRefresh` 参数跳过缓存检查

```javascript
// 单类型数据缓存
if (pagination.page === 1 && !searchForm.keyword && !searchForm.platform) {
  xxxStore.setData(data)
}

// 多类型数据缓存（存储对象结构）
if (pagination.page === 1 && !hasSearchConditions) {
  const existingData = xxxStore.getData() || {}
  const updatedData = {
    ...existingData,
    [dataType]: data // 更新指定类型的数据
  }
  xxxStore.setData(updatedData)
}

// 强制刷新跳过缓存
const loadData = async (forceRefresh = false) => {
  if (!forceRefresh && pagination.page === 1 && !hasSearchConditions) {
    const cached = xxxStore.getData()
    if (cached && cached[dataType]) {
      // 使用缓存
      return cached[dataType]
    }
  }
  // 获取新数据...
}
```

#### 多类型数据缓存（对象结构）

适用于需要缓存多种相关数据的场景，如用户管理页面的三种用户状态。Store 存储一个包含多个数据类型的对象：

```javascript
// Store 中的数据结构
{
  pendingAudit: [...],     // 待审核账号数据
  disabledUsers: [...],    // 禁用用户数据
  disabledAccounts: [...] // 禁用账号数据
}

// 获取缓存数据
const cached = usersStore.getData()
if (cached && cached.pendingAudit) {
  // 使用待审核数据
  rawData.pendingAudit = cached.pendingAudit
}

// 更新指定类型的数据
const existingData = usersStore.getData() || {}
const updatedData = {
  ...existingData,
  pendingAudit: newData
}
usersStore.setData(updatedData)

// Tab切换智能缓存策略
const handleTabChange = async (tabName) => {
  const cached = usersStore.getData()
  const memoryData = rawData[tabName] || []
  
  // 检查缓存数据
  if (cached && cached[tabName] && cached[tabName].length > 0) {
    rawData[tabName] = cached[tabName]
    return
  }
  
  // 检查内存数据
  if (memoryData.length > 0) {
    return
  }
  
  // 需要请求新数据
  await fetchDataByType(tabName)
}
```

### 2. Store 文件组织

```
src/store/
├── index.js           # 导出所有store实例
├── BaseStore.js       # 基础Store类
├── modules/
│   ├── articles.js    # 文章相关store
│   ├── usersAudit.js  # 用户权限审核相关store
│   ├── accounts.js    # 账号相关store
│   └── ...
```

### 3. 时间更新工具

使用 `updatePageTime` 工具函数统一管理页面更新时间：

```javascript
import { updatePageTime } from '@/utils/timeUtils'

// 更新页面时间
updatePageTime({ lastUpdateTime }, xxxStore)
```

## ☁️ 云函数调用规范

### 1. 统一调用接口

**❌ 错误做法 - 直接调用**
```javascript
import { callAdminCloudFunction } from '@/utils/cloudbase'

// 错误：直接使用 callAdminCloudFunction
const result = await callAdminCloudFunction('admin-get-user-info', params)
```

**✅ 正确做法 - 使用 adminCloudFunctions**
```javascript
import { adminCloudFunctions } from '@/utils/cloudbase'

// 正确：使用封装好的方法
const result = await adminCloudFunctions.getUserInfo(searchType, searchValue)
```

### 2. adminCloudFunctions 优势

- **登录态检查**: 自动检查管理员登录状态
- **错误处理**: 统一的错误处理和提示
- **参数标准化**: 统一的参数传递格式
- **类型安全**: 更好的代码提示和类型检查

### 3. 添加新的云函数方法

在 `src/utils/cloudbase.js` 的 `adminCloudFunctions` 对象中添加：

```javascript
export const adminCloudFunctions = {
  // 现有方法...
  
  // 新增方法
  getNewData: (params) => callAdminCloudFunction('admin-get-new-data', params),
  updateNewData: (id, data) => callAdminCloudFunction('admin-update-new-data', { id, data }),
}
```

### 4. 错误处理规范

```javascript
try {
  const result = await adminCloudFunctions.someMethod(params)
  
  if (result.result.success) {
    // 成功处理
    ElMessage.success('操作成功')
  } else {
    // 业务错误
    ElMessage.error(result.result.message || '操作失败')
  }
} catch (error) {
  // 网络错误或登录态错误
  if (error.message === 'ADMIN_LOGIN_REQUIRED') {
    // 跳转到登录页
    router.push('/login')
  } else {
    console.error('操作失败:', error)
    ElMessage.error('网络错误，请重试')
  }
}
```

## 🎨 页面开发规范

### 1. 页面结构标准

每个管理页面应包含以下标准结构：

```vue
<template>
  <div class="page-name">
    <!-- 1. 页面标题 -->
    <div class="page-header">
      <h1>页面标题</h1>
      <p>页面描述 | 最后更新：{{ lastUpdateTime }}</p>
    </div>

    <!-- 2. 数据纵览（可选） -->
    <el-card class="overview-section" shadow="never">
      <!-- 统计卡片 -->
    </el-card>

    <!-- 3. 筛选操作区域（可选） -->
    <el-card class="search-card" shadow="never">
      <!-- 搜索表单 -->
    </el-card>

    <!-- 4. 数据列表区域 -->
    <el-card class="table-card" shadow="never">
      <!-- 数据表格 -->
    </el-card>
  </div>
</template>
```

### 2. 响应式数据管理

```javascript
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { adminCloudFunctions } from '@/utils/cloudbase'
import { updatePageTime } from '@/utils/timeUtils'
import { xxxStore } from '@/store/index.js'

// 响应式数据
const loading = ref(false)
const lastUpdateTime = ref('')
const dataList = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

// 数据加载函数
const loadData = async (forceRefresh = false) => {
  // 按照缓存规范实现...
}

onMounted(() => {
  loadData()
})
</script>
```

### 3. 样式规范

```scss
<style lang="scss" scoped>
.page-name {
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
  
  .overview-section,
  .search-card,
  .table-card {
    margin-bottom: 16px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-name {
    // 移动端适配
  }
}
</style>
```

## 🛠️ 工具函数使用

### 1. 平台类型工具

```javascript
import { getPlatformName, getPlatformOptions } from '@/utils/platformUtils'

// 获取平台名称
const platformName = getPlatformName('1') // '微信公众号'

// 获取平台选项
const options = getPlatformOptions() // [{ label: '微信公众号', value: '1' }, ...]
```

### 2. 赛道类型工具

```javascript
import { getTrackTypeName, getTrackTypeOptions } from '@/utils/trackTypeUtils'

// 获取赛道名称
const trackName = getTrackTypeName('1') // '美食赛道'

// 获取赛道选项
const options = getTrackTypeOptions() // [{ label: '美食赛道', value: '1' }, ...]
```

### 3. 时间格式化工具

```javascript
import { formatDateTime, updatePageTime } from '@/utils/timeUtils'

// 格式化时间
const formattedTime = formatDateTime(new Date()) // '2025-09-16 17:30:00'

// 更新页面时间
updatePageTime({ lastUpdateTime }, store)
```

## 📝 开发检查清单

在提交代码前，请确保：

### ✅ 云函数调用
- [ ] 使用 `adminCloudFunctions` 而不是 `callAdminCloudFunction`
- [ ] 所有云函数方法都已在 `cloudbase.js` 中定义
- [ ] 错误处理符合规范

### ✅ 数据缓存
- [ ] 使用 BaseStore 缓存机制
- [ ] 正确设置缓存条件（第一页无搜索）
- [ ] 实现强制刷新功能
- [ ] 使用 `updatePageTime` 更新时间

### ✅ 页面结构
- [ ] 页面结构符合标准模板
- [ ] 响应式设计适配移动端
- [ ] 使用项目统一的工具函数

### ✅ 代码质量
- [ ] 使用 Vue 3 Composition API
- [ ] 使用 `<script setup>` 语法
- [ ] 遵循 ESLint 规则
- [ ] 添加必要的注释

## 🔄 版本更新

- **v1.0.0** (2025-09-16): 初始版本，定义基础开发规范
- 后续版本将根据项目发展持续更新

---

**重要提醒**: 本文档是强制性开发规范，所有开发人员必须严格遵循。如有疑问或建议，请及时与团队沟通。