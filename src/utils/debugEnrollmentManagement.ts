/**
 * 选课管理界面调试工具
 * 用于诊断选课管理中的问题
 */

import { useCourseStore } from '@/stores/course'
import { useStudentStore } from '@/stores/student'
import { ElMessage } from 'element-plus'

/**
 * 调试选课管理界面的加载流程
 */
export async function debugEnrollmentManagementFlow() {
  console.log('=== 选课管理界面调试开始 ===')
  
  const courseStore = useCourseStore()
  const studentStore = useStudentStore()
  
  // 步骤1: 检查课程数据
  console.log('\n1. 检查课程数据:')
  console.log('课程列表:', courseStore.courses)
  console.log('课程数量:', courseStore.courses.length)
  
  if (courseStore.courses.length === 0) {
    console.error('❌ 错误：课程列表为空')
    ElMessage.error('课程列表为空，请先添加课程')
    return false
  }
  
  // 步骤2: 检查课程ID格式
  console.log('\n2. 检查课程ID格式:')
  courseStore.courses.forEach((course, index) => {
    console.log(`课程 ${index + 1}:`, {
      数据库ID: course.id,
      课程编号: course.courseId,
      课程名称: course.name,
      ID类型: typeof course.id,
      courseId类型: typeof course.courseId
    })
  })
  
  // 步骤3: 检查学生数据
  console.log('\n3. 检查学生数据:')
  console.log('学生列表:', studentStore.students)
  console.log('学生数量:', studentStore.students.length)
  
  // 步骤4: 模拟选课操作
  console.log('\n4. 模拟选课操作:')
  if (courseStore.courses.length > 0 && studentStore.students.length > 0) {
    const testCourse = courseStore.courses[0]
    const testStudent = studentStore.students[0]
    
    console.log('测试课程:', testCourse)
    console.log('测试学生:', testStudent)
    
    // 检查课程编号是否有效
    if (!testCourse.courseId || testCourse.courseId.trim() === '') {
      console.error('❌ 错误：课程编号为空')
      ElMessage.error('课程编号无效')
      return false
    }
    
    console.log('将要调用的API: POST /api/courses/:id/enroll')
    console.log('URL参数:', testCourse.courseId)
    console.log('请求体:', { studentId: testStudent.studentId })
    
    // 尝试调用选课
    try {
      await courseStore.enrollStudentToCourse(testCourse.courseId, testStudent.studentId)
      console.log('✅ 选课测试成功')
      return true
    } catch (error) {
      console.error('❌ 选课测试失败:', error)
      return false
    }
  } else {
    console.log('⚠️ 缺少测试数据')
    return false
  }
}

/**
 * 检查选课管理界面的表单数据
 */
export function checkEnrollmentForm(form: any) {
  console.log('=== 表单数据检查 ===')
  console.log('表单内容:', form)
  console.log('课程ID:', form.courseId)
  console.log('学生IDs:', form.studentIds)
  
  const courseStore = useCourseStore()
  
  if (form.courseId) {
    const course = courseStore.courses.find(c => c.id === form.courseId)
    console.log('选中的课程:', course)
    
    if (course) {
      console.log('课程编号:', course.courseId)
      return course.courseId
    } else {
      console.error('❌ 找不到对应的课程')
      return null
    }
  }
  
  return null
}

/**
 * 测试获取选课学生列表
 */
export async function testGetCourseStudents(courseId: string) {
  const courseStore = useCourseStore()
  
  console.log('=== 测试获取选课学生列表 ===')
  console.log('输入课程ID:', courseId)
  
  // 查找课程
  const course = courseStore.courses.find(c => c.id === courseId)
  if (!course) {
    console.error('❌ 课程不存在')
    return false
  }
  
  console.log('找到课程:', course)
  console.log('使用课程编号调用API:', course.courseId)
  
  try {
    const students = await courseStore.fetchCourseStudents(course.courseId, 1000)
    console.log('✅ 获取成功，学生列表:', students)
    return true
  } catch (error) {
    console.error('❌ 获取失败:', error)
    return false
  }
}

/**
 * 检查批量选课流程
 */
export async function testBatchEnroll(courseId: string, studentIds: string[]) {
  const courseStore = useCourseStore()
  
  console.log('=== 测试批量选课 ===')
  console.log('课程ID:', courseId)
  console.log('学生IDs:', studentIds)
  
  // 查找课程
  const course = courseStore.courses.find(c => c.id === courseId)
  if (!course) {
    console.error('❌ 课程不存在')
    return false
  }
  
  console.log('找到课程:', course)
  console.log('使用课程编号:', course.courseId)
  
  let success = 0
  let failed = 0
  
  for (const studentId of studentIds) {
    try {
      await courseStore.enrollStudentToCourse(course.courseId, studentId)
      console.log(`✅ 学生 ${studentId} 选课成功`)
      success++
    } catch (error) {
      console.error(`❌ 学生 ${studentId} 选课失败:`, error)
      failed++
    }
  }
  
  console.log(`批量选课完成：成功 ${success}，失败 ${failed}`)
  return failed === 0
}