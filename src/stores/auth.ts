import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { login, logout, getProfile, updatePassword, type LoginRequest, type UserProfile, type UpdatePasswordRequest } from './api/auth'
import { ElMessage } from 'element-plus'
import { tokenManager } from '@/utils/tokenManager'
import { SessionRecovery } from '@/utils/sessionRecovery'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(tokenManager.getToken())
  const user = ref<UserProfile | null>(null)
  const loading = ref(false)
  const isInitialized = ref(false)
  const lastRefreshTime = ref<number>(0)

  const isAuthenticated = computed(() => {
    // 使用Token管理器验证
    return tokenManager.isValid() && !!token.value
  })
  
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isStudent = computed(() => user.value?.role === 'student')

  // 清除认证状态
  const clearAuthState = () => {
    // 避免重复清理
    if (!token.value && !user.value && !isInitialized.value) {
      return
    }
    
    token.value = ''
    user.value = null
    isInitialized.value = false
    lastRefreshTime.value = 0
    
    // 清理token管理器
    tokenManager.clear()
    
    // 清理sessionStorage中的会话数据
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.removeItem('app_session')
      } catch (e) {
        // ignore
      }
    }
  }

  // 从localStorage恢复用户信息
  const restoreUserInfo = () => {
    const userInfo = tokenManager.getUserInfo()
    if (userInfo && !user.value) {
      user.value = userInfo
    }
  }

  // 初始化 - 页面加载时恢复状态
  let isInitializing = false // 防重入标志
  
  const init = async (force = false) => {
    // 防止重复初始化
    if (isInitializing) {
      console.log('初始化正在进行中，跳过重复调用')
      return false
    }
    
    // 如果已经初始化且不是强制刷新，直接返回
    if (isInitialized.value && !force) {
      return true
    }

    isInitializing = true
    
    try {
      // 检查token是否有效
      if (tokenManager.isValid()) {
        try {
          // 先尝试从localStorage恢复用户信息
          restoreUserInfo()
          
          // 验证token有效性（调用后端）
          const profile = await getProfile()
          user.value = profile
          token.value = tokenManager.getToken()
          
          // 保存用户信息到localStorage
          tokenManager.saveUserInfo(profile)
          
          isInitialized.value = true
          return true
        } catch (error) {
          console.error('初始化失败:', error)
          clearAuthState()
          return false
        }
      } else {
        // token无效，清除状态
        clearAuthState()
        return false
      }
    } finally {
      isInitializing = false
    }
  }

  // 登录
  const handleLogin = async (data: LoginRequest) => {
    loading.value = true
    try {
      // 密码明文传输，无需加密
      const response = await login(data)
      token.value = response.token
      user.value = response.user
      
      // 使用Token管理器保存token（默认24小时过期）
      tokenManager.setToken(response.token, 24 * 60 * 60 * 1000)
      
      // 保存用户信息到localStorage
      tokenManager.saveUserInfo(response.user)
      
      isInitialized.value = true
      lastRefreshTime.value = Date.now()
      
      ElMessage.success('登录成功')
      return response
    } catch (error) {
      // 错误提示已在request.ts中处理，这里只抛出错误
      throw error
    } finally {
      loading.value = false
    }
  }

  // 登出
  // 若无有效 token，则跳过调用后端 logout 接口，避免在未登录场景触发额外 401 导致循环调用
  const handleLogout = async (skipServer: boolean = false) => {
    try {
      // 只有在显式要求并且存在 token 时才调用后端注销接口
      if (!skipServer && token.value) {
        await logout()
      }
    } catch (error) {
      // 忽略错误
    } finally {
      clearAuthState()
      ElMessage.success('已安全退出')
    }
  }

  // 获取用户信息
  const fetchProfile = async () => {
    try {
      const profile = await getProfile()
      user.value = profile
      // 更新localStorage
      tokenManager.saveUserInfo(profile)
      return profile
    } catch (error) {
      ElMessage.error('获取用户信息失败')
      throw error
    }
  }

  // 修改密码
  const handleChangePassword = async (data: UpdatePasswordRequest) => {
    try {
      // 密码明文传输，无需加密
      await updatePassword(data)
      ElMessage.success('密码修改成功')
      return true
    } catch (error) {
      ElMessage.error('密码修改失败')
      throw error
    }
  }

  // 手动验证token有效性
  const validateToken = async () => {
    // 使用Token管理器验证
    const isValid = await tokenManager.validate()
    if (!isValid) {
      clearAuthState()
      return false
    }
    
    // 如果token有效但用户信息为空，获取用户信息
    if (!user.value && token.value) {
      try {
        const profile = await getProfile()
        user.value = profile
        tokenManager.saveUserInfo(profile)
      } catch (error) {
        clearAuthState()
        return false
      }
    }
    
    return true
  }

  // 检查token是否需要刷新
  const checkTokenRefresh = async () => {
    if (tokenManager.needsRefresh() && tokenManager.isValid()) {
      try {
        // 防止频繁刷新（至少间隔1分钟）
        const now = Date.now()
        if (now - lastRefreshTime.value < 60 * 1000) {
          return true
        }
        
        // 尝试自动刷新token
        const currentToken = tokenManager.getToken()
        tokenManager.setToken(currentToken, 24 * 60 * 60 * 1000)
        lastRefreshTime.value = now
        return true
      } catch (error) {
        ElMessage.warning('登录即将过期，请重新登录')
        return false
      }
    }
    return true
  }

  // 页面激活时检查token
  const handlePageVisibility = async () => {
    if (document.visibilityState === 'visible') {
      // 如果会话恢复正在进行中，跳过此检查以避免竞态
      if (SessionRecovery.isRecoveringNow()) return

      // 避免在登录页面检查
      if (typeof window !== 'undefined' && window.location.pathname === '/') return

      // 避免频繁检查，添加时间间隔
      const now = Date.now()
      if (!handlePageVisibility.lastCheck || now - handlePageVisibility.lastCheck > 30000) {
        handlePageVisibility.lastCheck = now
        
        // 页面变为可见时检查token
        if (token.value && !tokenManager.isValid()) {
          // Token已过期
          clearAuthState()
          if (window.location.pathname !== '/') {
            ElMessage.warning('登录已过期，请重新登录')
            // 使用路由导航进行跳转，若失败再降级到 location.replace
            try {
              const router = (await import('@/router')).default
              // 避免重复跳转
              if (window.location.pathname !== '/') {
                router.replace('/')
              }
            } catch (e) {
              window.location.replace('/')
            }
          }
          return
        }
        
        // Token即将过期，尝试刷新
        if (tokenManager.needsRefresh() && tokenManager.isValid()) {
          await checkTokenRefresh()
        }
        
        // 定期刷新用户信息（每5分钟）
        if (now - lastRefreshTime.value > 5 * 60 * 1000 && isAuthenticated.value) {
          try {
            await fetchProfile()
            lastRefreshTime.value = now
          } catch (error) {
            // 忽略错误，不影响用户体验
          }
        }
      }
    }
  }
  // 静态属性记录上次检查时间
  handlePageVisibility.lastCheck = 0

  // 页面卸载时清理
  const handleBeforeUnload = () => {
    // 清理定时器（通过clear方法会自动清理）
    // 这里不需要直接访问refreshTimer
  }

  // 监听页面事件
  const setupEventListeners = () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', handlePageVisibility)
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('focus', handlePageVisibility)
    }
  }

  // 移除事件监听
  const removeEventListeners = () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('visibilitychange', handlePageVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('focus', handlePageVisibility)
    }
  }

  // 自动初始化（在store创建时）
  const autoInit = async () => {
    // 延迟初始化，确保其他依赖已加载
    setTimeout(async () => {
      if (tokenManager.isValid() && !isInitialized.value) {
        await init()
      }
    }, 100)
  }

  // 页面加载时自动执行
  if (typeof window !== 'undefined') {
    autoInit()
    setupEventListeners()
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    isInitialized,
    lastRefreshTime,
    init,
    handleLogin,
    handleLogout,
    fetchProfile,
    handleChangePassword,
    validateToken,
    clearAuthState,
    checkTokenRefresh,
    setupEventListeners,
    removeEventListeners
  }
})