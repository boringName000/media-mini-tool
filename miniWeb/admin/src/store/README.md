# 轻量级Store系统使用指南

## 📖 概述

这是一个专为管理端设计的轻量级数据缓存Store系统，提供统一的数据管理方案，避免了Pinia的复杂度，同时保持了良好的开发体验。

## 🏗️ 架构设计

```
src/store/
├── BaseStore.js     # 通用Store基类
├── index.js         # Store实例管理中心
└── README.md        # 使用文档
```

## 🎯 设计理念

- **轻量级**: 避免过度工程化，保持简洁
- **统一性**: 提供一致的API和使用方式
- **灵活性**: 支持不同的缓存策略和配置
- **可扩展**: 易于添加新的Store实例

## 📋 可用的Store实例

| Store名称 | 用途 | 过期时间 | 持久化 |
|-----------|------|----------|--------|
| `dashboardStore` | 仪表盘数据 | 按天 | ❌ |
| `usersStore` | 用户管理 | 5分钟 | ❌ |
| `accountsStore` | 用户收益 | 10分钟 | ❌ |
| `articlesStore` | 文章管理 | 3分钟 | ❌ |
| `articleAuditStore` | 文章审核 | 2分钟 | ❌ |
| `invitationsStore` | 邀请码管理 | 15分钟 | ❌ |
| `settingsStore` | 系统设置 | 1小时 | ✅ |

## 🚀 基本使用方法

### 1. 导入Store

```javascript
import { usersStore, articlesStore } from '@/store'
```

### 2. 数据获取模式

```javascript
// 在Vue组件中使用
export default {
  async mounted() {
    await this.loadUsers()
  },
  
  methods: {
    async loadUsers(forceRefresh = false) {
      try {
        // 检查缓存
        if (!forceRefresh) {
          const cachedData = usersStore.getData()
          if (cachedData) {
            this.users = cachedData
            return
          }
        }

        // 防止重复请求
        if (usersStore.isLoading()) {
          return
        }

        // 开始加载
        this.loading = true
        usersStore.setLoading(true)

        // 调用云函数
        const result = await adminCloudFunctions.getAllUsers()
        
        if (result.result.success) {
          this.users = result.result.data
          usersStore.setData(result.result.data)
        }
      } catch (error) {
        console.error('加载用户数据失败:', error)
      } finally {
        this.loading = false
        usersStore.setLoading(false)
      }
    }
  }
}
```

### 3. Composition API使用

```javascript
import { ref, onMounted } from 'vue'
import { usersStore } from '@/store'
import { adminCloudFunctions } from '@/utils/cloudbase'

export default {
  setup() {
    const users = ref([])
    const loading = ref(false)

    const loadUsers = async (forceRefresh = false) => {
      // 检查缓存
      if (!forceRefresh) {
        const cachedData = usersStore.getData()
        if (cachedData) {
          users.value = cachedData
          return
        }
      }

      // 加载数据
      loading.value = true
      usersStore.setLoading(true)

      try {
        const result = await adminCloudFunctions.getAllUsers()
        if (result.result.success) {
          users.value = result.result.data
          usersStore.setData(result.result.data)
        }
      } finally {
        loading.value = false
        usersStore.setLoading(false)
      }
    }

    onMounted(() => loadUsers())

    return {
      users,
      loading,
      loadUsers,
      refreshUsers: () => loadUsers(true)
    }
  }
}
```

## 🔧 高级功能

### 1. 创建临时Store

```javascript
import { createTempStore } from '@/store'

// 创建一次性使用的Store
const tempStore = createTempStore('temp-data', {
  expireTime: 60 * 1000 // 1分钟过期
})
```

### 2. 创建长期缓存Store

```javascript
import { createLongTermStore } from '@/store'

// 创建长期缓存Store
const configStore = createLongTermStore('app-config', {
  enablePersist: true,
  persistKey: 'app_config'
})
```

### 3. Store状态监控

```javascript
import { getAllStoreStatus } from '@/store'

// 获取所有Store状态
const status = getAllStoreStatus()
console.log('Store状态:', status)

// 单个Store状态
const userStoreStatus = usersStore.getStatus()
console.log('用户Store状态:', userStoreStatus)
```

### 4. 批量管理

```javascript
import { clearAllStores, clearExpiredStores } from '@/store'

// 清除所有Store数据
clearAllStores()

// 只清除过期的Store数据
clearExpiredStores()
```

## 📝 最佳实践

### 1. 缓存策略选择

```javascript
// 实时性要求高的数据 - 短过期时间
const realtimeStore = new BaseStore('realtime', {
  expireTime: 30 * 1000 // 30秒
})

// 相对稳定的数据 - 长过期时间
const stableStore = new BaseStore('stable', {
  expireTime: 30 * 60 * 1000 // 30分钟
})

// 按天更新的数据 - 日期检查
const dailyStore = new BaseStore('daily', {
  dayOnly: true
})
```

### 2. 错误处理

```javascript
const loadData = async () => {
  try {
    // 数据加载逻辑
  } catch (error) {
    // 发生错误时清除可能的脏数据
    store.clearData()
    throw error
  } finally {
    store.setLoading(false)
  }
}
```

### 3. 组件卸载清理

```javascript
export default {
  beforeUnmount() {
    // 如果需要，可以在组件卸载时清理Store
    // 通常不需要，因为Store是全局共享的
  }
}
```

## 🔍 调试技巧

### 1. 启用调试模式

在 `.env` 文件中设置：
```
VITE_DEBUG=true
```

### 2. 查看Store状态

```javascript
// 在浏览器控制台中
console.log(usersStore.getStatus())
```

### 3. 手动清理数据

```javascript
// 清理特定Store
usersStore.reset()

// 清理所有Store
import { clearAllStores } from '@/store'
clearAllStores()
```

## 🆚 与Pinia对比

| 特性 | 轻量级Store | Pinia |
|------|-------------|-------|
| 学习成本 | 低 | 中等 |
| 包大小 | 极小 | 较大 |
| 功能丰富度 | 基础够用 | 功能丰富 |
| TypeScript支持 | 基础 | 完整 |
| DevTools支持 | 无 | 有 |
| 适用场景 | 中小型项目 | 大型项目 |

## 🚀 扩展指南

如果需要添加新功能，可以：

1. **扩展BaseStore类**：添加新的方法
2. **创建专用Store类**：继承BaseStore并添加特定逻辑
3. **添加中间件**：在数据设置/获取时添加处理逻辑

```javascript
// 扩展示例
class UserStore extends BaseStore {
  constructor() {
    super('users', { expireTime: 5 * 60 * 1000 })
  }

  // 添加用户特定的方法
  getUserById(id) {
    const users = this.getData()
    return users?.find(user => user.id === id)
  }

  updateUser(id, userData) {
    const users = this.getData()
    if (users) {
      const index = users.findIndex(user => user.id === id)
      if (index !== -1) {
        users[index] = { ...users[index], ...userData }
        this.setData([...users])
      }
    }
  }
}
```

这个轻量级Store系统为项目提供了简洁而强大的数据管理能力，既满足了当前需求，又为未来扩展留下了空间。