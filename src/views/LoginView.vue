<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>学生成绩管理系统</h2>
        <p>请登录您的账户</p>
      </div>
      
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        class="login-form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item prop="username" label="用户名">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password" label="密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>

        <el-form-item prop="role" label="角色">
          <el-select 
            v-model="form.role" 
            placeholder="请选择角色" 
            size="large"
            style="width: 100%"
          >
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            native-type="submit"
            :loading="authStore.loading"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>默认测试账户：</p>
        <p>管理员: admin / admin123</p>
        <p>教师: teacher / teacher123</p>
        <p>学生: student / student123</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
  role: 'student' as 'admin' | 'teacher' | 'student'
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  const isValid = await formRef.value.validate()
  if (!isValid) return

  try {
    await authStore.handleLogin(form)
    router.push('/main')
  } catch (error) {
    // 错误已在request.ts中统一处理，这里无需额外操作
    // 保持在登录页面，让用户重新输入
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 8px;
}

.login-header p {
  color: #666;
  font-size: 14px;
}

.login-form {
  margin-bottom: 24px;
}

.login-footer {
  text-align: center;
  color: #666;
  font-size: 12px;
  line-height: 1.6;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.login-footer p {
  margin: 2px 0;
}
</style>