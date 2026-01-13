/**
 * 选课功能调试工具
 * 用于诊断 "course not found" 错误
 */

import { useCourseStore } from '@/stores/course'
import { useStudentStore } from '@/stores/student'
import { ElMessage } from 'element-plus'

/**
 * 调试选课流程
 */
export async function debugEnrollmentFlow(courseId: string, studentId: string) {
  console.log('=== 选课调试开始 ===')
  console.log('输入参数:', { courseId, studentId })
  
  const courseStore = useCourseStore()
  const studentStore = useStudentStore()
  
  // 步骤1: 检查课程数据
  console.log('\n1. 检查课程数据:')
  console.log('课程列表:', courseStore.courses)
  const course = courseStore.courses.find(c => c.id === courseId)
  console.log('找到的课程:', course)
  
  if (!course) {
    console.error('❌ 错误：在课程列表中找不到该课程')
    ElMessage.error(`找不到课程，数据库ID: ${courseId}`)
    return false
  }
  
  // 步骤2: 检查课程ID格式
  console.log('\n2. 检查课程ID格式:')
  console.log('课程数据库ID:', course.id)
  console.log('课程编号:', course.courseId)
  
  if (!course.courseId || course.courseId.trim() === '') {
    console.error('❌ 错误：课程编号为空')
    ElMessage.error('课程编号无效，请联系管理员')
    return false
  }
  
  // 步骤3: 检查学生数据
  console.log('\n3. 检查学生数据:')
  console.log('学生列表:', studentStore.students)
  const student = studentStore.students.find(s => s.studentId === studentId)
  console.log('找到的学生:', student)
  
  if (!student) {
    console.error('❌ 错误：在学生列表中找不到该学生')
    ElMessage.error(`找不到学生，学号: ${studentId}`)
    return false
  }
  
  // 步骤4: 检查API调用参数
  console.log('\n4. API调用参数:')
  console.log('将要调用的API: POST /api/courses/:id/enroll')
  console.log('URL参数:', course.courseId)
  console.log('请求体:', { studentId })
  
  console.log('\n=== 调试完成 ===')
  return true
}

/**
 * 检查课程ID映射是否正确
 */
export function validateCourseIdMapping(selectedCourseId: string): boolean {
  const courseStore = useCourseStore()
  
  if (!selectedCourseId) {
    console.error('未选择课程')
    return false
  }
  
  const course = courseStore.courses.find(c => c.id === selectedCourseId)
  
  if (!course) {
    console.error(`找不到课程，数据库ID: ${selectedCourseId}`)
    console.error('可用课程:', courseStore.courses)
    return false
  }
  
  if (!course.courseId || course.courseId.trim() === '') {
    console.error('课程编号为空:', course)
    return false
  }
  
  console.log('课程ID映射验证通过:', {
    数据库ID: selectedCourseId,
    课程编号: course.courseId,
    课程名称: course.name
  })
  
  return true
}

/**
 * 检查选课API调用
 */
export async function testEnrollmentAPI(courseId: string, studentId: string) {
  const courseStore = useCourseStore()
  
  console.log('=== 测试选课API调用 ===')
  console.log('输入参数:', { courseId, studentId })
  
  // 先获取课程详情
  try {
    const course = courseStore.courses.find(c => c.id === courseId)
    if (!course) {
      console.error('课程不存在')
      return false
    }
    
    console.log('使用课程编号调用API:', course.courseId)
    
    // 尝试调用选课方法
    await courseStore.enrollStudentToCourse(course.courseId, studentId)
    console.log('✅ 选课成功')
    return true
    
  } catch (error) {
    console.error('❌ 选课失败:', error)
    return false
  }
}

/**
 * 检查所有相关数据状态
 */
export function checkAllDataState() {
  const courseStore = useCourseStore()
  const studentStore = useStudentStore()
  
  console.log('=== 当前数据状态检查 ===')
  console.log('课程数量:', courseStore.courses.length)
  console.log('学生数量:', studentStore.students.length)
  
  if (courseStore.courses.length > 0) {
    console.log('课程列表:')
    courseStore.courses.forEach((course, index) => {
      console.log(`  ${index + 1}. ${course.name} (ID: ${course.id}, 编号: ${course.courseId})`)
    })
  } else {
    console.log('⚠️ 课程列表为空')
  }
  
  if (studentStore.students.length > 0) {
    console.log('学生列表:')
    studentStore.students.forEach((student, index) => {
      console.log(`  ${index + 1}. ${student.name} (学号: ${student.studentId})`)
    })
  } else {
    console.log('⚠️ 学生列表为空')
  }
}