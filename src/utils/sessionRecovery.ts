/**
 * 会话恢复工具
 * 处理页面刷新、浏览器重启后的登录状态恢复
 */

import { useAuthStore } from '@/stores/auth'
import { tokenManager } from '@/utils/tokenManager'
import { ElMessage } from 'element-plus'

export class SessionRecovery {
  private static readonly STORAGE_KEY = 'app_session'
  private static readonly MAX_RECOVERY_ATTEMPTS = 3
  private static isRecovering = false

  // 保存当前会话状态
  static saveSession() {
    try {
      const authStore = useAuthStore()
      const sessionData = {
        timestamp: Date.now(),
        token: tokenManager.getToken(),
        user: authStore.user,
        path: window.location.pathname,
        isInitialized: authStore.isInitialized
      }
      
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData))
    } catch (error) {
      console.error('保存会话失败:', error)
    }
  }

  // 恢复会话状态
  static async restoreSession(): Promise<boolean> {
    // 避免并发恢复
    if (this.isRecovering) {
      // 等待之前的恢复完成
      const waited = await this.waitForRecovery()
      return waited
    }

    this.isRecovering = true
    try {
      const sessionData = sessionStorage.getItem(this.STORAGE_KEY)
      if (!sessionData) {
        return false
      }

      const { timestamp, token, user, path, isInitialized } = JSON.parse(sessionData)
      
      // 检查会话是否过期（1小时内有效）
      const now = Date.now()
      if (now - timestamp > 60 * 60 * 1000) {
        this.clearSession()
        return false
      }

      // 验证数据完整性
      if (!token || typeof token !== 'string') {
        this.clearSession()
        return false
      }

      // 如果有token但store未初始化，尝试恢复
      if (token && !isInitialized) {
        const authStore = useAuthStore()
        
        // 防止在已经初始化的情况下重复恢复
        if (authStore.isInitialized) {
          return true
        }
        
        // 恢复token到manager
        if (tokenManager.getToken() !== token) {
          tokenManager.setToken(token, 24 * 60 * 60 * 1000)
        }
        
        // 恢复用户信息
        if (user) {
          authStore.user = user
          tokenManager.saveUserInfo(user)
        }
        
        // 验证token有效性 - 添加超时
        try {
          const initPromise = authStore.init()
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('恢复超时')), 5000)
          )
          
          const success = await Promise.race([initPromise, timeoutPromise])
          if (success) {
            // 会话恢复成功
            return true
          }
        } catch (error) {
          console.error('会话恢复验证失败:', error)
          this.clearSession() // 恢复失败，清除脏数据
        }
      }

      return false
    } catch (error) {
      console.error('恢复会话失败:', error)
      this.clearSession() // 出错时清除会话数据
      return false
    } finally {
      this.isRecovering = false
    }
  }

  // 等待恢复完成（最多等待timeout毫秒）
  static async waitForRecovery(timeout: number = 5000): Promise<boolean> {
    const start = Date.now()
    while (this.isRecovering) {
      if (Date.now() - start > timeout) {
        return false
      }
      await new Promise((r) => setTimeout(r, 100))
    }
    return true
  }

  // 清除会话数据
  static clearSession() {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY)
    } catch (error) {
      console.error('清除会话失败:', error)
    }
  }

  // 检查是否需要恢复
  static needsRecovery(): boolean {
    const authStore = useAuthStore()
    
    // 如果当前未初始化但有token，需要恢复
    if (!authStore.isInitialized && tokenManager.getToken()) {
      return true
    }
    
    // 如果token有效但用户信息为空，需要恢复
    if (tokenManager.isValid() && !authStore.user) {
      return true
    }
    
    return false
  }

  // 当前是否正在恢复
  static isRecoveringNow(): boolean {
    return this.isRecovering
  }

  // 自动恢复（在应用启动时调用）
  static async autoRecover(): Promise<boolean> {
    // 防止在路由守卫已经处理的情况下重复恢复
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    
    // 如果已经认证，不需要恢复
    if (authStore.isAuthenticated) {
      return false
    }
    
    // 如果已经初始化，不需要恢复
    if (authStore.isInitialized) {
      return false
    }
    
    if (!this.needsRecovery()) {
      return false
    }

    // 检测到需要恢复的会话状态，开始恢复流程
    
    // 显示恢复提示
    ElMessage.info('正在恢复登录状态...')
    
    const success = await this.restoreSession()
    
    if (success) {
      ElMessage.success('登录状态已恢复')
    } else {
      ElMessage.warning('登录状态恢复失败，请重新登录')
    }
    
    return success
  }
}

// 页面加载时的自动恢复 - 防止与路由守卫冲突
if (typeof window !== 'undefined') {
  // 避免重复添加监听器
  const win = window as any
  if (!win.__sessionRecoveryInitialized) {
    // 页面加载完成后的恢复逻辑 - 仅在路由守卫未处理时执行
    window.addEventListener('load', async () => {
      // 延迟执行，确保其他初始化完成
      setTimeout(async () => {
        // 检查当前路径，避免在路由守卫已经处理的情况下重复恢复
        const currentPath = window.location.pathname
        if (currentPath === '/' || currentPath === '') {
          // 只在登录页面或根路径尝试自动恢复
          await SessionRecovery.autoRecover()
        }
      }, 500)
    })

    // 页面卸载前保存状态
    window.addEventListener('beforeunload', () => {
      SessionRecovery.saveSession()
    })

    // 页面可见性变化时保存状态
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        SessionRecovery.saveSession()
      }
    })
    
    win.__sessionRecoveryInitialized = true
  }
}

// 定期保存会话
let sessionSaveTimer: ReturnType<typeof setInterval> | null = null
export const startSessionAutoSave = () => {
  if (sessionSaveTimer) {
    clearInterval(sessionSaveTimer)
  }
  
  sessionSaveTimer = setInterval(() => {
    SessionRecovery.saveSession()
  }, 60 * 1000) // 每分钟保存一次
}

// 页面卸载时清理定时器
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (sessionSaveTimer) {
      clearInterval(sessionSaveTimer)
      sessionSaveTimer = null
    }
  })
}