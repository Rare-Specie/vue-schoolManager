/**
 * 成绩创建问题调试工具
 * 用于诊断成绩创建时课程ID错误的问题
 */

import { useCourseStore } from '@/stores/course'
import { useGradeStore } from '@/stores/grade'

export async function debugGradeCreationIssue() {
  console.log('=== 成绩创建问题调试工具 ===')
  
  const courseStore = useCourseStore()
  const gradeStore = useGradeStore()
  
  // 1. 检查课程数据
  console.log('1. 检查课程数据:')
  console.log('课程列表:', courseStore.courses)
  
  if (courseStore.courses.length === 0) {
    console.warn('警告：课程列表为空，请先加载课程数据')
  }
  
  // 2. 检查每个课程的ID结构
  console.log('2. 课程ID结构分析:')
  courseStore.courses.forEach(course => {
    console.log(`课程: ${course.name}`, {
      数据库ID: course.id,
      课程编号: course.courseId,
      完整数据: course
    })
  })
  
  // 3. 检查当前选中的课程
  console.log('3. 当前选中课程检查:')
  const selectedCourseId = (document.querySelector('.el-select') as any)?.__vnode?.props?.modelValue
  console.log('当前选中的课程ID:', selectedCourseId)
  
  if (selectedCourseId) {
    const selectedCourse = courseStore.courses.find(c => c.id === selectedCourseId)
    if (selectedCourse) {
      console.log('选中的课程详情:', {
        数据库ID: selectedCourse.id,
        课程编号: selectedCourse.courseId,
        名称: selectedCourse.name
      })
    } else {
      console.error('错误：找不到选中的课程！')
    }
  }
  
  // 4. 检查成绩数据
  console.log('4. 成绩数据检查:')
  console.log('当前课程成绩列表:', gradeStore.courseGrades)
  
  // 5. 模拟成绩创建过程
  console.log('5. 模拟成绩创建过程:')
  if (selectedCourseId && courseStore.courses.length > 0) {
    const currentCourse = courseStore.courses.find(c => c.id === selectedCourseId)
    if (currentCourse) {
      const courseCode = currentCourse.courseId
      console.log('将使用的课程编号:', courseCode)
      console.log('预期的后端处理:', {
        studentId: '示例学生ID',
        courseId: courseCode,
        score: 85
      })
    }
  }
  
  console.log('=== 调试完成 ===')
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
 * 导出当前课程信息用于分析
 */
export function exportCourseInfo() {
  const courseStore = useCourseStore()
  
  const courseInfo = courseStore.courses.map(course => ({
    数据库ID: course.id,
    课程编号: course.courseId,
    课程名称: course.name,
    学分: course.credit,
    教师: course.teacher,
    描述: course.description
  }))
  
  console.log('课程信息导出:', courseInfo)
  
  // 创建JSON文件下载
  const blob = new Blob([JSON.stringify(courseInfo, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `课程信息_${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  return courseInfo
}