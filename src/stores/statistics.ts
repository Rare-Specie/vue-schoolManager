import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getOverviewStats,
  getClassStats,
  getCourseStats,
  getRanking,
  getDistribution,
  generateReport,
  type OverviewStats,
  type ClassStats,
  type CourseStats,
  type RankingItem,
  type DistributionItem,
  type ClassStatsParams,
  type CourseStatsParams,
  type RankingParams,
  type DistributionParams,
  type ReportParams
} from './api/statistics'
import { getGrades, type Grade, type GradeListParams } from './api/grade'
import { ElMessage } from 'element-plus'

export const useStatisticsStore = defineStore('statistics', () => {
  const overview = ref<OverviewStats | null>(null)
  const classStats = ref<ClassStats[]>([])
  const courseStats = ref<CourseStats | null>(null)
  const ranking = ref<RankingItem[]>([])
  const distribution = ref<DistributionItem[]>([])
  const classDetail = ref<Grade[]>([])
  const loading = ref(false)

  // 获取统计概览
  const fetchOverviewStats = async () => {
    loading.value = true
    try {
      const data = await getOverviewStats()
      overview.value = data
      return data
    } catch (error) {
      ElMessage.error('获取统计概览失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取班级统计
  const fetchClassStats = async (params: ClassStatsParams = {}) => {
    loading.value = true
    try {
      const data = await getClassStats(params)
      classStats.value = data
      return data
    } catch (error) {
      ElMessage.error('获取班级统计失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取课程统计
  const fetchCourseStats = async (params: CourseStatsParams) => {
    loading.value = true
    try {
      const data = await getCourseStats(params)
      courseStats.value = data
      return data
    } catch (error) {
      ElMessage.error('获取课程统计失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取排名列表
  const fetchRanking = async (params: RankingParams = {}) => {
    loading.value = true
    try {
      const data = await getRanking(params)
      ranking.value = data
      return data
    } catch (error) {
      ElMessage.error('获取排名列表失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取成绩分布
  const fetchDistribution = async (params: DistributionParams = {}) => {
    loading.value = true
    try {
      const data = await getDistribution(params)
      distribution.value = data
      return data
    } catch (error) {
      ElMessage.error('获取成绩分布失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 生成统计报表
  const generateStatReport = async (params: ReportParams) => {
    loading.value = true
    try {
      const blob = await generateReport(params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const fileName = `统计报表_${params.type}_${new Date().toISOString().split('T')[0]}.${params.format === 'pdf' ? 'pdf' : 'xlsx'}`
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('报表生成成功')
      return blob
    } catch (error) {
      ElMessage.error('报表生成失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取班级成绩详情
  const fetchClassDetail = async (className: string) => {
    loading.value = true
    try {
      const response = await getGrades({ 
        class: className,
        page: 1,
        limit: 1000  // 获取足够多的数据，确保覆盖该班级所有成绩
      })
      classDetail.value = response.data
      return response.data
    } catch (error) {
      ElMessage.error('获取班级详情失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 清空数据
  const clearData = () => {
    overview.value = null
    classStats.value = []
    courseStats.value = null
    ranking.value = []
    distribution.value = []
    classDetail.value = []
  }

  return {
    overview,
    classStats,
    courseStats,
    ranking,
    distribution,
    classDetail,
    loading,
    fetchOverviewStats,
    fetchClassStats,
    fetchCourseStats,
    fetchRanking,
    fetchDistribution,
    fetchClassDetail,
    generateStatReport,
    clearData
  }
})