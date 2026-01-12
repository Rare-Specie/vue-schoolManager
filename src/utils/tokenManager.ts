/**
 * Token管理器
 * 负责token的存储、验证、刷新和过期管理
 */

import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Token存储键名
const TOKEN_KEY = 'token'
const TOKEN_EXPIRY_KEY = 'token_expiry'
const TOKEN_REFRESH_KEY = 'token_refresh'

export interface TokenInfo {
  token: string
  expiry: string
  refreshToken?: string
}

export class TokenManager {
  private token = ref<string>('')
  private expiry = ref<string>('')
  private refreshTimer: ReturnType<typeof setTimeout> | null = null

  constructor() {
    this.loadFromStorage()
  }

  // 从localStorage加载token
  private loadFromStorage() {
    const token = localStorage.getItem(TOKEN_KEY)
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    
    if (token && expiry) {
      this.token.value = token
      this.expiry.value = expiry
    }
  }

  // 保存token到localStorage
  private saveToStorage(token: string, expiry: string, refreshToken?: string) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry)
    if (refreshToken) {
      localStorage.setItem(TOKEN_REFRESH_KEY, refreshToken)
    }
  }

  // 清除token
  clear() {
    this.token.value = ''
    this.expiry.value = ''
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    localStorage.removeItem(TOKEN_REFRESH_KEY)
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
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
  needsRefresh(threshold: number = 30 * 60 * 1000): boolean {
    return this.getRemainingTime() < threshold
  }

  // 安排自动刷新
  private scheduleRefresh(expiresIn: number) {
    // 清除现有定时器
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    // 计算刷新时间：在过期前5分钟刷新
    const refreshTime = expiresIn - 5 * 60 * 1000
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.performRefresh()
      }, refreshTime)
    }
  }

  // 执行刷新
  private async performRefresh() {
    try {
      const authStore = useAuthStore()
      
      // 如果token即将过期，尝试刷新
      if (this.needsRefresh() && this.isValid()) {
        // 这里可以调用后端的token刷新接口
        // 暂时保持当前token，延长过期时间
        const currentToken = this.token.value
        this.setToken(currentToken, 24 * 60 * 60 * 1000)
        
        console.log('Token已自动刷新')
      }
    } catch (error) {
      console.error('Token刷新失败:', error)
      // 刷新失败，清除token
      this.clear()
    }
  }

  // 验证token有效性（可选：调用后端验证）
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
}

// 创建单例实例
export const tokenManager = new TokenManager()