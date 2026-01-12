<template>
  <div class="statistical-reports-container">
    <!-- 选择条件 -->
    <el-card class="select-card">
      <el-form :model="selectForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="报表类型">
              <el-select v-model="selectForm.type" placeholder="选择类型" style="width: 100%">
                <el-option label="班级统计" value="class" />
                <el-option label="课程统计" value="course" />
                <el-option label="学生统计" value="student" />
                <el-option label="总体统计" value="overall" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="输出格式">
              <el-radio-group v-model="selectForm.format">
                <el-radio label="pdf">PDF</el-radio>
                <el-radio label="excel">Excel</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学期">
              <el-input
                v-model="selectForm.semester"
                placeholder="学期（可选）"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8" v-if="selectForm.type === 'class'">
            <el-form-item label="班级">
              <el-input
                v-model="selectForm.class"
                placeholder="请输入班级"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="selectForm.type === 'course'">
            <el-form-item label="课程">
              <el-select
                v-model="selectForm.courseId"
                placeholder="选择课程"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="course in courseOptions"
                  :key="course.id"
                  :label="course.name"
                  :value="course.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="selectForm.type === 'student'">
            <el-form-item label="学生">
              <el-select
                v-model="selectForm.studentId"
                placeholder="选择学生"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="student in studentOptions"
                  :key="student.id"
                  :label="`${student.name} (${student.studentId})`"
                  :value="student.studentId"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="selectForm.type !== 'overall'">
          <el-col :span="12">
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="selectForm.timeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="generateReport" :icon="Document" :loading="reportStore.loading">
            生成报表
          </el-button>
          <el-button type="success" @click="previewReport" :icon="View" :loading="reportStore.loading">
            预览
          </el-button>
          <el-button type="warning" @click="printReport" :icon="Printer" :loading="reportStore.loading">
            打印
          </el-button>
          <el-button @click="resetForm" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预览区域 -->
    <el-card class="preview-card" v-if="previewData.length > 0">
      <template #header>
        <div class="card-header">
          <span>统计报表预览</span>
          <div class="header-actions">
            <el-button size="small" type="primary" @click="printPreview" :icon="Printer">打印预览</el-button>
            <el-button size="small" @click="closePreview" :icon="Close">关闭预览</el-button>
          </div>
        </div>
      </template>

      <div class="preview-content" id="statisticalPreview">
        <div class="report-header">
          <h2>{{ getReportTitle() }}</h2>
          <div class="report-info">
            <p><strong>生成时间：</strong>{{ new Date().toLocaleString('zh-CN') }}</p>
            <p v-if="selectForm.semester"><strong>学期：</strong>{{ selectForm.semester }}</p>
            <p v-if="selectForm.class"><strong>班级：</strong>{{ selectForm.class }}</p>
            <p v-if="selectForm.courseId"><strong>课程：</strong>{{ getCourseName(selectForm.courseId) }}</p>
            <p v-if="selectForm.studentId"><strong>学生：</strong>{{ getStudentName(selectForm.studentId) }}</p>
          </div>
        </div>

        <!-- 班级统计 -->
        <div v-if="selectForm.type === 'class'" class="report-section">
          <h3>班级成绩统计表</h3>
          <table class="stats-table">
            <thead>
              <tr>
                <th>班级</th>
                <th>学生数</th>
                <th>平均分</th>
                <th>及格率</th>
                <th>最高分</th>
                <th>最低分</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in previewData" :key="index">
                <td>{{ item.class }}</td>
                <td>{{ item.totalStudents }}</td>
                <td>{{ item.avgScore.toFixed(1) }}</td>
                <td>{{ item.passRate }}%</td>
                <td>{{ item.highestScore }}</td>
                <td>{{ item.lowestScore }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 课程统计 -->
        <div v-if="selectForm.type === 'course'" class="report-section">
          <h3>课程成绩统计表</h3>
          <table class="stats-table">
            <thead>
              <tr>
                <th>课程名称</th>
                <th>学生数</th>
                <th>平均分</th>
                <th>及格率</th>
                <th>最高分</th>
                <th>最低分</th>
                <th>总学分</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in previewData" :key="index">
                <td>{{ item.courseName }}</td>
                <td>{{ item.totalStudents }}</td>
                <td>{{ item.avgScore.toFixed(1) }}</td>
                <td>{{ item.passRate }}%</td>
                <td>{{ item.highestScore }}</td>
                <td>{{ item.lowestScore }}</td>
                <td>{{ item.totalCredits }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 学生统计 -->
        <div v-if="selectForm.type === 'student'" class="report-section">
          <h3>学生成绩统计表</h3>
          <table class="stats-table">
            <thead>
              <tr>
                <th>学号</th>
                <th>姓名</th>
                <th>班级</th>
                <th>课程数</th>
                <th>总分</th>
                <th>平均分</th>
                <th>总学分</th>
                <th>排名</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in previewData" :key="index">
                <td>{{ item.studentId }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.class }}</td>
                <td>{{ item.courseCount }}</td>
                <td>{{ item.totalScore }}</td>
                <td>{{ item.avgScore.toFixed(1) }}</td>
                <td>{{ item.totalCredits }}</td>
                <td>{{ item.rank }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 总体统计 -->
        <div v-if="selectForm.type === 'overall'" class="report-section">
          <h3>系统总体统计</h3>
          <div class="overall-stats">
            <div class="stat-card">
              <div class="stat-value">{{ previewData[0]?.totalStudents || 0 }}</div>
              <div class="stat-label">总学生数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ previewData[0]?.totalCourses || 0 }}</div>
              <div class="stat-label">总课程数</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ previewData[0]?.totalGrades || 0 }}</div>
              <div class="stat-label">成绩记录</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ previewData[0]?.avgScore?.toFixed(1) || 0 }}</div>
              <div class="stat-label">平均分</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ previewData[0]?.passRate || 0 }}%</div>
              <div class="stat-label">及格率</div>
            </div>
          </div>
        </div>

        <!-- 成绩分布图 -->
        <div v-if="distributionData.length > 0" class="report-section">
          <h3>成绩分布统计</h3>
          <table class="stats-table">
            <thead>
              <tr>
                <th>分数段</th>
                <th>人数</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in distributionData" :key="index">
                <td>{{ item.range }}</td>
                <td>{{ item.count }}</td>
                <td>{{ item.percentage.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </el-card>

    <!-- 批量打印选项 -->
    <el-card class="batch-card" v-if="selectForm.type === 'class' || selectForm.type === 'course'">
      <template #header>
        <div class="card-header">
          <span>批量打印选项</span>
        </div>
      </template>
      <div class="batch-actions">
        <el-button type="primary" @click="batchPrintAll" :icon="Printer" :loading="reportStore.loading">
          打印所有{{ selectForm.type === 'class' ? '班级' : '课程' }}统计
        </el-button>
        <el-button type="success" @click="exportAllData" :icon="Download" :loading="reportStore.loading">
          导出所有数据
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useReportStore } from '@/stores/report'
import { useCourseStore } from '@/stores/course'
import { useStudentStore } from '@/stores/student'
import { useStatisticsStore } from '@/stores/statistics'
import { ElMessage } from 'element-plus'
import { Document, View, Printer, Refresh, Close, Download } from '@element-plus/icons-vue'

const reportStore = useReportStore()
const courseStore = useCourseStore()
const studentStore = useStudentStore()
const statisticsStore = useStatisticsStore()

// 选择表单
const selectForm = reactive({
  type: 'class' as 'class' | 'course' | 'student' | 'overall',
  format: 'pdf' as 'pdf' | 'excel',
  class: '',
  courseId: '',
  studentId: '',
  semester: '',
  timeRange: [] as string[]
})

// 预览数据
const previewData = ref<any[]>([])
const distributionData = ref<any[]>([])

// 课程选项
const courseOptions = computed(() => courseStore.courses)

// 学生选项
const studentOptions = computed(() => studentStore.students)

// 获取课程名称
const getCourseName = (courseId: string) => {
  const course = courseOptions.value.find(c => c.id === courseId)
  return course ? course.name : courseId
}

// 获取学生名称
const getStudentName = (studentId: string) => {
  const student = studentOptions.value.find(s => s.studentId === studentId)
  return student ? student.name : studentId
}

// 获取报表标题
const getReportTitle = () => {
  const titles = {
    class: '班级统计报表',
    course: '课程统计报表',
    student: '学生统计报表',
    overall: '系统总体统计报表'
  }
  return titles[selectForm.type]
}

// 加载基础数据
const loadBasicData = async () => {
  await Promise.all([
    courseStore.fetchCourses({ page: 1, limit: 1000 }),
    studentStore.fetchStudents({ page: 1, limit: 1000 })
  ])
}

// 生成报表
const generateReport = async () => {
  if (selectForm.type === 'class' && !selectForm.class) {
    ElMessage.warning('请输入班级')
    return
  }
  if (selectForm.type === 'course' && !selectForm.courseId) {
    ElMessage.warning('请选择课程')
    return
  }
  if (selectForm.type === 'student' && !selectForm.studentId) {
    ElMessage.warning('请选择学生')
    return
  }

  try {
    await reportStore.generateStatisticalReport({
      type: selectForm.type,
      format: selectForm.format,
      class: selectForm.class,
      courseId: selectForm.courseId,
      studentId: selectForm.studentId,
      semester: selectForm.semester,
      startTime: selectForm.timeRange[0],
      endTime: selectForm.timeRange[1]
    })
  } catch (error) {
    // 错误已在store中处理
  }
}

// 预览报表
const previewReport = async () => {
  // 模拟预览数据（实际应从API获取）
  if (selectForm.type === 'class') {
    previewData.value = [
      { class: selectForm.class || '计算机2401', totalStudents: 35, avgScore: 82.5, passRate: 94.3, highestScore: 98, lowestScore: 56 }
    ]
  } else if (selectForm.type === 'course') {
    const course = courseOptions.value.find(c => c.id === selectForm.courseId)
    previewData.value = [
      { 
        courseName: course ? course.name : '程序设计基础', 
        totalStudents: 40, 
        avgScore: 78.8, 
        passRate: 88.5, 
        highestScore: 96, 
        lowestScore: 45,
        totalCredits: 3
      }
    ]
  } else if (selectForm.type === 'student') {
    const student = studentOptions.value.find(s => s.studentId === selectForm.studentId)
    previewData.value = [
      {
        studentId: selectForm.studentId,
        name: student ? student.name : '张三',
        class: student ? student.class : '计算机2401',
        courseCount: 8,
        totalScore: 685,
        avgScore: 85.6,
        totalCredits: 24,
        rank: 5
      }
    ]
  } else if (selectForm.type === 'overall') {
    previewData.value = [
      {
        totalStudents: 1200,
        totalCourses: 45,
        totalGrades: 8500,
        avgScore: 76.8,
        passRate: 85.5
      }
    ]
  }

  // 加载分布数据
  distributionData.value = [
    { range: '90-100', count: 120, percentage: 12.0 },
    { range: '80-89', count: 280, percentage: 28.0 },
    { range: '70-79', count: 320, percentage: 32.0 },
    { range: '60-69', count: 180, percentage: 18.0 },
    { range: '0-59', count: 100, percentage: 10.0 }
  ]

  ElMessage.success('预览数据已生成')
}

// 打印报表
const printReport = async () => {
  if (previewData.value.length === 0) {
    await previewReport()
  }

  const html = document.getElementById('statisticalPreview')?.innerHTML
  if (html) {
    reportStore.printHTML(html, getReportTitle())
  }
}

// 打印预览
const printPreview = () => {
  const html = document.getElementById('statisticalPreview')?.innerHTML
  if (html) {
    reportStore.printHTML(html, getReportTitle())
  } else {
    ElMessage.warning('请先生成预览数据')
  }
}

// 关闭预览
const closePreview = () => {
  previewData.value = []
  distributionData.value = []
}

// 重置表单
const resetForm = () => {
  selectForm.class = ''
  selectForm.courseId = ''
  selectForm.studentId = ''
  selectForm.semester = ''
  selectForm.timeRange = []
  previewData.value = []
  distributionData.value = []
}

// 批量打印所有
const batchPrintAll = async () => {
  if (selectForm.type === 'class' && !selectForm.class) {
    ElMessage.warning('请输入班级')
    return
  }
  if (selectForm.type === 'course' && !selectForm.courseId) {
    ElMessage.warning('请选择课程')
    return
  }

  // 模拟批量打印
  ElMessage.info('批量打印功能演示：将生成多个统计报表并合并打印')
  
  // 实际实现中，这里会调用后端API生成多个报表
  await previewReport()
  setTimeout(() => {
    printReport()
  }, 500)
}

// 导出所有数据
const exportAllData = async () => {
  try {
    // 导出Excel格式
    const originalFormat = selectForm.format
    selectForm.format = 'excel'
    await generateReport()
    selectForm.format = originalFormat
  } catch (error) {
    // 错误已在store中处理
  }
}

onMounted(() => {
  loadBasicData()
})
</script>

<style scoped>
.statistical-reports-container {
  padding: 0;
}

.select-card {
  margin-bottom: 20px;
}

.preview-card {
  margin-bottom: 20px;
}

.batch-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  padding: 20px;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.report-header {
  margin-bottom: 30px;
  text-align: center;
}

.report-header h2 {
  margin-bottom: 15px;
  color: #333;
  font-size: 24px;
}

.report-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  text-align: left;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.report-info p {
  margin: 0;
  font-size: 13px;
}

.report-section {
  margin-bottom: 30px;
  page-break-inside: avoid;
}

.report-section h3 {
  margin-bottom: 15px;
  color: #333;
  font-size: 18px;
  border-left: 4px solid #409EFF;
  padding-left: 10px;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.stats-table th,
.stats-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

.stats-table th {
  background-color: #f2f2f2;
  font-weight: 600;
  color: #333;
}

.overall-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.stat-card {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.batch-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media print {
  .no-print {
    display: none !important;
  }
  
  .preview-card {
    border: none;
    box-shadow: none;
  }
  
  .report-section {
    page-break-inside: avoid;
  }
}
</style>