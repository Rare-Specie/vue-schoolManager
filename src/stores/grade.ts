import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  importGrades,
  exportGrades,
  getCourseGrades,
  batchUpdateGrades,
  getStudentGrades,
  exportGradesWithHeaders,
  exportGradesAsFormat,
  type Grade,
  type GradeListParams,
  type GradeFormData,
  type BatchGradeData
} from './api/grade'
import { ElMessage } from 'element-plus'
import { useAuthStore } from './auth'

export const useGradeStore = defineStore('grade', () => {
  const grades = ref<Grade[]>([])
  const courseGrades = ref<any[]>([])
  const total = ref(0)
  const loading = ref(false)

  // 获取成绩列表
  const fetchGrades = async (params: GradeListParams = {}) => {
    loading.value = true
    try {
      const response = await getGrades(params)
      grades.value = response.data
      total.value = response.total
      return response
    } catch (error) {
      ElMessage.error('获取成绩列表失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 录入成绩
  const addGrade = async (data: GradeFormData) => {
    // 权限检查
    const authStore = useAuthStore()
    if (!authStore.isAdmin && !authStore.isTeacher) {
      ElMessage.error('权限不足：只有管理员和教师可以录入成绩')
      throw new Error('权限不足')
    }
    
    try {
      // 移除学期参数，只发送必要的字段
      const gradeData = {
        studentId: data.studentId,
        courseId: data.courseId,
        score: data.score
      }
      
      const grade = await createGrade(gradeData)
      ElMessage.success('成绩录入成功')
      return grade
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      error.message || 
                      '成绩录入失败'
      
      // 如果是成绩已存在的错误，创建特殊错误对象便于上层识别
      if (errorMsg.includes('already exists') || errorMsg.includes('已存在') || error.response?.status === 409) {
        // 创建一个特殊的错误对象，便于上层识别并自动处理
        const specialError = new Error(errorMsg) as any
        specialError.response = error.response
        specialError.isDuplicateError = true
        throw specialError
      }
      
      ElMessage.error(`成绩录入失败: ${errorMsg}`)
      throw error
    }
  }

  // 更新成绩
  const updateGradeInfo = async (id: string, data: Partial<GradeFormData>) => {
    // 权限检查
    const authStore = useAuthStore()
    if (!authStore.isAdmin && !authStore.isTeacher) {
      ElMessage.error('权限不足：只有管理员和教师可以更新成绩')
      throw new Error('权限不足')
    }
    
    try {
      // 移除学期参数，只发送必要的字段
      const updateData = {
        score: data.score
      }
      
      const grade = await updateGrade(id, updateData)
      ElMessage.success('成绩更新成功')
      return grade
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || '成绩更新失败'
      ElMessage.error(`成绩更新失败: ${errorMsg}`)
      throw error
    }
  }

  // 删除成绩
  const removeGrade = async (id: string, silent: boolean = false) => {
    // 权限检查
    const authStore = useAuthStore()
    if (!authStore.isAdmin && !authStore.isTeacher) {
      ElMessage.error('权限不足：只有管理员和教师可以删除成绩')
      throw new Error('权限不足')
    }
    
    try {
      await deleteGrade(id)
      if (!silent) {
        ElMessage.success('成绩删除成功')
      }
      // 从列表中移除
      grades.value = grades.value.filter(g => g.id !== id)
    } catch (error) {
      if (!silent) {
        ElMessage.error('成绩删除失败')
      }
      throw error
    }
  }



  // 批量导入
  const importGradesData = async (data: { studentId: string; courseId: string; score: number }[]) => {
    // 权限检查
    const authStore = useAuthStore()
    if (!authStore.isAdmin && !authStore.isTeacher) {
      ElMessage.error('权限不足：只有管理员和教师可以批量导入成绩')
      throw new Error('权限不足')
    }
    
    loading.value = true
    try {
      const result = await importGrades(data)
      if (result.failed > 0) {
        ElMessage.warning(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
      } else {
        ElMessage.success(`成功导入 ${result.success} 条数据`)
      }
      return result
    } catch (error) {
      ElMessage.error('导入失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 导出成绩数据
  const exportGradesData = async (params: GradeListParams = {}) => {
    try {
      // 根据用户角色设置请求头参数
      const authStore = useAuthStore()
      const headers: Record<string, string> = {}
      
      // 如果是学生，只能导出自己的成绩
      if (authStore.isStudent && authStore.user?.studentId) {
        headers['X-Query-StudentId'] = authStore.user.studentId
      }
      
      const blob = await exportGradesWithHeaders(params, headers)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `成绩数据_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    } catch (error) {
      ElMessage.error('导出失败')
      throw error
    }
  }

  // 导出成绩数据为指定格式
  const exportGradesAsFormat = async (params: GradeListParams = {}, format: 'json' | 'csv' | 'excel' = 'json') => {
    try {
      // 根据用户角色设置请求头参数
      const authStore = useAuthStore()
      const headers: Record<string, string> = {}
      
      // 如果是学生，只能导出自己的成绩
      if (authStore.isStudent && authStore.user?.studentId) {
        headers['X-Query-StudentId'] = authStore.user.studentId
      }
      
      const blob = await exportGradesAsFormat(params, format, headers)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      let fileName = ''
      let extension = ''
      
      switch (format) {
        case 'json':
          extension = 'json'
          break
        case 'csv':
          extension = 'csv'
          break
        case 'excel':
          extension = 'xlsx'
          break
      }
      
      fileName = `成绩数据_${new Date().toISOString().split('T')[0]}.${extension}`
      
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success(`成绩数据已导出为 ${format.toUpperCase()} 格式`)
    } catch (error) {
      ElMessage.error('导出失败')
      throw error
    }
  }

  // 获取课程成绩列表
  const fetchCourseGrades = async (courseId: string, semester?: string) => {
    try {
      const data = await getCourseGrades(courseId, semester)
      return data
    } catch (error) {
      ElMessage.error('获取课程成绩失败')
      throw error
    }
  }

  // 获取学生成绩概览
  const fetchStudentGrades = async (studentId: string) => {
    // 权限检查：学生只能查看自己的成绩
    const authStore = useAuthStore()
    if (authStore.isStudent && authStore.user?.studentId !== studentId) {
      ElMessage.error('权限不足：只能查看自己的成绩')
      throw new Error('权限不足')
    }
    
    try {
      const data = await getStudentGrades(studentId)
      return data
    } catch (error) {
      ElMessage.error('获取学生成绩概览失败')
      throw error
    }
  }

  // 批量更新成绩
  const batchUpdate = async (data: BatchGradeData) => {
    // 权限检查
    const authStore = useAuthStore()
    if (!authStore.isAdmin && !authStore.isTeacher) {
      ElMessage.error('权限不足：只有管理员和教师可以批量更新成绩')
      throw new Error('权限不足')
    }
    
    loading.value = true
    try {
      const result = await batchUpdateGrades(data)
      if (result.failed > 0) {
        ElMessage.warning(`更新完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
      } else {
        ElMessage.success(`成功更新 ${result.success} 条数据`)
      }
      return result
    } catch (error) {
      ElMessage.error('批量更新失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 清空数据
  const clearData = () => {
    grades.value = []
    courseGrades.value = []
    total.value = 0
  }

  return {
    grades,
    courseGrades,
    total,
    loading,
    fetchGrades,
    addGrade,
    updateGradeInfo,
    removeGrade,
    importGradesData,
    exportGradesData,
    fetchCourseGrades,
    fetchStudentGrades,
    batchUpdate,
    clearData
  }
})