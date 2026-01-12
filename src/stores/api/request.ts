import axios, { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../auth'

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
    
    // 检查token是否需要刷新
    if (authStore.token) {
      await authStore.checkTokenRefresh()
    }
    
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

      // 简化错误提示，避免过多信息
      // 登录失败时只显示简洁的错误信息
      if (status === 401 && config?.url === '/auth/login') {
        authStore.handleLogout()
        ElMessage.error('用户名或密码错误')
      } else if (status === 401) {
        authStore.handleLogout()
        ElMessage.error('登录已过期，请重新登录')
      } else if (status === 400) {
        ElMessage.error(serverMessage || '请求参数错误')
      } else if (status === 403) {
        ElMessage.error(serverMessage || '没有权限访问该资源')
      } else if (status === 404) {
        ElMessage.error(serverMessage || '请求的资源不存在')
      } else if (status === 500) {
        ElMessage.error(serverMessage || '服务器内部错误')
      } else {
        ElMessage.error(serverMessage || '请求失败，请稍后重试')
      }
    } else {
      // 网络错误，显示简洁提示
      ElMessage.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default request