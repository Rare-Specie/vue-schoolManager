import request from './request'

export interface LoginRequest {
  username: string
  password: string
  role: 'admin' | 'teacher' | 'student'
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    username: string
    role: 'admin' | 'teacher' | 'student'
    name: string
    class?: string
  }
}

export interface UserProfile {
  id: string
  username: string
  role: 'admin' | 'teacher' | 'student'
  name: string
  class?: string
  createdAt?: string
  updatedAt?: string
}

export interface UpdatePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface OperationLog {
  id: string
  userId: string
  username: string
  action: string
  module: string
  ip?: string
  createdAt: string
}

export interface LogParams {
  page?: number
  limit?: number
  startTime?: string
  endTime?: string
}

// 登录
export const login = (data: LoginRequest): Promise<LoginResponse> => {
  return request.post('/auth/login', data)
}

// 登出
export const logout = (): Promise<void> => {
  return request.post('/auth/logout')
}

// 验证token
export const verifyToken = (): Promise<void> => {
  return request.get('/auth/verify')
}

// 获取个人信息
export const getProfile = (): Promise<UserProfile> => {
  return request.get('/user/profile')
}

// 注意：系统不支持 PUT /api/user/profile 接口
// 如需更新用户信息，请使用管理员权限调用 user.ts 中的 updateUser 接口
// export const updateProfile = (data: Partial<UserProfile>): Promise<UserProfile> => {
//   return request.put('/user/profile', data)
// }

// 修改密码
export const updatePassword = (data: UpdatePasswordRequest): Promise<void> => {
  return request.put('/user/password', data)
}

// 获取操作日志
export const getOperationLogs = (params: LogParams = {}): Promise<{ data: OperationLog[]; total: number }> => {
  return request.get('/user/logs', { params })
}