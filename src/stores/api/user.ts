import request from './request'

export interface User {
  id: string
  username: string
  role: 'admin' | 'teacher' | 'student'
  name: string
  class?: string
  // 学生账号可选绑定学号（studentId），仅当 role === 'student' 时生效
  studentId?: string
  createdAt?: string
  updatedAt?: string
}

export interface UserListParams {
  role?: 'admin' | 'teacher' | 'student'
  search?: string
  page?: number
  limit?: number
}

export interface UserListResponse {
  data: User[]
  total: number
  page: number
  limit: number
}

export interface UserFormData {
  username: string
  password: string
  role: 'admin' | 'teacher' | 'student'
  name: string
  class?: string
  // 可选学号绑定，仅对学生生效
  studentId?: string
}

export interface BatchUserRequest {
  users: UserFormData[]
}

export interface BatchDeleteRequest {
  ids: string[]
}

// 获取用户列表
export const getUsers = (params: UserListParams = {}): Promise<UserListResponse> => {
  // 兼容：后端在 Gen4 中推荐使用 X-Query-Role / X-Query-Search header 进行筛选，
  // 但也接受 query params，这里同时支持以兼容不同实现。
  const headers: Record<string, string> = {}
  const queryParams: any = { ...params }

  if (params.role) {
    headers['X-Query-Role'] = params.role
    delete queryParams.role
  }
  if (params.search) {
    headers['X-Query-Search'] = params.search
    delete queryParams.search
  }

  return request.get('/users', { params: queryParams, headers })
}

// 创建用户
export const createUser = (data: UserFormData): Promise<User> => {
  return request.post('/users', data)
}

// 更新用户
export const updateUser = (id: string, data: Partial<UserFormData>): Promise<User> => {
  return request.put(`/users/${id}`, data)
}

// 删除用户
export const deleteUser = (id: string): Promise<void> => {
  return request.delete(`/users/${id}`)
}

// 批量导入用户
export const importUsers = (data: BatchUserRequest): Promise<{ success: number; failed: number; message?: string }> => {
  return request.post('/users/batch', data)
}

// 批量删除用户
export const batchDeleteUsers = (data: BatchDeleteRequest): Promise<{ success: number; failed: number }> => {
  return request.delete('/users/batch', { data })
}

// 重置用户密码
export const resetPassword = (id: string, newPassword: string): Promise<void> => {
  return request.put(`/users/${id}/reset-password`, { newPassword })
}