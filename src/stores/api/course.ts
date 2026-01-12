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

// 获取课程列表
export const getCourses = (params: CourseListParams = {}): Promise<CourseListResponse> => {
  return request.get('/courses', { params })
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
export const getCourseStudents = (courseId: string): Promise<CourseStudent[]> => {
  return request.get(`/courses/${courseId}/students`)
}

// 学生选课
export const enrollStudent = (courseId: string, studentId: string): Promise<any> => {
  // 使用 RESTful 路径：POST /courses/:id/enroll
  return request.post(`/courses/${courseId}/enroll`, { studentId })
}

// 取消选课
export const unenrollStudent = (courseId: string, studentId: string): Promise<any> => {
  // 使用 RESTful 路径：DELETE /courses/:id/enroll/:studentId
  return request.delete(`/courses/${courseId}/enroll/${studentId}`)
}