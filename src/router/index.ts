import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { tokenManager } from '@/utils/tokenManager'
import { SessionRecovery } from '@/utils/sessionRecovery'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/main',
      name: 'main',
      component: () => import('@/views/MainLayout.vue'),
      meta: { requiresAuth: true },
      redirect: '/main/profile',
      children: [
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue')
        },
        // 学生信息管理
        {
          path: 'students',
          name: 'student-list',
          component: () => import('@/views/students/StudentList.vue')
        },
        {
          path: 'students/:id',
          name: 'student-detail',
          component: () => import('@/views/students/StudentDetail.vue')
        },
        // 课程管理
        {
          path: 'courses',
          name: 'course-list',
          component: () => import('@/views/courses/CourseList.vue')
        },
        {
          path: 'courses/:id',
          name: 'course-detail',
          component: () => import('@/views/courses/CourseDetail.vue')
        },
        // 成绩管理
        {
          path: 'grades/input',
          name: 'grade-input',
          component: () => import('@/views/grades/GradeInput.vue')
        },
        {
          path: 'grades/query',
          name: 'grade-query',
          component: () => import('@/views/grades/GradeQuery.vue')
        },
        // 统计分析
        {
          path: 'statistics/overview',
          name: 'statistics-overview',
          component: () => import('@/views/statistics/StatisticsOverview.vue')
        },
        {
          path: 'statistics/detail',
          name: 'statistics-detail',
          component: () => import('@/views/statistics/DetailedStatistics.vue')
        },
        // 报表与打印
        {
          path: 'reports/report-card',
          name: 'report-card',
          component: () => import('@/views/reports/ReportCard.vue')
        },
        {
          path: 'reports/statistics',
          name: 'statistical-reports',
          component: () => import('@/views/reports/StatisticalReports.vue')
        },
        // 用户管理（管理员）
        {
          path: 'admin/users',
          name: 'user-management',
          component: () => import('@/views/admin/UserManagement.vue')
        },
        // 系统管理（管理员）
        {
          path: 'admin/system',
          name: 'system-management',
          component: () => import('@/views/admin/SystemManagement.vue')
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth
  
  // 如果需要认证
  if (requiresAuth) {
    // 1. 首先检查内存中的认证状态
    if (authStore.isAuthenticated) {
      // 已认证但尚未初始化用户信息时，先等待 init 完成，避免进入需要用户信息的页面时出现未定义访问
      if (!authStore.isInitialized) {
        try {
          await authStore.init()
        } catch (e) {
          console.error('初始化用户信息失败:', e)
          // 清理状态并重定向到登录页
          authStore.clearAuthState()
          if (to.path !== '/') ElMessage.warning('请先登录')
          next('/')
          return
        }
      }

      // 已认证，检查是否需要刷新token
      try {
        await authStore.checkTokenRefresh()
      } catch (error) {
        // 刷新失败，继续流程（让后续请求处理错误）
      }
      
      // 已认证但访问登录页，重定向到个人中心
      if (to.path === '/') {
        next('/main/profile')
        return
      }
      
      next()
      return
    }
    
    // 2. 内存中无状态，尝试从localStorage/sessionStorage恢复
    if (!authStore.isInitialized) {
      // 如果已有自动恢复在进行中，先等待其完成
      if (SessionRecovery.isRecoveringNow()) {
        await SessionRecovery.waitForRecovery()
        if (authStore.isAuthenticated) {
          if (to.path === '/') {
            next('/main/profile')
            return
          }
          next()
          return
        }
      }

      // 首先尝试会话恢复
      if (SessionRecovery.needsRecovery()) {
        const recovered = await SessionRecovery.restoreSession()
        if (recovered && authStore.isAuthenticated) {
          if (to.path === '/') {
            next('/main/profile')
            return
          }
          next()
          return
        }
      }
      
      // 会话恢复失败，尝试普通初始化
      try {
        const success = await authStore.init()
        if (success && authStore.isAuthenticated) {
          if (to.path === '/') {
            next('/main/profile')
            return
          }
          next()
          return
        }
      } catch (error) {
        console.error('恢复登录状态失败:', error)
      }
    }
    
    // 3. 恢复失败或无token，跳转到登录页
    if (to.path !== '/') {
      ElMessage.warning('请先登录')
    }
    next('/')
    return
  }
  
  // 不需要认证的页面
  if (to.path === '/' && authStore.isAuthenticated) {
    // 已登录用户访问登录页，重定向到个人中心
    next('/main/profile')
    return
  }
  
  // 访问登录页时，如果已登录则重定向
  if (to.path === '/' && !authStore.isAuthenticated) {
    // 如果自动恢复正在进行中，等待其完成
    if (SessionRecovery.isRecoveringNow()) {
      await SessionRecovery.waitForRecovery()
      if (authStore.isAuthenticated) {
        next('/main/profile')
        return
      }
    }

    // 检查是否有token可以恢复
    if (tokenManager.getToken() && !authStore.isInitialized) {
      // 有token但未初始化，尝试恢复
      try {
        const success = await authStore.init()
        if (success) {
          next('/main/profile')
          return
        }
      } catch (error) {
        // 恢复失败，显示登录页
      }
    }
  }
  
  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  ElMessage.error('页面加载失败，请刷新重试')
})

export default router
