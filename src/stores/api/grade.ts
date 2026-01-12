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
  console.log('=== API createGrade 调用 ===')
  console.log('URL: /grades')
  console.log('请求数据:', JSON.stringify(data, null, 2))
  console.log('===========================')
  return request.post('/grades', data)
}

// 更新成绩
export const updateGrade = (id: string, data: Partial<GradeFormData>): Promise<Grade> => {
  console.log('API updateGrade 调用，URL: /grades/' + id + ', 数据:', data)
  return request.put(`/grades/${id}`, data)
}

// 删除成绩
export const deleteGrade = (id: string): Promise<void> => {
  return request.delete(`/grades/${id}`)
}

// 批量删除成绩
export const batchDeleteGrades = (ids: string[]): Promise<{ success: number; failed: number }> => {
  console.log('API batchDeleteGrades 调用，IDs:', ids)
  return request.post('/grades/batch-delete', { ids })
}

// 批量导入成绩
export const importGrades = (data: { studentId: string; courseId: string; score: number }[]): Promise<{ success: number; failed: number; message?: string }> => {
  console.log('API importGrades 调用，数据:', data)
  return request.post('/grades/batch', { grades: data })
}

// 导出成绩数据
export const exportGrades = (params: GradeListParams = {}): Promise<Blob> => {
  return request.get('/grades/export', {
    params,
    responseType: 'blob'
  })
}

// 获取课程的学生成绩列表（用于成绩录入）
export const getCourseGrades = (courseId: string): Promise<any[]> => {
  return request.get(`/grades/course/${courseId}`).then((res: any) => {
    // API返回格式：{data: [...], total: x, page: x, limit: x}
    // 我们只需要data数组
    return res && res.data ? res.data : res
  })
}

// 批量更新成绩
export const batchUpdateGrades = (data: BatchGradeData): Promise<{ success: number; failed: number }> => {
  return request.post('/grades/batch-update', data)
}