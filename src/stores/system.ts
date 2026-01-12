import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createBackup,
  getBackups,
  restoreBackup,
  deleteBackup,
  getSystemLogs,
  getSystemSettings,
  updateSystemSettings,
  cleanLogs,
  exportLogs,
  type Backup,
  type SystemLog,
  type LogParams,
  type SystemSettings
} from './api/system'
import { ElMessage } from 'element-plus'

export const useSystemStore = defineStore('system', () => {
  const backups = ref<Backup[]>([])
  const logs = ref<SystemLog[]>([])
  const settings = ref<SystemSettings | null>(null)
  const total = ref(0)
  const loading = ref(false)

  // 创建备份
  const createSystemBackup = async () => {
    loading.value = true
    try {
      const result = await createBackup()
      ElMessage.success(`备份创建成功：${result.name}`)
      await fetchBackups()
      return result
    } catch (error) {
      ElMessage.error('备份创建失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取备份列表
  const fetchBackups = async () => {
    loading.value = true
    try {
      const data = await getBackups()
      backups.value = data
      return data
    } catch (error) {
      ElMessage.error('获取备份列表失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 恢复备份
  const restoreSystemBackup = async (backupId: string) => {
    loading.value = true
    try {
      await restoreBackup(backupId)
      ElMessage.success('备份恢复成功')
    } catch (error) {
      ElMessage.error('备份恢复失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 删除备份
  const removeBackup = async (backupId: string) => {
    try {
      await deleteBackup(backupId)
      ElMessage.success('备份删除成功')
      backups.value = backups.value.filter(b => b.id !== backupId)
    } catch (error) {
      ElMessage.error('备份删除失败')
      throw error
    }
  }

  // 获取系统日志
  const fetchSystemLogs = async (params: LogParams = {}) => {
    loading.value = true
    try {
      const response = await getSystemLogs(params)
      logs.value = response.data
      total.value = response.total
      return response
    } catch (error) {
      ElMessage.error('获取系统日志失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取系统设置
  const fetchSystemSettings = async () => {
    loading.value = true
    try {
      const data = await getSystemSettings()
      settings.value = data
      return data
    } catch (error) {
      ElMessage.error('获取系统设置失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新系统设置
  const updateSettings = async (data: SystemSettings) => {
    loading.value = true
    try {
      await updateSystemSettings(data)
      settings.value = data
      ElMessage.success('系统设置更新成功')
    } catch (error) {
      ElMessage.error('系统设置更新失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 清理日志
  const cleanSystemLogs = async () => {
    loading.value = true
    try {
      await cleanLogs()
      ElMessage.success('日志清理成功')
      logs.value = []
      total.value = 0
    } catch (error) {
      ElMessage.error('日志清理失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 导出日志
  const exportSystemLogs = async (params: LogParams = {}) => {
    loading.value = true
    try {
      const blob = await exportLogs(params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `系统日志_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('日志导出成功')
      return blob
    } catch (error) {
      ElMessage.error('日志导出失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 清空数据
  const clearData = () => {
    backups.value = []
    logs.value = []
    settings.value = null
    total.value = 0
  }

  return {
    backups,
    logs,
    settings,
    total,
    loading,
    createSystemBackup,
    fetchBackups,
    restoreSystemBackup,
    removeBackup,
    fetchSystemLogs,
    fetchSystemSettings,
    updateSettings,
    cleanSystemLogs,
    exportSystemLogs,
    clearData
  }
})