<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="aside">
      <div class="logo">
        <h3 v-if="!isCollapse">成绩管理</h3>
        <span v-else>成</span>
      </div>
      <el-menu
        :default-active="$route.path"
        :collapse="isCollapse"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        class="menu"
      >
        <!-- 学生菜单 -->
        <template v-if="authStore.isStudent">
          <el-menu-item index="/main/profile">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
          <el-menu-item index="/main/grades/query">
            <el-icon><Search /></el-icon>
            <span>成绩查询</span>
          </el-menu-item>
          <el-menu-item index="/main/statistics/overview">
            <el-icon><DataAnalysis /></el-icon>
            <span>统计概览</span>
          </el-menu-item>
        </template>

        <!-- 教师菜单 -->
        <template v-if="authStore.isTeacher">
          <el-menu-item index="/main/profile">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
          <el-sub-menu index="grade-manage">
            <template #title>
              <el-icon><EditPen /></el-icon>
              <span>成绩管理</span>
            </template>
            <el-menu-item index="/main/grades/input">成绩录入</el-menu-item>
            <el-menu-item index="/main/grades/query">成绩查询</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="statistics">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>统计分析</span>
            </template>
            <el-menu-item index="/main/statistics/overview">统计概览</el-menu-item>
            <el-menu-item index="/main/statistics/detail">详细统计</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="reports">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>报表管理</span>
            </template>
            <el-menu-item index="/main/reports/report-card">成绩单</el-menu-item>
            <el-menu-item index="/main/reports/statistics">统计报表</el-menu-item>
          </el-sub-menu>
        </template>

        <!-- 管理员菜单 -->
        <template v-if="authStore.isAdmin">
          <el-menu-item index="/main/profile">
            <el-icon><User /></el-icon>
            <span>个人中心</span>
          </el-menu-item>
          
          <el-sub-menu index="student-manage">
            <template #title>
              <el-icon><UserFilled /></el-icon>
              <span>学生管理</span>
            </template>
            <el-menu-item index="/main/students">学生列表</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="course-manage">
            <template #title>
              <el-icon><Notebook /></el-icon>
              <span>课程管理</span>
            </template>
            <el-menu-item index="/main/courses">课程列表</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="grade-manage">
            <template #title>
              <el-icon><EditPen /></el-icon>
              <span>成绩管理</span>
            </template>
            <el-menu-item index="/main/grades/input">成绩录入</el-menu-item>
            <el-menu-item index="/main/grades/query">成绩查询</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="statistics">
            <template #title>
              <el-icon><DataAnalysis /></el-icon>
              <span>统计分析</span>
            </template>
            <el-menu-item index="/main/statistics/overview">统计概览</el-menu-item>
            <el-menu-item index="/main/statistics/detail">详细统计</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="reports">
            <template #title>
              <el-icon><Document /></el-icon>
              <span>报表管理</span>
            </template>
            <el-menu-item index="/main/reports/report-card">成绩单</el-menu-item>
            <el-menu-item index="/main/reports/statistics">统计报表</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/main/admin/users">用户管理</el-menu-item>
            <el-menu-item index="/main/admin/system">系统管理</el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-button @click="toggleCollapse" circle>
            <el-icon><Menu /></el-icon>
          </el-button>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta?.title || item.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <!-- 登录状态提示 -->
          <div v-if="showStatusTip" class="status-warning" @click="handleManualRefresh">
            <el-tooltip content="点击刷新登录状态" placement="bottom">
              <span class="warning-text">
                <el-icon><Warning /></el-icon>
                <span>登录状态即将过期 ({{ tokenStatus.remainingTime }}分钟)</span>
                <el-button type="text" :icon="Refresh" class="refresh-btn">刷新</el-button>
              </span>
            </el-tooltip>
          </div>

          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="User" />
              <span class="username">{{ authStore.user?.name }}</span>
              <span class="role">({{ roleText }})</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="logs">操作日志</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主要内容区域 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>

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

  <!-- 操作日志对话框 -->
  <el-dialog
    v-model="logsDialog.visible"
    title="操作日志"
    width="800px"
  >
    <el-table :data="logsDialog.logs" v-loading="logsDialog.loading" height="400">
      <el-table-column prop="createdAt" label="时间" width="180" />
      <el-table-column prop="username" label="用户" width="120" />
      <el-table-column prop="module" label="模块" width="120" />
      <el-table-column prop="action" label="操作" />
      <el-table-column prop="ip" label="IP地址" width="120" />
    </el-table>
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="logsDialog.page"
        v-model:page-size="logsDialog.limit"
        :total="logsDialog.total"
        @current-change="loadLogs"
        layout="total, prev, pager, next"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getOperationLogs } from '@/stores/api/auth'
import { tokenManager } from '@/utils/tokenManager'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { User, Refresh, Warning, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCollapse = ref(false)

// 登录状态监控
const tokenStatus = ref({
  remainingTime: 0,
  needsRefresh: false,
  isValid: false
})

// 更新token状态显示
const updateTokenStatus = () => {
  if (authStore.isAuthenticated) {
    const remainingTime = Math.floor(tokenManager.getRemainingTime() / 1000 / 60)
    tokenStatus.value = {
      remainingTime,
      needsRefresh: tokenManager.needsRefresh(),
      isValid: tokenManager.isValid()
    }
  } else {
    tokenStatus.value = {
      remainingTime: 0,
      needsRefresh: false,
      isValid: false
    }
  }
}

// 手动刷新token
const handleManualRefresh = async () => {
  try {
    const success = await tokenManager.manualRefresh()
    if (success) {
      ElMessage.success('登录状态已刷新')
      updateTokenStatus()
    } else {
      ElMessage.warning('刷新失败，请重新登录')
      router.push('/')
    }
  } catch (error) {
    ElMessage.error('刷新失败')
  }
}

// 显示登录状态提示
const showStatusTip = computed(() => {
  return tokenStatus.value.needsRefresh && tokenStatus.value.isValid
})

// 定期更新状态
let statusTimer: ReturnType<typeof setInterval> | null = null

// 面包屑
const breadcrumbs = computed(() => {
  return route.matched.filter(item => item.meta?.title || item.name)
})

// 角色文本
const roleText = computed(() => {
  const roleMap = {
    admin: '管理员',
    teacher: '教师',
    student: '学生'
  }
  return roleMap[authStore.user?.role || 'student']
})

// 切换侧边栏
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

// 下拉菜单处理
const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/main/profile')
      break
    case 'password':
      passwordDialog.value.visible = true
      break
    case 'logs':
      logsDialog.value.visible = true
      loadLogs()
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning'
    })
    await authStore.handleLogout()
    router.push('/')
  } catch (cancel) {
    // 用户取消
  }
}

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
        passwordDialog.value.form = { oldPassword: '', newPassword: '', confirmPassword: '' }
      } catch (error) {
        // 错误已在store中处理
      } finally {
        passwordDialog.value.loading = false
      }
    }
  })
}

// 操作日志对话框
const logsDialog = ref({
  visible: false,
  loading: false,
  logs: [] as any[],
  page: 1,
  limit: 10,
  total: 0
})

const loadLogs = async () => {
  logsDialog.value.loading = true
  try {
    const response = await getOperationLogs({
      page: logsDialog.value.page,
      limit: logsDialog.value.limit
    })
    logsDialog.value.logs = response.data
    logsDialog.value.total = response.total
  } catch (error) {
    ElMessage.error('加载日志失败')
  } finally {
    logsDialog.value.loading = false
  }
}

// 监听路由变化，自动关闭对话框
watch(() => route.path, () => {
  passwordDialog.value.visible = false
  logsDialog.value.visible = false
})

// 页面可见性变化时验证token
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    // 页面重新可见时，验证token有效性
    const isValid = await authStore.validateToken()
    if (!isValid) {
      ElMessage.warning('登录已过期，请重新登录')
      router.push('/')
    }
  }
}

// 页面挂载时初始化状态监控
onMounted(() => {
  // 初始状态更新
  updateTokenStatus()
  
  // 每30秒更新一次状态
  statusTimer = setInterval(updateTokenStatus, 30 * 1000)
  
  // 页面可见性变化时验证token
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
})

// 组件卸载时移除监听
onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer)
    statusTimer = null
  }
  
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.aside {
  background-color: #304156;
  overflow: hidden;
  transition: width 0.3s;
  height: 100%;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  border-bottom: 1px solid #2c3e50;
}

.menu {
  border-right: none;
  height: calc(100% - 60px);
  overflow-y: auto;
  overflow-x: hidden;
}

.menu:not(.el-menu--collapse) {
  width: 200px;
}

.header {
  background-color: white;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  overflow: hidden;
}

.breadcrumb {
  margin-left: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 12px;
}

.status-warning {
  background: #fef6ec;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-warning:hover {
  background: #fdf2f0;
  border-color: #f56c6c;
}

.warning-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f56c6c;
  font-size: 12px;
  font-weight: 500;
}

.refresh-btn {
  color: #f56c6c !important;
  font-size: 12px !important;
  padding: 0 4px !important;
  margin-left: 4px;
}

.refresh-btn:hover {
  color: #f56c6c !important;
  background: transparent !important;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.role {
  color: #666;
  font-size: 12px;
  white-space: nowrap;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  height: calc(100vh - 60px);
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 响应式处理 */
@media screen and (max-width: 768px) {
  .main-layout {
    position: relative;
  }
  
  .header {
    padding: 0 10px;
  }
  
  .breadcrumb {
    margin-left: 8px;
    font-size: 12px;
  }
  
  .main-content {
    padding: 10px;
  }
}
</style>