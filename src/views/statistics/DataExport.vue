<template>
  <div class="data-export-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>数据导出</span>
        </div>
      </template>
      
      <div class="export-content">
        <!-- 数据类型选择 -->
        <el-card class="section-card" shadow="hover">
          <template #header>
            <div class="section-header">
              <span>1. 选择导出数据类型</span>
            </div>
          </template>
          
          <el-radio-group v-model="exportForm.dataType" size="large" @change="handleDataTypeChange">
            <el-radio-button label="students">学生信息</el-radio-button>
            <el-radio-button label="courses">课程信息</el-radio-button>
            <el-radio-button label="grades">学生成绩</el-radio-button>
          </el-radio-group>
        </el-card>

        <!-- 筛选条件 -->
        <el-card class="section-card" shadow="hover" v-if="exportForm.dataType">
          <template #header>
            <div class="section-header">
              <span>2. 设置筛选条件</span>
            </div>
          </template>
          
          <el-form :model="exportForm" label-width="100px" class="filter-form">
            <!-- 学生筛选条件 -->
            <el-form-item label="班级" v-if="exportForm.dataType === 'students' || exportForm.dataType === 'grades'">
              <el-input
                v-model="exportForm.class"
                placeholder="请输入班级名称（可选）"
                clearable
                @clear="handleFilterChange"
              />
            </el-form-item>

            <!-- 课程筛选条件 -->
            <el-form-item label="课程" v-if="exportForm.dataType === 'grades'">
              <el-select
                v-model="exportForm.courseId"
                placeholder="请选择课程（可选）"
                filterable
                clearable
                style="width: 100%"
                @change="handleFilterChange"
              >
                <el-option
                  v-for="course in courseOptions"
                  :key="course.id"
                  :label="course.name"
                  :value="course.id"
                />
              </el-select>
            </el-form-item>

            <!-- 学生学号筛选 -->
            <el-form-item label="学号" v-if="exportForm.dataType === 'grades'">
              <el-input
                v-model="exportForm.studentId"
                placeholder="请输入学号（可选）"
                clearable
                @clear="handleFilterChange"
              />
            </el-form-item>

            <!-- 搜索关键字 -->
            <el-form-item label="搜索" v-if="exportForm.dataType !== 'grades'">
              <el-input
                v-model="exportForm.search"
                placeholder="请输入搜索关键字（可选）"
                clearable
                @clear="handleFilterChange"
              />
            </el-form-item>

            <!-- 成绩时间范围 -->
            <el-form-item label="时间范围" v-if="exportForm.dataType === 'grades'">
              <el-date-picker
                v-model="exportForm.timeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="handleFilterChange"
              />
            </el-form-item>
          </el-form>

          <div class="filter-actions">
            <el-button @click="resetFilters" :icon="Refresh">重置筛选</el-button>
            <el-button type="success" @click="previewData" :icon="Search" :loading="loading.preview">
              应用并预览数据
            </el-button>
          </div>
        </el-card>

        <!-- 导出格式选择 -->
        <el-card class="section-card" shadow="hover" v-if="exportForm.dataType">
          <template #header>
            <div class="section-header">
              <span>3. 选择导出格式</span>
            </div>
          </template>
          
          <el-radio-group v-model="exportForm.format" size="large">
            <el-radio-button label="json">JSON</el-radio-button>
            <el-radio-button label="csv">CSV</el-radio-button>
            <el-radio-button label="excel">Excel</el-radio-button>
          </el-radio-group>

          <div class="format-hint">
            <el-alert
              v-if="exportForm.format === 'json'"
              type="info"
              :closable="false"
              description="JSON格式：适合程序处理，保留完整数据结构"
            />
            <el-alert
              v-if="exportForm.format === 'csv'"
              type="info"
              :closable="false"
              description="CSV格式：适合Excel导入，纯文本表格格式"
            />
            <el-alert
              v-if="exportForm.format === 'excel'"
              type="info"
              :closable="false"
              description="Excel格式：适合直接用Excel打开，包含格式信息"
            />
          </div>
        </el-card>

        <!-- 数据预览 -->
        <el-card class="section-card" shadow="hover" v-if="previewDataList.length > 0">
          <template #header>
            <div class="section-header">
              <span>数据预览 (前 {{ Math.min(5, previewDataList.length) }} 条)</span>
              <span class="count">共 {{ previewTotal }} 条记录</span>
            </div>
          </template>
          
          <el-table :data="previewDataList.slice(0, 5)" border stripe max-height="300">
            <template v-if="exportForm.dataType === 'students'">
              <el-table-column prop="studentId" label="学号" width="120" />
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="class" label="班级" width="120" />
              <el-table-column prop="gender" label="性别" width="80">
                <template #default="{ row }">
                  {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="phone" label="电话" />
              <el-table-column prop="email" label="邮箱" />
            </template>

            <template v-if="exportForm.dataType === 'courses'">
              <el-table-column prop="courseId" label="课程编号" width="120" />
              <el-table-column prop="name" label="课程名称" min-width="150" />
              <el-table-column prop="credit" label="学分" width="80" align="center" />
              <el-table-column prop="teacher" label="教师" width="120" />
              <el-table-column prop="description" label="描述" />
            </template>

            <template v-if="exportForm.dataType === 'grades'">
              <el-table-column prop="studentId" label="学号" width="100" />
              <el-table-column prop="studentName" label="姓名" width="100" />
              <el-table-column prop="courseName" label="课程" min-width="150" />
              <el-table-column prop="score" label="成绩" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="getScoreTagType(row.score)" effect="dark">
                    {{ row.score }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="录入时间" width="160" align="center">
                <template #default="{ row }">
                  {{ formatDate(row.createdAt) }}
                </template>
              </el-table-column>
            </template>
          </el-table>
        </el-card>

        <!-- 导出操作 -->
        <div class="export-actions" v-if="exportForm.dataType">
          <el-button
            type="success"
            size="large"
            @click="handleExport"
            :icon="Download"
            :loading="loading.export"
            :disabled="previewTotal === 0"
          >
            导出数据
          </el-button>
          <el-button
            size="large"
            @click="clearAll"
            :icon="Delete"
          >
            清空
          </el-button>
        </div>

        <!-- 导出进度 -->
        <el-dialog
          v-model="exportDialog.visible"
          title="导出进度"
          width="400px"
          :show-close="false"
          :close-on-click-modal="false"
          :close-on-press-escape="false"
        >
          <div class="progress-content">
            <el-progress
              type="circle"
              :percentage="exportDialog.progress"
              :status="exportDialog.status"
              :stroke-width="10"
              style="margin: 20px 0;"
            />
            <div class="progress-text">
              <p>{{ exportDialog.message }}</p>
              <p v-if="exportDialog.details" class="details">{{ exportDialog.details }}</p>
            </div>
          </div>
          <template #footer>
            <el-button
              v-if="exportDialog.status === 'success' || exportDialog.status === 'exception'"
              type="primary"
              @click="closeExportDialog"
            >
              确定
            </el-button>
          </template>
        </el-dialog>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useStudentStore } from '@/stores/student'
import { useCourseStore } from '@/stores/course'
import { useGradeStore } from '@/stores/grade'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download, Refresh, Delete } from '@element-plus/icons-vue'

const studentStore = useStudentStore()
const courseStore = useCourseStore()
const gradeStore = useGradeStore()
const authStore = useAuthStore()

// 导出表单数据
const exportForm = reactive({
  dataType: '' as 'students' | 'courses' | 'grades' | '',
  studentId: '',
  courseId: '',
  class: '',
  search: '',
  timeRange: [] as string[],
  format: 'json' as 'json' | 'csv' | 'excel'
})

// 加载状态
const loading = reactive({
  preview: false,
  export: false
})

// 预览数据
const previewDataList = ref<any[]>([])
const previewTotal = ref(0)

// 导出对话框
const exportDialog = reactive({
  visible: false,
  progress: 0,
  status: '' as 'success' | 'exception' | '',
  message: '',
  details: ''
})

// 课程选项
const courseOptions = computed(() => courseStore.courses)

// 加载课程列表
const loadCourses = async () => {
  try {
    await courseStore.fetchCourses({ page: 1, limit: 100 })
  } catch (error) {
    console.warn('加载课程列表失败:', error)
  }
}

// 数据类型切换时的处理
const handleDataTypeChange = () => {
  // 清空预览数据
  previewDataList.value = []
  previewTotal.value = 0
  
  // 重置筛选条件
  exportForm.studentId = ''
  exportForm.courseId = ''
  exportForm.class = ''
  exportForm.search = ''
  exportForm.timeRange = []
  
  // 如果是学生角色且选择成绩导出，自动填充学号
  if (exportForm.dataType === 'grades' && authStore.isStudent && authStore.user?.studentId) {
    exportForm.studentId = authStore.user.studentId
  }
}

// 筛选条件变化
const handleFilterChange = () => {
  // 清空预览数据，需要重新预览
  previewDataList.value = []
  previewTotal.value = 0
}

// 重置筛选
const resetFilters = () => {
  exportForm.studentId = ''
  exportForm.courseId = ''
  exportForm.class = ''
  exportForm.search = ''
  exportForm.timeRange = []
  previewDataList.value = []
  previewTotal.value = 0
}

// 预览数据
const previewData = async () => {
  if (!exportForm.dataType) {
    ElMessage.warning('请先选择导出数据类型')
    return
  }

  loading.preview = true
  try {
    const params = buildParams()
    let data: any[] = []

    switch (exportForm.dataType) {
      case 'students':
        const studentsResponse = await studentStore.fetchStudents(params)
        data = studentsResponse.data
        break

      case 'courses':
        const coursesResponse = await courseStore.fetchCourses(params)
        data = coursesResponse.data
        break

      case 'grades':
        const gradesResponse = await gradeStore.fetchGrades(params)
        data = gradesResponse.data
        
        // 获取成绩数据后，为每条记录获取学生的班级信息
        if (data.length > 0) {
          try {
            // 提取所有唯一的学号
            const studentIds = [...new Set(data.map(g => g.studentId))]
            
            // 批量获取学生信息
            const studentsResponse = await studentStore.fetchStudents({
              page: 1,
              limit: 1000
            })
            
            // 创建学号到班级的映射
            const studentClassMap = new Map()
            studentsResponse.data.forEach(student => {
              if (studentIds.includes(student.studentId)) {
                studentClassMap.set(student.studentId, student.class)
              }
            })
            
            // 为成绩数据添加班级信息
            data = data.map(grade => ({
              ...grade,
              class: studentClassMap.get(grade.studentId) || '-'
            }))
          } catch (error) {
            console.warn('获取学生班级信息失败:', error)
            data = data.map(grade => ({
              ...grade,
              class: '-'
            }))
          }
        }
        break
    }

    previewDataList.value = data
    previewTotal.value = data.length

    if (data.length === 0) {
      ElMessage.info('当前筛选条件下无数据')
    } else {
      ElMessage.success(`找到 ${data.length} 条记录，可预览前5条`)
    }
  } catch (error) {
    ElMessage.error('预览数据失败')
    console.error('预览错误:', error)
  } finally {
    loading.preview = false
  }
}

// 构建请求参数
const buildParams = () => {
  const params: any = {
    page: 1,
    limit: 1000 // 获取大量数据用于导出
  }

  if (exportForm.dataType === 'students') {
    if (exportForm.class) params.class = exportForm.class
    if (exportForm.search) params.search = exportForm.search
  } else if (exportForm.dataType === 'courses') {
    if (exportForm.search) params.search = exportForm.search
  } else if (exportForm.dataType === 'grades') {
    if (exportForm.studentId) params.studentId = exportForm.studentId
    if (exportForm.courseId) {
      // 查找课程，获取课程编号
      const course = courseStore.courses.find(c => c.id === exportForm.courseId)
      if (course) {
        params.courseId = course.courseId
      }
    }
    if (exportForm.class) params.class = exportForm.class
    if (exportForm.timeRange && exportForm.timeRange.length === 2) {
      params.startTime = exportForm.timeRange[0]
      params.endTime = exportForm.timeRange[1]
    }
  }

  return params
}

// 执行导出
const handleExport = async () => {
  if (!exportForm.dataType) {
    ElMessage.warning('请先选择导出数据类型')
    return
  }

  if (previewTotal.value === 0) {
    ElMessage.warning('没有数据可导出，请先预览数据')
    return
  }

  // 确认导出
  try {
    await ElMessageBox.confirm(
      `确定要导出 ${previewTotal.value} 条${getDataTypeName()}数据为 ${exportForm.format.toUpperCase()} 格式吗？`,
      '确认导出',
      { type: 'info' }
    )
  } catch (cancel) {
    return
  }

  loading.export = true
  exportDialog.visible = true
  exportDialog.progress = 0
  exportDialog.status = ''
  exportDialog.message = '正在准备导出数据...'
  exportDialog.details = ''

  try {
    // 模拟进度更新
    const progressInterval = setInterval(() => {
      if (exportDialog.progress < 80) {
        exportDialog.progress += 10
      }
    }, 200)

    const params = buildParams()

    switch (exportForm.dataType) {
      case 'students':
        exportDialog.message = '正在导出学生数据...'
        await studentStore.exportStudentsAsFormat({
          class: exportForm.class,
          search: exportForm.search,
          format: exportForm.format
        })
        break

      case 'courses':
        exportDialog.message = '正在导出课程数据...'
        await courseStore.exportCoursesAsFormat({
          search: exportForm.search,
          format: exportForm.format
        })
        break

      case 'grades':
        exportDialog.message = '正在导出成绩数据...'
        await gradeStore.exportGradesAsFormat(params, exportForm.format)
        break
    }

    clearInterval(progressInterval)
    exportDialog.progress = 100
    exportDialog.status = 'success'
    exportDialog.message = '导出成功！'
    exportDialog.details = `已导出 ${previewTotal.value} 条${getDataTypeName()}数据`

    ElMessage.success('数据导出成功')
  } catch (error) {
    exportDialog.status = 'exception'
    exportDialog.message = '导出失败'
    exportDialog.details = '请检查网络连接或稍后重试'
    ElMessage.error('数据导出失败')
    console.error('导出错误:', error)
  } finally {
    loading.export = false
  }
}

// 关闭导出对话框
const closeExportDialog = () => {
  exportDialog.visible = false
}

// 清空所有
const clearAll = () => {
  exportForm.dataType = ''
  exportForm.studentId = ''
  exportForm.courseId = ''
  exportForm.class = ''
  exportForm.search = ''
  exportForm.timeRange = []
  exportForm.format = 'json'
  previewDataList.value = []
  previewTotal.value = 0
}

// 辅助函数：获取数据类型名称
const getDataTypeName = () => {
  switch (exportForm.dataType) {
    case 'students': return '学生'
    case 'courses': return '课程'
    case 'grades': return '成绩'
    default: return ''
  }
}

// 辅助函数：获取成绩标签类型
const getScoreTagType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 辅助函数：格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 组件挂载时加载课程列表
onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.data-export-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.main-card {
  height: 100%;
  min-height: 600px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.export-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  margin-bottom: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #303133;
}

.section-header .count {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

.filter-form {
  margin-top: 10px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  justify-content: flex-end;
}

.format-hint {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.progress-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.progress-text {
  text-align: center;
  margin-top: 10px;
}

.progress-text p {
  margin: 5px 0;
  font-size: 14px;
  color: #606266;
}

.progress-text .details {
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .data-export-container {
    padding: 10px;
  }
  
  .export-actions {
    flex-direction: column;
  }
  
  .filter-actions {
    flex-direction: column;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
</style>