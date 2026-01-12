import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getProfile, updatePassword, type LoginRequest, type UserProfile, type UpdatePasswordRequest } from './api/auth'
import { ElMessage } from 'element-plus'
import { tokenManager } from '@/utils/tokenManager'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(tokenManager.getToken())
  const user = ref<UserProfile | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => {
    // 使用Token管理器验证
    return tokenManager.isValid() && !!token.value
  })
  
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isStudent = computed(() => user.value?.role === 'student')

  // 清除认证状态
  const clearAuthState = () => {
    token.value = ''
    user.value = null
    tokenManager.clear()
  }

  // 初始化 - 页面加载时恢复状态
  const init = async () => {
    // 检查token是否有效
    if (tokenManager.isValid()) {
      try {
        // 验证token有效性（调用后端）
        await getProfile()
        // Token管理器会自动处理刷新
      } catch (error) {
        clearAuthState()
      }
    } else {
      // token无效，清除状态
      clearAuthState()
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
  const handleLogout = async () => {
    try {
      await logout()
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
        // 尝试自动刷新token
        const currentToken = tokenManager.getToken()
        tokenManager.setToken(currentToken, 24 * 60 * 60 * 1000)
        return true
      } catch (error) {
        ElMessage.warning('登录即将过期，请重新登录')
        return false
      }
    }
    return true
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    init,
    handleLogin,
    handleLogout,
    fetchProfile,
    handleChangePassword,
    validateToken,
    clearAuthState,
    checkTokenRefresh
  }
})