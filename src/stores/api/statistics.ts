import request from './request'

export interface OverviewStats {
  avgScore: number
  passRate: number
  totalStudents: number
  totalCourses: number
  totalGrades: number
}

export interface ClassStatsParams {
  class?: string
  courseId?: string
}

export interface ClassStats {
  class: string
  avgScore: number
  passRate: number
  totalStudents: number
  topStudents: Array<{ name: string; score: number; studentId: string }>
}

export interface CourseStatsParams {
  courseId: string
}

export interface CourseStats {
  courseId: string
  courseName: string
  avgScore: number
  passRate: number
  totalStudents: number
  highestScore: number
  lowestScore: number
}

export interface RankingParams {
  class?: string
  courseId?: string
  limit?: number
}

export interface RankingItem {
  rank: number
  studentId: string
  name: string
  class: string
  totalScore: number
  avgScore: number
  courseCount: number
}

export interface DistributionParams {
  courseId?: string
  class?: string
}

export interface DistributionItem {
  range: string
  count: number
  percentage: number
}

export interface ReportParams {
  type: 'class' | 'course' | 'student'
  format: 'pdf' | 'excel'
  class?: string
  courseId?: string
  studentId?: string
  semester?: string
}

// 获取统计概览
export const getOverviewStats = (): Promise<OverviewStats> => {
  return request.get('/statistics/overview')
}

// 按班级统计
export const getClassStats = (params: ClassStatsParams = {}): Promise<ClassStats[]> => {
  return request.get('/statistics/class', { params })
}

// 按课程统计
export const getCourseStats = (params: CourseStatsParams): Promise<CourseStats> => {
  return request.get('/statistics/course', { params })
}

// 获取排名列表
export const getRanking = (params: RankingParams = {}): Promise<RankingItem[]> => {
  return request.get('/statistics/ranking', { params })
}

// 获取成绩分布
export const getDistribution = (params: DistributionParams = {}): Promise<DistributionItem[]> => {
  return request.get('/statistics/distribution', { params })
}

// 生成统计报表
export const generateReport = (params: ReportParams): Promise<any> => {
  return request.get('/statistics/report', {
    params
  })
}