import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  importUsers,
  batchDeleteUsers,
  resetPassword,
  type User,
  type UserListParams,
  type UserFormData,
  type BatchUserRequest,
  type BatchDeleteRequest
} from './api/user'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const total = ref(0)
  const loading = ref(false)

  // 获取用户列表
  const fetchUsers = async (params: UserListParams = {}) => {
    loading.value = true
    try {
      const response = await getUsers(params)
      users.value = response.data
      total.value = response.total
      return response
    } catch (error) {
      ElMessage.error('获取用户列表失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 创建用户
  const addUser = async (data: UserFormData) => {
    try {
      const user = await createUser(data)
      ElMessage.success('用户创建成功')
      return user
    } catch (error) {
      ElMessage.error('用户创建失败')
      throw error
    }
  }

  // 更新用户
  const updateUserInfo = async (id: string, data: Partial<UserFormData>) => {
    try {
      const user = await updateUser(id, data)
      ElMessage.success('用户信息更新成功')
      return user
    } catch (error) {
      ElMessage.error('用户信息更新失败')
      throw error
    }
  }

  // 删除用户
  const removeUser = async (id: string) => {
    try {
      await deleteUser(id)
      ElMessage.success('用户删除成功')
      // 从列表中移除
      users.value = users.value.filter(u => u.id !== id)
    } catch (error) {
      ElMessage.error('用户删除失败')
      throw error
    }
  }

  // 批量导入
  const importUsersData = async (data: BatchUserRequest) => {
    loading.value = true
    try {
      const result = await importUsers(data)
      if (result.failed > 0) {
        ElMessage.warning(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
      } else {
        ElMessage.success(`成功导入 ${result.success} 条数据`)
      }
      return result
    } catch (error) {
      ElMessage.error('导入失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 批量删除
  const batchDelete = async (data: BatchDeleteRequest) => {
    loading.value = true
    try {
      const result = await batchDeleteUsers(data)
      if (result.failed > 0) {
        ElMessage.warning(`删除完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
      } else {
        ElMessage.success(`成功删除 ${result.success} 条数据`)
      }
      // 刷新列表
      await fetchUsers()
      return result
    } catch (error) {
      ElMessage.error('批量删除失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 重置密码
  const resetUserPassword = async (id: string, newPassword: string) => {
    try {
      await resetPassword(id, newPassword)
      ElMessage.success('密码重置成功')
    } catch (error) {
      ElMessage.error('密码重置失败')
      throw error
    }
  }

  // 清空数据
  const clearData = () => {
    users.value = []
    total.value = 0
  }

  return {
    users,
    total,
    loading,
    fetchUsers,
    addUser,
    updateUserInfo,
    removeUser,
    importUsersData,
    batchDelete,
    resetUserPassword,
    clearData
  }
})