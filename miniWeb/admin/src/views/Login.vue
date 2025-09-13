<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>管理后台登录</h2>
        <p>创作者中心管理系统</p>
      </div>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-btn"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>© 2025 西瓜🍉创作者中心管理系统</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogin } from '@/utils/cloudbase'

const router = useRouter()

const loginFormRef = ref()
const loading = ref(false)

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return
    
    loading.value = true
    
    const result = await adminLogin(loginForm.username, loginForm.password)
    
    if (result.success) {
      ElMessage.success('登录成功')
      // 登录成功，跳转到首页
      router.push('/')
    } else {
      ElMessage.error(result.message || '登录失败，请检查用户名和密码')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 如果记住了用户名，自动填充
  const savedUsername = localStorage.getItem('admin_username')
  if (savedUsername) {
    loginForm.username = savedUsername
    loginForm.remember = true
  }
})

// 监听记住我选项
watch(() => loginForm.remember, (newVal) => {
  if (newVal && loginForm.username) {
    localStorage.setItem('admin_username', loginForm.username)
  } else {
    localStorage.removeItem('admin_username')
  }
})

// 监听用户名变化，如果记住我被选中，保存用户名
watch(() => loginForm.username, (newVal) => {
  if (loginForm.remember && newVal) {
    localStorage.setItem('admin_username', newVal)
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 40px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
  
  h2 {
    color: #333;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
}

.login-form {
  width: 100%;
  box-sizing: border-box;
  
  .el-form-item {
    margin-bottom: 20px;
    width: 100%;
    box-sizing: border-box;
  }
  
  :deep(.el-input) {
    width: 100%;
    box-sizing: border-box;
  }
  
  :deep(.el-input__wrapper) {
    width: 100%;
    box-sizing: border-box;
  }
  
  .login-btn {
    width: 100%;
    height: 45px;
    font-size: 16px;
    border-radius: 6px;
    box-sizing: border-box;
  }
}

.login-footer {
  text-align: center;
  margin-top: 30px;
  
  p {
    color: #999;
    font-size: 12px;
  }
}

// 响应式设计
@media (max-width: 480px) {
  .login-box {
    padding: 30px 20px;
  }
}
</style>