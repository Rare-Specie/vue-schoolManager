import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getProfile, updatePassword, type LoginRequest, type UserProfile, type UpdatePasswordRequest } from './api/auth'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<UserProfile | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isStudent = computed(() => user.value?.role === 'student')

  // 初始化
  const init = async () => {
    if (token.value) {
      try {
        await getProfile()
      } catch (error) {
        logout()
      }
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
      localStorage.setItem('token', response.token)
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
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
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
    handleChangePassword
  }
})