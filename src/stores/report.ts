import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getReportCard,
  getStatisticalReport,
  preparePrint,
  batchPrint,
  type ReportCardParams,
  type StatisticalReportParams,
  type PrintData
} from './api/report'
import { ElMessage } from 'element-plus'

export const useReportStore = defineStore('report', () => {
  const loading = ref(false)

  // 生成成绩单
  const generateReportCard = async (params: ReportCardParams) => {
    loading.value = true
    try {
      const blob = await getReportCard(params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const fileName = params.studentId 
        ? `成绩单_${params.studentId}_${new Date().toISOString().split('T')[0]}.pdf`
        : `班级成绩单_${params.class || 'all'}_${new Date().toISOString().split('T')[0]}.pdf`
      
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('成绩单生成成功')
      return blob
    } catch (error) {
      ElMessage.error('成绩单生成失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 生成统计报表
  const generateStatisticalReport = async (params: StatisticalReportParams) => {
    loading.value = true
    try {
      const blob = await getStatisticalReport(params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      const format = params.format === 'pdf' ? 'pdf' : 'xlsx'
      const fileName = `统计报表_${params.type}_${new Date().toISOString().split('T')[0]}.${format}`
      
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('统计报表生成成功')
      return blob
    } catch (error) {
      ElMessage.error('统计报表生成失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 准备打印
  const preparePrintData = async (data: PrintData) => {
    loading.value = true
    try {
      const result = await preparePrint(data)
      return result
    } catch (error) {
      ElMessage.error('打印准备失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 批量打印
  const executeBatchPrint = async (data: { type: string; items: any[] }) => {
    loading.value = true
    try {
      const result = await batchPrint(data)
      if (result.failed > 0) {
        ElMessage.warning(`打印完成：成功 ${result.success} 项，失败 ${result.failed} 项`)
      } else {
        ElMessage.success(`成功打印 ${result.success} 项`)
      }
      return result
    } catch (error) {
      ElMessage.error('批量打印失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 在浏览器中预览PDF
  const previewPDF = async (params: ReportCardParams) => {
    loading.value = true
    try {
      const blob = await getReportCard(params)
      const url = window.URL.createObjectURL(blob)
      
      // 打开新窗口预览
      const previewWindow = window.open(url, '_blank')
      if (!previewWindow) {
        ElMessage.error('无法打开预览窗口，请检查浏览器设置')
      }
      
      return url
    } catch (error) {
      ElMessage.error('预览失败')
      throw error
    } finally {
      loading.value = false
    }
  }

  // 打印HTML内容
  const printHTML = (html: string, title: string = '打印预览') => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      ElMessage.error('无法打开打印窗口，请检查浏览器设置')
      return
    }

    const styles = `
      <style>
        body { 
          font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif; 
          padding: 20px; 
          margin: 0;
        }
        @media print {
          body { padding: 10mm; }
          .no-print { display: none !important; }
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
          font-size: 12px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: center; 
        }
        th { 
          background-color: #f2f2f2; 
          font-weight: bold; 
        }
        h1, h2, h3 { 
          text-align: center; 
          color: #333; 
        }
        .header-info {
          margin-bottom: 20px;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 4px;
        }
        .print-actions {
          text-align: center;
          margin: 20px 0;
          padding: 10px;
        }
        .print-actions button {
          padding: 8px 16px;
          margin: 0 5px;
          cursor: pointer;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
        }
        .print-actions button:hover {
          background: #f5f5f5;
        }
        .print-actions button.primary {
          background: #409EFF;
          color: white;
          border-color: #409EFF;
        }
      </style>
    `

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - 打印预览</title>
          ${styles}
        </head>
        <body>
          <div class="print-actions no-print">
            <button onclick="window.print()" class="primary">打印</button>
            <button onclick="window.close()">关闭</button>
          </div>
          ${html}
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
  }

  return {
    loading,
    generateReportCard,
    generateStatisticalReport,
    preparePrintData,
    executeBatchPrint,
    previewPDF,
    printHTML
  }
})