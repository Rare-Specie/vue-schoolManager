import request from './request'

export interface ReportCardParams {
  studentId?: string
  class?: string
  semester?: string
}

export interface StatisticalReportParams {
  type: 'class' | 'course' | 'student' | 'overall'
  format: 'pdf' | 'excel'
  class?: string
  courseId?: string
  studentId?: string
  semester?: string
  startTime?: string
  endTime?: string
}

export interface PrintData {
  type: string
  data: any
}

// 生成成绩单
export const getReportCard = (params: ReportCardParams): Promise<Blob> => {
  return request.get('/reports/report-card', {
    params,
    responseType: 'blob'
  })
}

// 生成统计报表
export const getStatisticalReport = (params: StatisticalReportParams): Promise<Blob> => {
  return request.get('/reports/statistics', {
    params,
    responseType: 'blob'
  })
}

// 打印准备
export const preparePrint = (data: PrintData): Promise<{ html: string }> => {
  return request.post('/reports/print', data)
}

// 批量打印
export const batchPrint = (data: {
  type: string
  items: any[]
}): Promise<{ success: number; failed: number }> => {
  return request.post('/reports/batch-print', data)
}