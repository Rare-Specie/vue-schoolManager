import axios, { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../auth'

// 防止短时间内重复弹出相同错误提示（去抖/限频）
const _messageThrottle = new Map<string, number>()
const showMessageOnce = (key: string, text: string, ttl = 2000) => {
  const now = Date.now()
  const last = _messageThrottle.get(key) || 0
  if (now - last > ttl) {
    _messageThrottle.set(key, now)
    ElMessage.error(text)
  }
}

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  async (config) => {
    const authStore = useAuthStore()
    
    // 避免在登录页面添加token
    if (config.url?.includes('/auth/login')) {
      return config
    }
    
    // 检查token是否需要刷新（仅在有token且未初始化时）
    if (authStore.token && !authStore.isInitialized) {
      // 尝试初始化认证状态，但避免循环调用
      try {
        await authStore.init()
      } catch (e) {
        // 初始化失败不影响当前请求
      }
    }
    
    // 检查token是否需要刷新（异步，不阻塞请求）
    if (authStore.token && authStore.isAuthenticated) {
      // 异步检查刷新，不阻塞请求
      authStore.checkTokenRefresh().catch(() => {
        // 刷新失败不影响当前请求，会在下次请求时处理
      })
    }
    
    // 添加token到请求头
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error: AxiosError) => {
    const { response, config } = error
    const authStore = useAuthStore()
    
    if (response) {
      const { status, data } = response as any
      const serverMessage = data && (data.message || data.error) ? (data.message || data.error) : null

      // 简化错误提示，避免过多信息，并使用限频展示以防止短时间内重复弹窗
      // 登录失败时只显示简洁的错误信息
      if (status === 401 && config?.url && config.url.toString().endsWith('/auth/login')) {
        // 登录失败（凭证错误）时，不调用后端 logout（token 不存在），仅清理本地状态以防万一
        authStore.clearAuthState()
        showMessageOnce('auth_login_failed', '用户名或密码错误', 3000)
      } else if (status === 401 && config?.url && config.url.toString().endsWith('/auth/logout')) {
        // 忽略 /auth/logout 的 401 响应，避免在注销流程中触发重复的提示或递归调用
        authStore.clearAuthState()
        // 不显示错误提示
      } else if (status === 401) {
        // 其他场景的 401（例如 token 过期），尝试标准的注销流程
        authStore.handleLogout()
        showMessageOnce('auth_expired', '登录已过期，请重新登录', 5000)
      } else if (status === 400) {
        showMessageOnce('bad_request', serverMessage || '请求参数错误')
      } else if (status === 403) {
        showMessageOnce('forbidden', serverMessage || '没有权限访问该资源')
      } else if (status === 404) {
        showMessageOnce('not_found', serverMessage || '请求的资源不存在')
      } else if (status === 500) {
        showMessageOnce('server_error', serverMessage || '服务器内部错误')
      } else {
        showMessageOnce('request_failed', serverMessage || '请求失败，请稍后重试')
      }
    } else {
      // 网络错误，显示简洁提示（限频）
      showMessageOnce('network_error', '网络错误，请检查网络连接', 5000)
    }
    
    return Promise.reject(error)
  }
)

export default request