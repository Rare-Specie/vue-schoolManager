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
          component: () => import('@/views/ProfileView.vue'),
          meta: { title: '个人中心' }
        },
        // 学生信息管理
        {
          path: 'students',
          name: 'student-list',
          component: () => import('@/views/students/StudentList.vue'),
          meta: { title: '学生列表' }
        },
        {
          path: 'students/enrollment',
          name: 'student-enrollment',
          component: () => import('@/views/students/EnrollmentManagement.vue'),
          meta: { title: '选课管理' }
        },
        {
          path: 'students/:id',
          name: 'student-detail',
          component: () => import('@/views/students/StudentDetail.vue'),
          meta: { title: '学生详情' }
        },
        // 课程管理
        {
          path: 'courses',
          name: 'course-list',
          component: () => import('@/views/courses/CourseList.vue'),
          meta: { title: '课程列表' }
        },
        {
          path: 'courses/:id',
          name: 'course-detail',
          component: () => import('@/views/courses/CourseDetail.vue'),
          meta: { title: '课程详情' }
        },
        // 成绩管理
        {
          path: 'grades/input',
          name: 'grade-input',
          component: () => import('@/views/grades/GradeInput.vue'),
          meta: { title: '成绩录入' }
        },
        {
          path: 'grades/query',
          name: 'grade-query',
          component: () => import('@/views/grades/GradeQuery.vue'),
          meta: { title: '成绩查询' }
        },
        // 统计分析
        {
          path: 'statistics/overview',
          name: 'statistics-overview',
          component: () => import('@/views/statistics/StatisticsOverview.vue'),
          meta: { title: '统计概览' }
        },
        {
          path: 'statistics/detail',
          name: 'statistics-detail',
          component: () => import('@/views/statistics/DetailedStatistics.vue'),
          meta: { title: '详细统计' }
        },
        // 报表与打印
        {
          path: 'reports/report-card',
          name: 'report-card',
          component: () => import('@/views/reports/ReportCard.vue'),
          meta: { title: '成绩单' }
        },
        {
          path: 'reports/statistics',
          name: 'statistical-reports',
          component: () => import('@/views/reports/StatisticalReports.vue'),
          meta: { title: '统计报表' }
        },
        // 用户管理（管理员）
        {
          path: 'admin/users',
          name: 'user-management',
          component: () => import('@/views/admin/UserManagement.vue'),
          meta: { title: '用户管理' }
        },
        // 系统管理（管理员）
        {
          path: 'admin/system',
          name: 'system-management',
          component: () => import('@/views/admin/SystemManagement.vue'),
          meta: { title: '系统管理' }
        }
      ]
    }
  ]
})

// 路由守卫 - 防止死循环的标志
let isRouteGuardRunning = false

router.beforeEach(async (to, from, next) => {
  // 防止路由守卫递归调用
  if (isRouteGuardRunning) {
    next()
    return
  }
  
  isRouteGuardRunning = true
  
  try {
    const authStore = useAuthStore()
    const requiresAuth = to.meta.requiresAuth
    
    // 如果需要认证
    if (requiresAuth) {
      // 1. 首先检查内存中的认证状态
      if (authStore.isAuthenticated) {
        // 已认证但尚未初始化用户信息时，先等待 init 完成
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

        // 已认证，检查是否需要刷新token（异步，不阻塞路由）
        authStore.checkTokenRefresh().catch(() => {
          // 刷新失败，不影响当前路由
        })
        
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
        // 如果已有自动恢复在进行中，先等待其完成（最多等待2秒）
        if (SessionRecovery.isRecoveringNow()) {
          const recovered = await SessionRecovery.waitForRecovery(2000)
          if (recovered && authStore.isAuthenticated) {
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
      // 如果自动恢复正在进行中，等待其完成（最多等待2秒）
      if (SessionRecovery.isRecoveringNow()) {
        const recovered = await SessionRecovery.waitForRecovery(2000)
        if (recovered && authStore.isAuthenticated) {
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
  } finally {
    // 确保在任何情况下都释放锁
    setTimeout(() => {
      isRouteGuardRunning = false
    }, 100)
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  ElMessage.error('页面加载失败，请刷新重试')
})

export default router
