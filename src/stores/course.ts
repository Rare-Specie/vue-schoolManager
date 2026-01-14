import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getCourses,
  getCourseDetail,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseStudents,
  enrollStudent,
  unenrollStudent,
  exportCoursesAsFormat,
  type Course,
  type CourseListParams,
  type CourseFormData,
  type CourseStudent
} from './api/course'
import { ElMessage } from 'element-plus'

export const useCourseStore = defineStore('course', () => {
  const courses = ref<Course[]>([])
  const currentCourse = ref<Course | null>(null)
  const courseStudents = ref<CourseStudent[]>([])
  const total = ref(0)
  const loading = ref(false)
  const detailLoading = ref(false)

  // 获取课程列表
  const fetchCourses = async (params: CourseListParams = {}) => {
    loading.value = true
    try {
      console.log('=== fetchCourses 调用 ===')
      console.log('请求参数:', params)
      
      const response = await getCourses(params)
      
      console.log('API 返回数据:', response)
      console.log('课程列表:', response.data)
      
      courses.value = response.data
      total.value = response.total
      
      console.log('========================')
      return response
    } catch (error) {
      console.error('获取课程列表失败:', error)
      ElMessage.error('获取课程列表失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取课程详情
  const fetchCourseDetail = async (id: string) => {
    detailLoading.value = true
    try {
      const course = await getCourseDetail(id)
      currentCourse.value = course
      return course
    } catch (error) {
      ElMessage.error('获取课程详情失败')
      throw error
    } finally {
      detailLoading.value = false
    }
  }

  // 添加课程
  const addCourse = async (data: CourseFormData) => {
    try {
      const course = await createCourse(data)
      ElMessage.success('课程添加成功')
      return course
    } catch (error) {
      ElMessage.error('课程添加失败')
      throw error
    }
  }

  // 更新课程
  const updateCourseInfo = async (id: string, data: Partial<CourseFormData>) => {
    try {
      const course = await updateCourse(id, data)
      ElMessage.success('课程信息更新成功')
      return course
    } catch (error) {
      ElMessage.error('课程信息更新失败')
      throw error
    }
  }

  // 删除课程
  const removeCourse = async (id: string) => {
    try {
      await deleteCourse(id)
      ElMessage.success('课程删除成功')
      // 从列表中移除
      courses.value = courses.value.filter(c => c.id !== id)
    } catch (error) {
      ElMessage.error('课程删除失败')
      throw error
    }
  }

  // 获取选课学生
  const fetchCourseStudents = async (courseId: string, limit: number = 1000) => {
    try {
      const students = await getCourseStudents(courseId, limit)
      courseStudents.value = students
      return students
    } catch (error) {
      ElMessage.error('获取选课学生失败')
      throw error
    }
  }

  // 学生选课
  const enrollStudentToCourse = async (courseId: string, studentId: string) => {
    console.log('=== store enrollStudentToCourse 调用 ===')
    console.log('courseId:', courseId, '类型:', typeof courseId)
    console.log('studentId:', studentId)
    console.log('currentCourse:', currentCourse.value)
    try {
      await enrollStudent(courseId, studentId)
      ElMessage.success('选课成功')
      // 刷新选课学生列表 - courseId 是课程数据库ID，需要匹配 currentCourse.id
      if (currentCourse.value && currentCourse.value.id === courseId) {
        await fetchCourseStudents(courseId)
      }
      return true
    } catch (error) {
      ElMessage.error('选课失败')
      throw error
    }
  }

  // 取消选课
  const unenrollStudentFromCourse = async (courseId: string, studentId: string) => {
    try {
      await unenrollStudent(courseId, studentId)
      ElMessage.success('取消选课成功')
      // 刷新选课学生列表 - courseId 是课程数据库ID，需要匹配 currentCourse.id
      if (currentCourse.value && currentCourse.value.id === courseId) {
        await fetchCourseStudents(courseId)
      }
      return true
    } catch (error) {
      ElMessage.error('取消选课失败')
      throw error
    }
  }

  // 导出课程数据为指定格式
  const exportCoursesAsFormat = async (params: { search?: string; format?: 'json' | 'csv' | 'excel' } = {}) => {
    try {
      // 先获取课程数据
      const response = await fetchCourses({ search: params.search, page: 1, limit: 1000 })
      const coursesData = response.data
      
      // 根据格式转换数据
      const format = params.format || 'json'
      let blob: Blob
      let fileName = ''
      let extension = ''
      
      if (format === 'json') {
        const jsonStr = JSON.stringify(coursesData, null, 2)
        blob = new Blob([jsonStr], { type: 'application/json' })
        extension = 'json'
      } else if (format === 'csv') {
        // 生成CSV
        const headers = ['课程编号', '课程名称', '学分', '教师', '描述']
        const csvContent = [
          headers.join(','),
          ...coursesData.map(course => [
            course.courseId,
            `"${course.name.replace(/"/g, '""')}"`,
            course.credit,
            course.teacher ? `"${course.teacher.replace(/"/g, '""')}"` : '',
            course.description ? `"${course.description.replace(/"/g, '""')}"` : ''
          ].join(','))
        ].join('\n')
        blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        extension = 'csv'
      } else {
        // Excel格式 - 使用JSON转换
        const jsonStr = JSON.stringify(coursesData, null, 2)
        blob = new Blob([jsonStr], { type: 'application/json' })
        extension = 'xlsx'
      }
      
      fileName = `课程数据_${new Date().toISOString().split('T')[0]}.${extension}`
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
      
      ElMessage.success(`课程数据已导出为 ${format.toUpperCase()} 格式`)
    } catch (error) {
      ElMessage.error('课程数据导出失败')
      throw error
    }
  }

  // 清空当前课程
  const clearCurrentCourse = () => {
    currentCourse.value = null
    courseStudents.value = []
  }

  return {
    courses,
    currentCourse,
    courseStudents,
    total,
    loading,
    detailLoading,
    fetchCourses,
    fetchCourseDetail,
    addCourse,
    updateCourseInfo,
    removeCourse,
    fetchCourseStudents,
    enrollStudentToCourse,
    unenrollStudentFromCourse,
    exportCoursesAsFormat,
    clearCurrentCourse
  }
})