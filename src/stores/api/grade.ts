import request from './request'

export interface Grade {
  id: string
  studentId: string
  studentName: string
  courseId: string
  courseName: string
  score: number
  createdAt?: string
  updatedAt?: string
}

export interface GradeListParams {
  studentId?: string
  courseId?: string
  class?: string
  startTime?: string
  endTime?: string
  page?: number
  limit?: number
}

export interface GradeListResponse {
  data: Grade[]
  total: number
  page: number
  limit: number
}

export interface GradeFormData {
  studentId: string
  courseId: string
  score: number
}

export interface BatchGradeData {
  courseId: string
  grades: Array<{
    studentId: string
    score: number
  }>
}

// 获取成绩列表
export const getGrades = (params: GradeListParams = {}): Promise<GradeListResponse> => {
  return request.get('/grades', { params })
}

// 录入/更新成绩
export const createGrade = (data: GradeFormData): Promise<Grade> => {
  // 确保只发送必要的字段，不包含学期参数
  const cleanData = {
    studentId: data.studentId,
    courseId: data.courseId,
    score: data.score
  }
  return request.post('/grades', cleanData)
}

// 更新成绩
export const updateGrade = (id: string, data: Partial<GradeFormData>): Promise<Grade> => {
  // 确保只发送必要的字段，不包含学期参数
  const cleanData = {
    score: data.score
  }
  return request.put(`/grades/${id}`, cleanData)
}

// 删除成绩
export const deleteGrade = (id: string): Promise<void> => {
  return request.delete(`/grades/${id}`)
}

// 批量导入成绩
export const importGrades = (data: { studentId: string; courseId: string; score: number }[]): Promise<{ success: number; failed: number; message?: string }> => {
  // 支持两种格式：数组格式和对象格式
  const payload = Array.isArray(data) ? { grades: data } : data
  return request.post('/grades/batch', payload)
}

// 导出成绩数据
export const exportGrades = (params: GradeListParams = {}): Promise<Blob> => {
  return request.get('/grades/export', {
    params,
    responseType: 'blob'
  })
}

// 获取课程的学生成绩列表（用于成绩录入）
export const getCourseGrades = (courseId: string, semester?: string): Promise<any[]> => {
  const headers: Record<string, string> = {}
  if (semester) {
    headers['X-Query-Semester'] = semester
  }
  // 默认获取完整数据
  headers['X-Full-Data'] = 'true'
  
  return request.get(`/grades/course/${courseId}`, { headers }).then((res: any) => {
    // API返回格式：{data: [...], total: x, page: x, limit: x}
    // 我们只需要data数组
    return res && res.data ? res.data : res
  })
}

// 批量更新成绩
export const batchUpdateGrades = (data: BatchGradeData): Promise<{ success: number; failed: number }> => {
  return request.post('/grades/batch-update', data)
}

// 获取学生成绩概览
export const getStudentGrades = (studentId: string): Promise<any[]> => {
  return request.get(`/students/${studentId}/grades`).then((res: any) => {
    return res && res.data ? res.data : res
  })
}

// 导出成绩数据（带请求头参数）
export const exportGradesWithHeaders = (params: GradeListParams = {}, headers: Record<string, string> = {}): Promise<Blob> => {
  return request.get('/grades/export', {
    params,
    headers,
    responseType: 'blob'
  })
}