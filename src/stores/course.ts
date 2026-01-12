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
    try {
      await enrollStudent(courseId, studentId)
      ElMessage.success('选课成功')
      // 刷新选课学生列表
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
      // 刷新选课学生列表
      if (currentCourse.value && currentCourse.value.id === courseId) {
        await fetchCourseStudents(courseId)
      }
      return true
    } catch (error) {
      ElMessage.error('取消选课失败')
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
    clearCurrentCourse
  }
})