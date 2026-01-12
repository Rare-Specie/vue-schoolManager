/**
 * 登录状态监控工具
 * 提供全局的登录状态监控和自动恢复功能
 */

import { useAuthStore } from '@/stores/auth'
import { tokenManager } from '@/utils/tokenManager'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

// 全局状态监控
export class AuthMonitor {
  private static instance: AuthMonitor
  private checkTimer: ReturnType<typeof setInterval> | null = null
  private isMonitoring = ref(false)

  private constructor() {
    this.startMonitoring()
  }

  static getInstance(): AuthMonitor {
    if (!AuthMonitor.instance) {
      AuthMonitor.instance = new AuthMonitor()
    }
    return AuthMonitor.instance
  }

  // 开始监控
  private startMonitoring() {
    if (this.checkTimer) return

    // 每30秒检查一次登录状态
    this.checkTimer = setInterval(() => {
      this.checkAuthStatus()
    }, 30 * 1000)

    this.isMonitoring.value = true
    console.log('登录状态监控已启动')
  }

  // 停止监控
  stopMonitoring() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
      this.checkTimer = null
    }
    this.isMonitoring.value = false
  }

  // 检查认证状态
  private async checkAuthStatus() {
    const authStore = useAuthStore()
    
    // 如果当前在登录页，不检查
    if (window.location.pathname === '/') return

    // 检查token是否有效
    if (!tokenManager.isValid()) {
      if (authStore.isAuthenticated) {
        // Token已过期但store状态未更新
        authStore.clearAuthState()
        this.showSessionExpired()
      }
      return
    }

    // Token即将过期，尝试自动刷新
    if (tokenManager.needsRefresh()) {
      try {
        await authStore.checkTokenRefresh()
      } catch (error) {
        // 刷新失败，显示提示
        if (authStore.isAuthenticated) {
          this.showRefreshWarning()
        }
      }
    }

    // 定期刷新用户信息（每5分钟）
    if (authStore.isAuthenticated && authStore.user) {
      const lastRefresh = authStore.lastRefreshTime || 0
      const now = Date.now()
      
      if (now - lastRefresh > 5 * 60 * 1000) {
        try {
          await authStore.fetchProfile()
        } catch (error) {
          // 获取用户信息失败不影响主要功能
        }
      }
    }
  }

  // 显示会话过期提示
  private showSessionExpired() {
    if (window.location.pathname !== '/') {
      ElMessage.warning('登录已过期，请重新登录')
      setTimeout(async () => {
        try {
          const router = (await import('@/router')).default
          router.push('/')
        } catch (e) {
          window.location.replace('/')
        }
      }, 1500)
    }
  }

  // 显示刷新警告
  private showRefreshWarning() {
    const remainingTime = Math.floor(tokenManager.getRemainingTime() / 1000 / 60)
    if (remainingTime <= 5) {
      ElMessage.warning(`登录状态即将过期（${remainingTime}分钟），请及时刷新或重新登录`)
    }
  }

  // 手动刷新登录状态
  static async manualRefresh(): Promise<boolean> {
    try {
      const authStore = useAuthStore()
      
      // 验证token有效性
      const isValid = await tokenManager.manualRefresh()
      if (!isValid) {
        return false
      }

      // 刷新用户信息
      await authStore.fetchProfile()
      
      // 更新最后刷新时间
      authStore.lastRefreshTime = Date.now()
      
      return true
    } catch (error) {
      console.error('手动刷新失败:', error)
      return false
    }
  }

  // 页面激活时的处理
  static handlePageActivation() {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时检查状态
      const monitor = AuthMonitor.getInstance()
      monitor.checkAuthStatus()
    }
  }

  // 页面卸载时的处理
  static handlePageDeactivation() {
    // 可以在这里保存一些状态到localStorage
  }
}

// 页面事件监听
if (typeof window !== 'undefined') {
  // 页面可见性变化
  document.addEventListener('visibilitychange', AuthMonitor.handlePageActivation)
  
  // 页面获得焦点
  window.addEventListener('focus', AuthMonitor.handlePageActivation)
  
  // 页面卸载
  window.addEventListener('beforeunload', AuthMonitor.handlePageDeactivation)
}

// 自动启动监控
export const startAuthMonitor = () => {
  return AuthMonitor.getInstance()
}

// 停止监控
export const stopAuthMonitor = () => {
  const monitor = AuthMonitor.getInstance()
  monitor.stopMonitoring()
}