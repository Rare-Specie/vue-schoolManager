<template>
  <div class="report-card-container">
    <!-- 选择条件 -->
    <el-card class="select-card">
      <el-form :model="selectForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生成方式">
              <el-radio-group v-model="selectForm.mode">
                <el-radio label="student">按学生</el-radio>
                <el-radio label="class">按班级</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

        </el-row>

        <el-row :gutter="20" v-if="selectForm.mode === 'student'">
          <el-col :span="12">
            <el-form-item label="学生学号">
              <el-input
                v-model="selectForm.studentId"
                placeholder="请输入学号"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="或选择学生">
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

        <el-row :gutter="20" v-else>
          <el-col :span="12">
            <el-form-item label="班级">
              <el-input
                v-model="selectForm.class"
                placeholder="请输入班级"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item>
          <el-button type="primary" @click="generateReport" :icon="Document" :loading="reportStore.loading">
            生成成绩单
          </el-button>
          <el-button type="success" @click="previewReport" :icon="View" :loading="reportStore.loading">
            预览
          </el-button>
          <el-button type="warning" @click="printReport" :icon="Printer" :loading="reportStore.loading">
            直接打印
          </el-button>
          <el-button @click="resetForm" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预览区域 -->
    <el-card class="preview-card" v-if="previewData.length > 0">
      <template #header>
        <div class="card-header">
          <span>成绩单预览</span>
          <div class="header-actions">
            <el-button size="small" type="primary" @click="printPreview" :icon="Printer">打印预览</el-button>
            <el-button size="small" @click="closePreview" :icon="Close">关闭预览</el-button>
          </div>
        </div>
      </template>

      <div class="preview-content" id="reportPreview">
        <div v-if="selectForm.mode === 'student' && previewData.length > 0">
          <!-- 单个学生成绩单 -->
          <div v-for="student in previewData" :key="student.studentId" class="report-section">
            <h2>学生成绩单</h2>
            <div class="student-info">
              <p><strong>学号：</strong>{{ student.studentId }}</p>
              <p><strong>姓名：</strong>{{ student.name }}</p>
              <p><strong>班级：</strong>{{ student.class }}</p>
            </div>
            
            <table class="grade-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>课程编号</th>
                  <th>课程名称</th>
                  <th>学分</th>
                  <th>成绩</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(grade, index) in student.grades" :key="index">
                  <td>{{ Number(index) + 1 }}</td>
                  <td>{{ grade.courseId }}</td>
                  <td>{{ grade.courseName }}</td>
                  <td>{{ grade.credit }}</td>
                  <td>
                    <strong :style="{ color: getScoreColor(grade.score) }">
                      {{ grade.score }}
                    </strong>
                  </td>
                  <td>{{ grade.remark || '-' }}</td>
                </tr>
              </tbody>
            </table>

            <div class="summary">
              <p><strong>总学分：</strong>{{ student.summary.totalCredits }}</p>
              <p><strong>平均分：</strong>{{ student.summary.avgScore.toFixed(1) }}</p>
              <p><strong>总分：</strong>{{ student.summary.totalScore }}</p>
              <p><strong>及格率：</strong>{{ student.summary.passRate }}%</p>
            </div>

            <div class="signature">
              <div class="signature-line"></div>
              <p>班主任签字：___________</p>
              <div class="signature-line"></div>
              <p>日期：___________</p>
            </div>
          </div>
        </div>

        <div v-else-if="selectForm.mode === 'class' && previewData.length > 0">
          <!-- 班级成绩单 -->
          <div class="report-section">
            <h2>班级成绩单</h2>
            <div class="student-info">
              <p><strong>班级：</strong>{{ selectForm.class }}</p>
              <p><strong>总人数：</strong>{{ previewData.length }}</p>
            </div>

            <table class="grade-table">
              <thead>
                <tr>
                  <th>学号</th>
                  <th>姓名</th>
                  <th>课程</th>
                  <th>成绩</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in previewData" :key="index">
                  <td>{{ item.studentId }}</td>
                  <td>{{ item.studentName }}</td>
                  <td>{{ item.courseName }}</td>
                  <td>
                    <strong :style="{ color: getScoreColor(item.score) }">
                      {{ item.score }}
                    </strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 批量打印对话框 -->
    <el-dialog
      v-model="batchDialog.visible"
      title="批量打印成绩单"
      width="600px"
    >
      <el-form :model="batchDialog.form" label-width="100px">
        <el-form-item label="打印类型">
          <el-select v-model="batchDialog.form.type" placeholder="选择类型" style="width: 100%">
            <el-option label="班级成绩单" value="class" />
            <el-option label="学生个人成绩单" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择范围" v-if="batchDialog.form.type === 'class'">
          <el-input
            v-model="batchDialog.form.classes"
            placeholder="请输入班级，多个用逗号分隔，如：计算机2401,计算机2402"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="选择学生" v-else>
          <el-select
            v-model="batchDialog.form.students"
            multiple
            placeholder="选择学生"
            filterable
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

      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="executeBatchPrint" :loading="reportStore.loading">
            开始打印
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useReportStore } from '@/stores/report'
import { useStudentStore } from '@/stores/student'
import { ElMessage } from 'element-plus'
import { Document, View, Printer, Refresh, Close } from '@element-plus/icons-vue'

const reportStore = useReportStore()
const studentStore = useStudentStore()

// 选择表单
const selectForm = reactive({
  mode: 'student' as 'student' | 'class',
  studentId: '',
  class: ''
})

// 预览数据
const previewData = ref<any[]>([])

// 学生选项
const studentOptions = computed(() => studentStore.students)

// 批量打印对话框
const batchDialog = ref({
  visible: false,
  form: {
    type: 'class' as 'class' | 'student',
    classes: '',
    students: [] as string[]
  }
})

// 加载学生列表
const loadStudents = async () => {
  await studentStore.fetchStudents({ page: 1, limit: 1000 })
}

// 生成成绩单
const generateReport = async () => {
  if (selectForm.mode === 'student' && !selectForm.studentId) {
    ElMessage.warning('请输入或选择学生学号')
    return
  }
  if (selectForm.mode === 'class' && !selectForm.class) {
    ElMessage.warning('请输入班级')
    return
  }

  // 构建参数，过滤掉空值
  const params: any = {}
  
  if (selectForm.mode === 'student' && selectForm.studentId) {
    params.studentId = selectForm.studentId
  }
  if (selectForm.mode === 'class' && selectForm.class) {
    params.class = selectForm.class
  }



  try {
    await reportStore.generateReportCard(params)
  } catch (error) {
    console.error('成绩单生成错误:', error)
    // 错误已在store中处理
  }
}

// 预览成绩单
const previewReport = async () => {
  if (selectForm.mode === 'student' && !selectForm.studentId) {
    ElMessage.warning('请输入或选择学生学号')
    return
  }
  if (selectForm.mode === 'class' && !selectForm.class) {
    ElMessage.warning('请输入班级')
    return
  }

  // 模拟预览数据（实际应从API获取）
  if (selectForm.mode === 'student') {
    // 模拟单个学生成绩单
    const studentName = selectForm.studentId === '2024001' ? '张三' : 
                       selectForm.studentId === '2024002' ? '李四' : '未知学生'
    const studentClass = selectForm.studentId === '2024001' ? '计算机2401' : '计算机2402'
    
    previewData.value = [{
      studentId: selectForm.studentId,
      name: studentName,
      class: studentClass,
      grades: [
        { courseId: 'CS101', courseName: '程序设计基础', credit: 3, score: 85 },
        { courseId: 'CS102', courseName: '数据结构', credit: 4, score: 92 },
        { courseId: 'MA101', courseName: '高等数学', credit: 4, score: 78 },
        { courseId: 'EN101', courseName: '大学英语', credit: 3, score: 88 }
      ],
      summary: {
        totalCredits: 14,
        avgScore: 85.75,
        totalScore: 343,
        passRate: 100
      }
    }]
  } else {
    // 模拟班级成绩单
    previewData.value = [
      { studentId: '2024001', studentName: '张三', courseName: '程序设计基础', score: 85 },
      { studentId: '2024001', studentName: '张三', courseName: '数据结构', score: 92 },
      { studentId: '2024002', studentName: '李四', courseName: '程序设计基础', score: 76 },
      { studentId: '2024002', studentName: '李四', courseName: '数据结构', score: 88 }
    ]
  }

  ElMessage.success('预览数据已生成')
}

// 打印成绩单
const printReport = async () => {
  if (selectForm.mode === 'student' && !selectForm.studentId) {
    ElMessage.warning('请输入或选择学生学号')
    return
  }
  if (selectForm.mode === 'class' && !selectForm.class) {
    ElMessage.warning('请输入班级')
    return
  }

  // 先生成预览数据
  await previewReport()

  // 调用打印
  if (previewData.value.length > 0) {
    const html = document.getElementById('reportPreview')?.innerHTML
    if (html) {
      reportStore.printHTML(html, '成绩单打印')
    }
  }
}

// 打印预览
const printPreview = () => {
  const html = document.getElementById('reportPreview')?.innerHTML
  if (html) {
    reportStore.printHTML(html, '成绩单打印')
  } else {
    ElMessage.warning('请先生成预览数据')
  }
}

// 关闭预览
const closePreview = () => {
  previewData.value = []
}

// 重置表单
const resetForm = () => {
  selectForm.studentId = ''
  selectForm.class = ''
  previewData.value = []
}

// 显示批量打印对话框
const showBatchDialog = () => {
  batchDialog.value.visible = true
}

// 执行批量打印
const executeBatchPrint = async () => {
  const form = batchDialog.value.form
  if (form.type === 'class' && !form.classes) {
    ElMessage.warning('请输入班级')
    return
  }
  if (form.type === 'student' && form.students.length === 0) {
    ElMessage.warning('请选择学生')
    return
  }

  try {
    const items = form.type === 'class' 
      ? form.classes.split(',').map(c => c.trim()).filter(c => c)
      : form.students

    if (items.length === 0) {
      ElMessage.warning('没有有效的数据')
      return
    }

    const params = {
      type: form.type,
      items: items
    }



    await reportStore.executeBatchPrint(params)

    batchDialog.value.visible = false
  } catch (error) {
    console.error('批量打印错误:', error)
    // 错误已在store中处理
  }
}

// 根据分数获取颜色
const getScoreColor = (score: number) => {
  if (score >= 90) return '#67C23A'
  if (score >= 80) return '#409EFF'
  if (score >= 60) return '#E6A23C'
  return '#F56C6C'
}

onMounted(() => {
  loadStudents()
})
</script>

<style scoped>
.report-card-container {
  padding: 0;
}

.select-card {
  margin-bottom: 20px;
}

.preview-card {
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

.report-section {
  margin-bottom: 40px;
  page-break-inside: avoid;
}

.report-section h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
}

.student-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.student-info p {
  margin: 0;
  font-size: 14px;
}

.grade-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  font-size: 13px;
}

.grade-table th,
.grade-table td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: center;
}

.grade-table th {
  background-color: #f2f2f2;
  font-weight: 600;
  color: #333;
}

.summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 15px;
  background: #e8f4fd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.summary p {
  margin: 0;
  font-size: 14px;
}

.signature {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  padding: 0 40px;
}

.signature-line {
  flex: 1;
  border-bottom: 1px solid #333;
  margin: 0 20px;
}

.signature p {
  margin: 10px 0;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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

/* 现代化滚动条样式 - Vue3风格 */
/* Webkit 浏览器 (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.7);
}

::-webkit-scrollbar-thumb:active {
  background: rgba(75, 85, 99, 0.8);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}
</style>