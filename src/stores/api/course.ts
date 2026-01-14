import request from './request'

export interface Course {
  id: string
  courseId: string
  name: string
  credit: number
  teacher?: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export interface CourseListParams {
  search?: string
  page?: number
  limit?: number
}

export interface CourseListResponse {
  data: Course[]
  total: number
  page: number
  limit: number
}

export interface CourseFormData {
  courseId: string
  name: string
  credit: number
  teacher?: string
  description?: string
}

export interface CourseStudent {
  studentId: string
  name: string
  class: string
  score?: number
}

// 辅助函数：将数据转换为指定格式
function convertToExportFormat(data: any[], format: 'json' | 'csv' | 'excel', type: string): Blob {
  if (format === 'json') {
    const jsonStr = JSON.stringify(data, null, 2)
    return new Blob([jsonStr], { type: 'application/json' })
  } else if (format === 'csv') {
    let csvContent = ''
    if (data.length > 0) {
      // 生成表头
      const headers = Object.keys(data[0])
      csvContent += headers.join(',') + '\n'
      
      // 生成数据行
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header]
          if (value === null || value === undefined) return ''
          // 处理包含逗号的值
          const strValue = String(value)
          if (strValue.includes(',') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`
          }
          return strValue
        })
        csvContent += values.join(',') + '\n'
      })
    }
    return new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  } else {
    // Excel格式 - 简单实现，实际项目中可能需要更复杂的处理
    const jsonStr = JSON.stringify(data, null, 2)
    return new Blob([jsonStr], { type: 'application/json' })
  }
}

// 获取课程列表
export const getCourses = (params: CourseListParams = {}): Promise<CourseListResponse> => {
  console.log('=== API getCourses 调用 ===')
  console.log('URL: /courses')
  console.log('参数:', params)
  
  return request.get('/courses', { params }).then((response: any) => {
    console.log('API 返回:', response)
    return response
  })
}

// 导出课程数据为指定格式
export const exportCoursesAsFormat = (params: { search?: string; format?: 'json' | 'csv' | 'excel' } = {}): Promise<Blob> => {
  // 注意：后端可能没有专门的课程导出接口，这里假设使用课程列表接口
  // 如果后端有专门的导出接口，需要调整URL
  return request.get('/courses/export', {
    params,
    responseType: 'blob'
  }).then((res: any) => res as Blob).catch(() => {
    // 如果导出接口不存在，使用课程列表接口并转换为指定格式
    return request.get('/courses', { params }).then((res: any) => {
      const data = res.data || res
      // 在前端转换为指定格式
      return convertToExportFormat(data, params.format || 'json', 'courses')
    })
  })
}

// 获取单个课程详情
export const getCourseDetail = (id: string): Promise<Course> => {
  return request.get(`/courses/${id}`)
}

// 添加课程
export const createCourse = (data: CourseFormData): Promise<Course> => {
  return request.post('/courses', data)
}

// 更新课程
export const updateCourse = (id: string, data: Partial<CourseFormData>): Promise<Course> => {
  return request.put(`/courses/${id}`, data)
}

// 删除课程
export const deleteCourse = (id: string): Promise<void> => {
  return request.delete(`/courses/${id}`)
}

// 获取选课学生列表
export const getCourseStudents = (courseId: string, limit?: number): Promise<CourseStudent[]> => {
  // 后端可能返回 { data: CourseStudent[] }（分页/封装）或直接返回数组，这里统一返回数组
  console.log('=== getCourseStudents 调用 ===')
  console.log('courseId:', courseId, '类型:', typeof courseId)
  console.log('URL:', `/courses/${courseId}/students`)
  const params: any = {}
  if (limit !== undefined) {
    params.limit = limit
  }
  return request.get(`/courses/${courseId}/students`, { params }).then((res: any) => {
    return res && res.data ? res.data : res
  })
}

// 学生选课
export const enrollStudent = (courseId: string, studentId: string): Promise<any> => {
  // 使用 RESTful 路径：POST /courses/:id/enroll
  console.log('=== enrollStudent 调用 ===')
  console.log('courseId:', courseId, '类型:', typeof courseId)
  console.log('studentId:', studentId)
  console.log('URL:', `/courses/${courseId}/enroll`)
  return request.post(`/courses/${courseId}/enroll`, { studentId })
}

// 取消选课
export const unenrollStudent = (courseId: string, studentId: string): Promise<any> => {
  // 使用 RESTful 路径：DELETE /courses/:id/enroll/:studentId
  console.log('=== unenrollStudent 调用 ===')
  console.log('courseId:', courseId, '类型:', typeof courseId)
  console.log('studentId:', studentId)
  console.log('URL:', `/courses/${courseId}/enroll/${studentId}`)
  return request.delete(`/courses/${courseId}/enroll/${studentId}`)
}