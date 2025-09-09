<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="not-found-content">
        <div class="error-code">404</div>
        <div class="error-message">页面未找到</div>
        <div class="error-description">
          抱歉，您访问的页面不存在或已被删除
        </div>
        <div class="error-actions">
          <el-button type="primary" @click="goHome">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
          <el-button @click="goBack">
            <el-icon><Back /></el-icon>
            返回上页
          </el-button>
        </div>
      </div>
      <div class="not-found-image">
        <el-icon class="error-icon"><Warning /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.go(-1)
}
</script>

<style lang="scss" scoped>
.not-found-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  
  .not-found-container {
    display: flex;
    align-items: center;
    gap: 60px;
    max-width: 800px;
    padding: 40px;
    
    .not-found-content {
      flex: 1;
      
      .error-code {
        font-size: 120px;
        font-weight: bold;
        color: #409EFF;
        line-height: 1;
        margin-bottom: 20px;
      }
      
      .error-message {
        font-size: 32px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
      }
      
      .error-description {
        font-size: 16px;
        color: #606266;
        margin-bottom: 32px;
        line-height: 1.6;
      }
      
      .error-actions {
        display: flex;
        gap: 16px;
        
        .el-button {
          padding: 12px 24px;
          font-size: 16px;
        }
      }
    }
    
    .not-found-image {
      flex-shrink: 0;
      
      .error-icon {
        font-size: 200px;
        color: #E6A23C;
        opacity: 0.8;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .not-found-page {
    .not-found-container {
      flex-direction: column;
      gap: 40px;
      padding: 20px;
      text-align: center;
      
      .not-found-content {
        .error-code {
          font-size: 80px;
        }
        
        .error-message {
          font-size: 24px;
        }
        
        .error-actions {
          justify-content: center;
          flex-wrap: wrap;
        }
      }
      
      .not-found-image {
        .error-icon {
          font-size: 120px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .not-found-page {
    .not-found-container {
      .not-found-content {
        .error-code {
          font-size: 60px;
        }
        
        .error-message {
          font-size: 20px;
        }
        
        .error-description {
          font-size: 14px;
        }
        
        .error-actions {
          .el-button {
            padding: 10px 20px;
            font-size: 14px;
          }
        }
      }
      
      .not-found-image {
        .error-icon {
          font-size: 80px;
        }
      }
    }
  }
}
</style>