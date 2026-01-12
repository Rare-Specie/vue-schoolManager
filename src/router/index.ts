import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
    // 检查是否已认证
    if (!authStore.isAuthenticated) {
      // 尝试从localStorage恢复状态
      if (authStore.token) {
        // 有token但状态未初始化，尝试初始化
        try {
          await authStore.init()
          // 初始化后再次检查
          if (authStore.isAuthenticated) {
            next()
            return
          }
        } catch (error) {
          // 初始化失败，清除状态并跳转到登录页
          authStore.clearAuthState()
          ElMessage.warning('登录已过期，请重新登录')
          next('/')
          return
        }
      }
      // 未认证，跳转到登录页
      next('/')
      return
    }
    
    // 已认证但访问登录页，重定向到主页
    if (to.path === '/') {
      next('/main')
      return
    }
    
    // 已认证且访问需要认证的页面，验证权限
    next()
    return
  }
  
  // 不需要认证的页面
  if (to.path === '/' && authStore.isAuthenticated) {
    // 已登录用户访问登录页，重定向到主页
    next('/main')
    return
  }
  
  next()
})

export default router
