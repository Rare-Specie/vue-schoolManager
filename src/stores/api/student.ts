import request from './request'

export interface Student {
  id: string
  studentId: string
  name: string
  class: string
  gender?: 'male' | 'female'
  phone?: string
  email?: string
  createdAt?: string
  updatedAt?: string
}

export interface StudentListParams {
  class?: string
  search?: string
  page?: number
  limit?: number
}

export interface StudentListResponse {
  data: Student[]
  total: number
  page: number
  limit: number
}

export interface StudentFormData {
  studentId: string
  name: string
  class: string
  gender?: 'male' | 'female'
  phone?: string
  email?: string
}

// 获取学生列表
export const getStudents = (params: StudentListParams = {}): Promise<StudentListResponse> => {
  return request.get('/students', { params })
}

// 获取单个学生详情
export const getStudentDetail = (id: string): Promise<Student> => {
  return request.get(`/students/${id}`)
}

// 添加学生
export const createStudent = (data: StudentFormData): Promise<Student> => {
  // 过滤掉空字符串字段，避免后端将空字符串视为非法参数
  const payload = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== '' && v !== null && v !== undefined)) as any
  return request.post('/students', payload)
}

// 更新学生信息
export const updateStudent = (id: string, data: Partial<StudentFormData>): Promise<Student> => {
  return request.put(`/students/${id}`, data)
}

// 删除学生
export const deleteStudent = (id: string): Promise<void> => {
  return request.delete(`/students/${id}`)
}

// 批量导入学生
export const importStudents = (data: { studentId: string; name: string; class: string; gender?: 'male' | 'female'; phone?: string; email?: string }[]): Promise<{ success: number; failed: number; message?: string }> => {
  return request.post('/students/batch', { students: data })
}

// 导出学生数据
export const exportStudents = (): Promise<Blob> => {
  return request.get('/students/export', {
    responseType: 'blob'
  })
}

// 获取学生成绩概览
export const getStudentGradesOverview = (studentId: string): Promise<any> => {
  return request.get(`/students/${studentId}/grades`)
}