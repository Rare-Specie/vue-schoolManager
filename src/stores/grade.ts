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
  type Grade,
  type GradeListParams,
  type GradeFormData,
  type BatchGradeData
} from './api/grade'
import { ElMessage } from 'element-plus'

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
    try {
      const grade = await createGrade(data)
      ElMessage.success('成绩录入成功')
      return grade
    } catch (error) {
      ElMessage.error('成绩录入失败')
      throw error
    }
  }

  // 更新成绩
  const updateGradeInfo = async (id: string, data: Partial<GradeFormData>) => {
    try {
      const grade = await updateGrade(id, data)
      ElMessage.success('成绩更新成功')
      return grade
    } catch (error) {
      ElMessage.error('成绩更新失败')
      throw error
    }
  }

  // 删除成绩
  const removeGrade = async (id: string) => {
    try {
      await deleteGrade(id)
      ElMessage.success('成绩删除成功')
      // 从列表中移除
      grades.value = grades.value.filter(g => g.id !== id)
    } catch (error) {
      ElMessage.error('成绩删除失败')
      throw error
    }
  }

  // 批量导入
  const importGradesData = async (data: { studentId: string; courseId: string; score: number; semester?: string }[]) => {
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
      const blob = await exportGrades(params)
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

  // 获取课程成绩列表
  const fetchCourseGrades = async (courseId: string, semester?: string) => {
    loading.value = true
    try {
      const data = await getCourseGrades(courseId, semester)
      courseGrades.value = data
      return data
    } catch (error) {
      ElMessage.error('获取课程成绩失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 批量更新成绩
  const batchUpdate = async (data: BatchGradeData) => {
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
    batchUpdate,
    clearData
  }
})