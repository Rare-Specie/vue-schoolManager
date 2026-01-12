<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
            </div>
          </template>
          <div class="profile-info" v-if="authStore.user">
            <div class="info-item">
              <span class="label">用户名：</span>
              <span class="value">{{ authStore.user.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">姓名：</span>
              <span class="value">{{ authStore.user.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">角色：</span>
              <span class="value">{{ roleText }}</span>
            </div>
            <div class="info-item" v-if="authStore.user.class">
              <span class="label">班级：</span>
              <span class="value">{{ authStore.user.class }}</span>
            </div>
            <div class="info-item" v-if="authStore.user.studentId">
              <span class="label">学号：</span>
              <span class="value">{{ authStore.user.studentId }}</span>
            </div>
            <div class="info-item">
              <span class="label">用户ID：</span>
              <span class="value">{{ authStore.user.id }}</span>
            </div>
          </div>
          <div class="profile-actions">
            <el-button type="primary" @click="showPasswordDialog">修改密码</el-button>
            <el-button type="success" @click="refreshProfile">刷新信息</el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 快捷操作卡片 -->
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button 
              v-for="action in quickActions" 
              :key="action.path"
              @click="goToPath(action.path)"
              :type="action.type"
              class="action-button"
              plain
            >
              <el-icon><component :is="action.icon" /></el-icon>
              {{ action.label }}
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 操作日志 -->
    <el-card class="box-card logs-card">
      <template #header>
        <div class="card-header">
          <span>最近操作日志</span>
          <el-button size="small" @click="loadLogs">刷新</el-button>
        </div>
      </template>
      <el-table :data="logs" v-loading="loading" height="300">
        <el-table-column prop="createdAt" label="时间" width="180" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作内容" />
        <el-table-column prop="ip" label="IP地址" width="120" />
      </el-table>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialog.visible"
      title="修改密码"
      width="400px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordDialog.form"
        :rules="passwordDialog.rules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordDialog.form.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordDialog.form.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordDialog.form.confirmPassword"
            type="password"
            placeholder="请确认新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handlePasswordSubmit" :loading="passwordDialog.loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getOperationLogs } from '@/stores/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const logs = ref<any[]>([])
const loading = ref(false)

// 角色文本
const roleText = computed(() => {
  const roleMap = {
    admin: '管理员',
    teacher: '教师',
    student: '学生'
  }
  return roleMap[authStore.user?.role || 'student']
})

// 快捷操作
const quickActions = computed(() => {
  const actions: any[] = []
  
  if (authStore.isStudent) {
    actions.push(
      { label: '成绩查询', path: '/main/grades/query', icon: 'Search', type: 'primary' },
      { label: '统计概览', path: '/main/statistics/overview', icon: 'DataAnalysis', type: 'success' }
    )
  } else if (authStore.isTeacher) {
    actions.push(
      { label: '成绩录入', path: '/main/grades/input', icon: 'EditPen', type: 'primary' },
      { label: '成绩查询', path: '/main/grades/query', icon: 'Search', type: 'success' },
      { label: '统计分析', path: '/main/statistics/overview', icon: 'DataAnalysis', type: 'warning' }
    )
  } else if (authStore.isAdmin) {
    actions.push(
      { label: '学生管理', path: '/main/students', icon: 'UserFilled', type: 'primary' },
      { label: '课程管理', path: '/main/courses', icon: 'Notebook', type: 'success' },
      { label: '用户管理', path: '/main/admin/users', icon: 'Setting', type: 'warning' }
    )
  }
  
  return actions
})

// 密码修改对话框
const passwordDialog = ref({
  visible: false,
  loading: false,
  form: {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  },
  rules: {
    oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认新密码', trigger: 'blur' },
      { 
        validator: (rule: any, value: string, callback: any) => {
          if (value !== passwordDialog.value.form.newPassword) {
            callback(new Error('两次输入的密码不一致'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }
})

const passwordFormRef = ref<FormInstance>()

// 显示密码对话框
const showPasswordDialog = () => {
  passwordDialog.value.visible = true
  passwordDialog.value.form = { oldPassword: '', newPassword: '', confirmPassword: '' }
}

// 提交密码修改
const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordDialog.value.loading = true
      try {
        await authStore.handleChangePassword({
          oldPassword: passwordDialog.value.form.oldPassword,
          newPassword: passwordDialog.value.form.newPassword
        })
        passwordDialog.value.visible = false
      } catch (error) {
        // 错误已在store中处理
      } finally {
        passwordDialog.value.loading = false
      }
    }
  })
}

// 刷新个人信息
const refreshProfile = async () => {
  try {
    await authStore.fetchProfile()
    ElMessage.success('信息已刷新')
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

// 跳转路径
const goToPath = (path: string) => {
  router.push(path)
}

// 加载操作日志
const loadLogs = async () => {
  // 防御：没有用户信息时不发请求
  if (!authStore.isAuthenticated || !authStore.user) return

  loading.value = true
  try {
    const response = await getOperationLogs({ page: 1, limit: 10 })
    logs.value = response.data
  } catch (error) {
    ElMessage.error('加载日志失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  // 只有在已登录并且用户信息存在时才加载日志，避免刷新时产生不必要的请求/错误
  // 添加延迟，避免与页面初始化竞争
  setTimeout(() => {
    if (authStore.isAuthenticated && authStore.user) {
      loadLogs()
    }
  }, 100)
})
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.profile-info {
  padding: 16px 0;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #666;
  width: 100px;
  text-align: right;
  margin-right: 12px;
}

.value {
  color: #333;
  font-size: 14px;
}

.profile-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
  padding: 16px 0;
}

.action-button {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.logs-card {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>