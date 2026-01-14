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
  // 过滤掉undefined和null值，确保数据清洁
  const cleanData = data.map(item => {
    const cleaned: any = {
      studentId: item.studentId,
      name: item.name,
      class: item.class
    }
    if (item.gender) cleaned.gender = item.gender
    if (item.phone) cleaned.phone = item.phone
    if (item.email) cleaned.email = item.email
    return cleaned
  })
  
  // 按照后端接口文档（POST /students/batch）期望接收 "数组形式" 的 JSON body，这里直接发送数组以避免 400 错误
  return request.post('/students/batch', cleanData)
}

// 导出学生数据
export const exportStudents = (): Promise<Blob> => {
  return request.get('/students/export', {
    responseType: 'blob'
  })
}

// 导出学生数据为指定格式
export const exportStudentsAsFormat = (params: { class?: string; search?: string; format?: 'json' | 'csv' | 'excel' } = {}): Promise<Blob> => {
  // 先获取学生数据，然后在前端转换为指定格式
  return request.get('/students', { 
    params: {
      class: params.class,
      search: params.search,
      page: 1,
      limit: 1000
    }
  }).then((response: any) => {
    const data = response.data || response
    const format = params.format || 'json'
    
    if (format === 'json') {
      const jsonStr = JSON.stringify(data, null, 2)
      return new Blob([jsonStr], { type: 'application/json' })
    } else if (format === 'csv') {
      // 生成CSV
      const headers = ['学号', '姓名', '班级', '性别', '电话', '邮箱']
      const csvContent = [
        headers.join(','),
        ...data.map((student: any) => [
          student.studentId,
          `"${student.name.replace(/"/g, '""')}"`,
          student.class,
          student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : '',
          student.phone || '',
          student.email || ''
        ].join(','))
      ].join('\n')
      return new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    } else {
      // Excel格式 - 使用JSON转换
      const jsonStr = JSON.stringify(data, null, 2)
      return new Blob([jsonStr], { type: 'application/json' })
    }
  })
}

// 获取学生成绩概览
export const getStudentGradesOverview = (studentId: string): Promise<any> => {
  return request.get(`/students/${studentId}/grades`)
}