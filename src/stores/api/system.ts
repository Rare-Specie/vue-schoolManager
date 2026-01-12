import request from './request'

export interface Backup {
  id: string
  name: string
  size: number
  createdAt: string
  createdBy: string
}

export interface SystemLog {
  id: string
  level: 'info' | 'warning' | 'error'
  message: string
  module: string
  ip?: string
  createdAt: string
}

export interface LogParams {
  page?: number
  limit?: number
  level?: string
  startTime?: string
  endTime?: string
}

export interface LogResponse {
  data: SystemLog[]
  total: number
  page: number
  limit: number
}

export interface SystemSettings {
  backupInterval: number
  logRetentionDays: number
  maxLoginAttempts: number
  sessionTimeout: number
}

// 创建备份
export const createBackup = (): Promise<{ id: string; name: string }> => {
  return request.post('/system/backup')
}

// 获取备份列表
export const getBackups = (): Promise<Backup[]> => {
  return request.get('/system/backups')
}

// 恢复备份
export const restoreBackup = (backupId: string): Promise<void> => {
  return request.post('/system/restore', { backupId })
}

// 删除备份
export const deleteBackup = (backupId: string): Promise<void> => {
  return request.delete(`/system/backups/${backupId}`)
}

// 获取系统日志
export const getSystemLogs = (params: LogParams = {}): Promise<LogResponse> => {
  return request.get('/system/logs', { params })
}

// 获取系统设置
export const getSystemSettings = (): Promise<SystemSettings> => {
  return request.get('/system/settings')
}

// 更新系统设置
export const updateSystemSettings = (settings: SystemSettings): Promise<void> => {
  return request.put('/system/settings', settings)
}

// 清理日志
export const cleanLogs = (): Promise<void> => {
  return request.post('/system/clean-logs')
}

// 导出日志
export const exportLogs = (params: LogParams = {}): Promise<Blob> => {
  return request.get('/system/export-logs', {
    params,
    responseType: 'blob'
  })
}