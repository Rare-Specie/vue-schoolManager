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
  // 过滤掉undefined和null值
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  )
  
  return request.get('/reports/report-card', {
    params: cleanParams,
    responseType: 'blob'
  })
}

// 生成统计报表
export const getStatisticalReport = (params: StatisticalReportParams): Promise<Blob> => {
  // 过滤掉undefined和null值
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== '')
  )
  
  return request.get('/reports/statistics', {
    params: cleanParams,
    responseType: 'blob'
  })
}

// 打印准备
export const preparePrint = (data: PrintData): Promise<{ html: string }> => {
  // 过滤掉undefined和null值
  const cleanData = {
    type: data.type,
    data: data.data
  }
  
  return request.post('/reports/print', cleanData)
}

// 批量打印
export const batchPrint = (data: {
  type: string
  items: any[]
}): Promise<{ success: number; failed: number }> => {
  // 过滤掉undefined和null值
  const cleanData = {
    type: data.type,
    items: data.items.filter(item => item != null)
  }
  
  return request.post('/reports/batch-print', cleanData)
}