/**
 * Token管理器
 * 负责token的存储、验证、刷新和过期管理
 */

import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

// Token存储键名
const TOKEN_KEY = 'token'
const TOKEN_EXPIRY_KEY = 'token_expiry'
const TOKEN_REFRESH_KEY = 'token_refresh'
const USER_INFO_KEY = 'user_info'

export interface TokenInfo {
  token: string
  expiry: string
  refreshToken?: string
}

export class TokenManager {
  private token = ref<string>('')
  private expiry = ref<string>('')
  private refreshTimer: ReturnType<typeof setTimeout> | null = null
  private checkTimer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.loadFromStorage()
    this.startPeriodicCheck()
  }

  // 从localStorage加载token
  private loadFromStorage() {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
      
      if (token && expiry) {
        this.token.value = token
        this.expiry.value = expiry
        
        // 如果token有效，重新安排刷新
        if (this.isValid()) {
          const remainingTime = this.getRemainingTime()
          this.scheduleRefresh(remainingTime)
        }
      }
    } catch (error) {
      console.error('加载token失败:', error)
    }
  }

  // 保存token到localStorage
  private saveToStorage(token: string, expiry: string, refreshToken?: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiry)
      if (refreshToken) {
        localStorage.setItem(TOKEN_REFRESH_KEY, refreshToken)
      }
    } catch (error) {
      console.error('保存token失败:', error)
    }
  }

  // 保存用户信息到localStorage
  saveUserInfo(userInfo: any) {
    try {
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
    } catch (error) {
      console.error('保存用户信息失败:', error)
    }
  }

  // 从localStorage获取用户信息
  getUserInfo(): any {
    try {
      const userInfo = localStorage.getItem(USER_INFO_KEY)
      return userInfo ? JSON.parse(userInfo) : null
    } catch (error) {
      console.error('读取用户信息失败:', error)
      return null
    }
  }

  // 清除token
  clear() {
    this.token.value = ''
    this.expiry.value = ''
    
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_KEY)
      localStorage.removeItem(TOKEN_REFRESH_KEY)
      localStorage.removeItem(USER_INFO_KEY)
    } catch (error) {
      console.error('清除token失败:', error)
    }
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
  }

  // 设置token
  setToken(token: string, expiresIn: number = 24 * 60 * 60 * 1000, refreshToken?: string) {
    const expiry = new Date(Date.now() + expiresIn).toISOString()
    this.token.value = token
    this.expiry.value = expiry
    this.saveToStorage(token, expiry, refreshToken)
    
    // 设置自动刷新
    this.scheduleRefresh(expiresIn)
  }

  // 检查token是否有效
  isValid(): boolean {
    if (!this.token.value) return false
    if (!this.expiry.value) return false
    
    const expiryTime = new Date(this.expiry.value).getTime()
    const now = Date.now()
    
    // 如果已过期，清除并返回false
    if (now >= expiryTime) {
      this.clear()
      return false
    }
    
    return true
  }

  // 获取token
  getToken(): string {
    if (!this.isValid()) {
      return ''
    }
    return this.token.value
  }

  // 获取剩余时间（毫秒）
  getRemainingTime(): number {
    if (!this.expiry.value) return 0
    
    const expiryTime = new Date(this.expiry.value).getTime()
    const now = Date.now()
    
    return Math.max(0, expiryTime - now)
  }

  // 是否需要刷新（剩余时间小于阈值）
  needsRefresh(threshold: number = 10 * 60 * 1000): boolean {
    return this.getRemainingTime() < threshold && this.getRemainingTime() > 0
  }

  // 安排自动刷新
  private scheduleRefresh(expiresIn: number) {
    // 清除现有定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    // 计算刷新时间：在过期前5分钟刷新，但至少在1分钟后
    const refreshTime = Math.max(60 * 1000, expiresIn - 5 * 60 * 1000)
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.performRefresh()
      }, refreshTime)
    }
  }

  // 启动周期性检查
  private startPeriodicCheck() {
    // 每30秒检查一次token状态
    this.checkTimer = setInterval(() => {
      if (this.token.value && !this.isValid()) {
        // Token已过期，触发清理
        const authStore = useAuthStore()
        if (authStore.isAuthenticated) {
          authStore.clearAuthState()
          // 显示提示
          if (window.location.pathname !== '/') {
            ElMessage.warning('登录已过期，请重新登录')
            window.location.href = '/'
          }
        }
      } else if (this.needsRefresh() && this.isValid()) {
        // Token即将过期，尝试刷新
        this.performRefresh()
      }
    }, 30 * 1000)
  }

  // 执行刷新
  private async performRefresh() {
    try {
      // 如果token即将过期，尝试刷新
      if (this.needsRefresh() && this.isValid()) {
        // 延长过期时间（模拟刷新）
        const currentToken = this.token.value
        const remainingTime = this.getRemainingTime()
        
        // 如果剩余时间很少，延长到24小时
        if (remainingTime < 10 * 60 * 1000) {
          this.setToken(currentToken, 24 * 60 * 60 * 1000)
          console.log('Token已自动刷新，延长24小时')
        }
      }
    } catch (error) {
      console.error('Token刷新失败:', error)
      // 刷新失败，不清除token，让下次检查处理
    }
  }

  // 验证token有效性（调用后端验证）
  async validate(): Promise<boolean> {
    if (!this.isValid()) {
      return false
    }

    try {
      const authStore = useAuthStore()
      // 调用后端验证接口
      await authStore.validateToken()
      return true
    } catch (error) {
      this.clear()
      return false
    }
  }

  // 手动刷新token（用于页面激活时）
  async manualRefresh(): Promise<boolean> {
    if (!this.isValid()) {
      return false
    }

    try {
      const authStore = useAuthStore()
      // 验证token有效性
      await authStore.validateToken()
      
      // 如果验证成功，延长过期时间
      const currentToken = this.token.value
      this.setToken(currentToken, 24 * 60 * 60 * 1000)
      
      return true
    } catch (error) {
      this.clear()
      return false
    }
  }
}

// 创建单例实例
export const tokenManager = new TokenManager()