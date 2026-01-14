import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getStudents,
  getStudentDetail,
  createStudent,
  updateStudent,
  deleteStudent,
  importStudents,
  exportStudents,
  exportStudentsAsFormat,
  getStudentGradesOverview,
  type Student,
  type StudentListParams,
  type StudentFormData
} from './api/student'
import { ElMessage } from 'element-plus'

export const useStudentStore = defineStore('student', () => {
  const students = ref<Student[]>([])
  const currentStudent = ref<Student | null>(null)
  const total = ref(0)
  const loading = ref(false)
  const detailLoading = ref(false)

  // 获取学生列表
  const fetchStudents = async (params: StudentListParams = {}) => {
    loading.value = true
    try {
      const response = await getStudents(params)
      students.value = response.data
      total.value = response.total
      return response
    } catch (error) {
      ElMessage.error('获取学生列表失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取学生详情
  const fetchStudentDetail = async (id: string) => {
    detailLoading.value = true
    try {
      const student = await getStudentDetail(id)
      currentStudent.value = student
      return student
    } catch (error) {
      ElMessage.error('获取学生详情失败')
      throw error
    } finally {
      detailLoading.value = false
    }
  }

  // 添加学生
  const addStudent = async (data: StudentFormData) => {
    try {
      const student = await createStudent(data)
      ElMessage.success('学生添加成功')
      return student
    } catch (error) {
      ElMessage.error('学生添加失败')
      throw error
    }
  }

  // 更新学生
  const updateStudentInfo = async (id: string, data: Partial<StudentFormData>) => {
    try {
      const student = await updateStudent(id, data)
      ElMessage.success('学生信息更新成功')
      return student
    } catch (error) {
      ElMessage.error('学生信息更新失败')
      throw error
    }
  }

  // 删除学生
  const removeStudent = async (id: string) => {
    try {
      await deleteStudent(id)
      ElMessage.success('学生删除成功')
      // 从列表中移除
      students.value = students.value.filter(s => s.id !== id)
    } catch (error) {
      ElMessage.error('学生删除失败')
      throw error
    }
  }

  // 批量导入
  const importStudentsData = async (data: { studentId: string; name: string; class: string; gender?: 'male' | 'female'; phone?: string; email?: string }[]) => {
    loading.value = true
    try {
      // 过滤掉空值和undefined
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

      const result = await importStudents(cleanData)
      
      if (result.failed > 0) {
        const message = `导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`
        if (result.message) {
          ElMessage.warning(`${message}\n${result.message}`)
        } else {
          ElMessage.warning(message)
        }
      } else {
        ElMessage.success(`成功导入 ${result.success} 条数据`)
      }
      
      return result
    } catch (error: any) {
      console.error('导入错误:', error)
      const errorMessage = error.response?.data?.message || error.message || '导入失败'
      ElMessage.error(`导入失败：${errorMessage}`)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 导出学生数据
  const exportStudentsData = async () => {
    try {
      const blob = await exportStudents()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `学生数据_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    } catch (error) {
      ElMessage.error('导出失败')
      throw error
    }
  }

  // 导出学生数据为指定格式
  const exportStudentsAsFormat = async (params: { class?: string; search?: string; format?: 'json' | 'csv' | 'excel' } = {}) => {
    try {
      const blob = await exportStudentsAsFormat(params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      let fileName = ''
      let extension = ''
      
      switch (params.format || 'json') {
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
      
      fileName = `学生数据_${new Date().toISOString().split('T')[0]}.${extension}`
      
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success(`学生数据已导出为 ${(params.format || 'json').toUpperCase()} 格式`)
    } catch (error) {
      ElMessage.error('导出失败')
      throw error
    }
  }

  // 获取学生成绩概览（参数为 studentId 即学号）
  const fetchStudentGradesOverview = async (studentId?: string) => {
    // 防御：若学生未绑定学号，则提前返回 null 并显示提示（符合 Gen4 的行为）
    if (!studentId) {
      ElMessage.warning('该学生未绑定学号，无法查看成绩概览')
      return null
    }

    try {
      const overview = await getStudentGradesOverview(studentId)
      return overview
    } catch (error) {
      ElMessage.error('获取成绩概览失败')
      throw error
    }
  }

  // 清空当前学生
  const clearCurrentStudent = () => {
    currentStudent.value = null
  }

  return {
    students,
    currentStudent,
    total,
    loading,
    detailLoading,
    fetchStudents,
    fetchStudentDetail,
    addStudent,
    updateStudentInfo,
    removeStudent,
    importStudentsData,
    exportStudentsData,
    fetchStudentGradesOverview,
    clearCurrentStudent
  }
})