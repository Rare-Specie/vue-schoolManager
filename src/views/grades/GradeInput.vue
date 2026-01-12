<template>
  <div class="grade-input-container">
    <!-- 课程选择 -->
    <el-card class="select-card">
      <el-form :inline="true" :model="selectForm">
        <el-form-item label="选择课程" prop="courseId">
          <el-select
            v-model="selectForm.courseId"
            placeholder="请选择课程"
            filterable
            clearable
            style="width: 280px"
            @change="handleCourseChange"
          >
            <el-option
              v-for="course in courseOptions"
              :key="course.id"
              :label="`${course.name} (${course.courseId})`"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学期" prop="semester">
          <el-input
            v-model="selectForm.semester"
            placeholder="如：2024-2025学年第一学期"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadCourseGrades" :icon="Search">加载学生</el-button>
          <el-button @click="resetSelect" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 学生选课区域 -->
      <div class="enrollment-section" v-if="authStore.isAdmin || authStore.isTeacher">
        <div class="section-title">学生选课管理</div>
        <el-form :inline="true" :model="enrollmentForm" class="enrollment-form">
          <el-form-item label="选择学生" prop="studentId">
            <el-select
              v-model="enrollmentForm.studentId"
              placeholder="请选择学生"
              filterable
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="student in studentOptions"
                :key="student.id"
                :label="`${student.name} (${student.studentId})`"
                :value="student.studentId"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="success" @click="enrollStudent" :icon="Plus" :disabled="!canEnroll">
              添加选课
            </el-button>
            <el-button type="danger" @click="unenrollStudent" :icon="Minus" :disabled="!canUnenroll">
              移除选课
            </el-button>
            <el-button type="info" @click="showEnrollmentDialog" :icon="User">
              查看已选学生
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="action-buttons" v-if="selectForm.courseId">
        <el-button type="success" @click="saveAllGrades" :icon="Check" :loading="gradeStore.loading">
          保存所有成绩
        </el-button>
        <el-button type="warning" @click="showBatchDialog" :icon="EditPen">批量录入</el-button>
        <el-button type="info" @click="showImportDialog" :icon="Upload">导入成绩</el-button>
        <el-button type="info" @click="exportData" :icon="Download">导出模板</el-button>
      </div>
    </el-card>

    <!-- 成绩录入表格 -->
    <el-card class="table-card" v-if="gradeStore.courseGrades.length > 0">
      <div class="table-header">
        <span class="title">成绩录入表</span>
        <span class="subtitle">课程：{{ currentCourseName }}</span>
      </div>
      
      <el-table
        :data="gradeStore.courseGrades"
        v-loading="gradeStore.loading"
        border
        stripe
        style="width: 100%"
        max-height="500"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="class" label="班级" width="120" align="center" />
        <el-table-column label="成绩" width="140" align="center">
          <template #default="{ row, $index }">
            <el-input-number
              v-model="row.score"
              :min="0"
              :max="100"
              :precision="1"
              :step="1"
              size="small"
              style="width: 100px"
              @change="handleScoreChange(row, $index)"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.score !== undefined && row.score !== null ? 'success' : 'info'">
              {{ row.score !== undefined && row.score !== null ? '已录入' : '未录入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row, $index }">
            <el-button
              size="small"
              type="primary"
              @click="saveSingleGrade(row, $index)"
              :icon="Check"
              :disabled="row.score === undefined || row.score === null"
            >
              保存
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty
      v-else-if="selectForm.courseId && !gradeStore.loading"
      description="请先选择课程并加载学生数据"
      class="empty-state"
    />

    <!-- 批量录入对话框 -->
    <el-dialog
      v-model="batchDialog.visible"
      title="批量录入成绩"
      width="500px"
    >
      <el-form :model="batchDialog.form" label-width="100px">
        <el-form-item label="起始分数">
          <el-input-number
            v-model="batchDialog.form.startScore"
            :min="0"
            :max="100"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="递增步长">
          <el-input-number
            v-model="batchDialog.form.step"
            :min="0"
            :max="10"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="应用方式">
          <el-radio-group v-model="batchDialog.form.mode">
            <el-radio label="overwrite">覆盖已有</el-radio>
            <el-radio label="fill">仅填充空值</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <div class="batch-preview">
        <p>预览：将按顺序生成成绩</p>
        <p class="preview-text">例如：{{ batchDialog.form.startScore }}, {{ batchDialog.form.startScore + batchDialog.form.step }}, ...</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="applyBatchInput">应用</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="importDialog.visible"
      title="导入成绩"
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="请粘贴JSON格式的成绩数据，格式为：[{'studentId':'2024001','courseId':'CS101','score':85,'semester':'2024-1'}]"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />
        <el-input
          v-model="importDialog.jsonData"
          type="textarea"
          :rows="10"
          placeholder='[{"studentId": "2024001", "courseId": "CS101", "score": 85, "semester": "2024-1"}]'
        />
        <div class="template-download" style="margin-top: 12px">
          <el-button type="text" @click="downloadTemplate">下载JSON导入模板</el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleImport" :loading="gradeStore.loading">
            开始导入
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 已选学生对话框 -->
    <el-dialog
      v-model="enrollmentDialog.visible"
      title="已选学生列表"
      width="600px"
      @close="clearEnrollmentDialog"
    >
      <div class="enrollment-content">
        <div class="enrollment-header">
          <span>课程：{{ currentCourseName }}</span>
          <span class="student-count">共 {{ enrollmentDialog.students.length }} 名学生</span>
        </div>
        
        <el-table
          :data="enrollmentDialog.students"
          v-loading="enrollmentDialog.loading"
          border
          stripe
          style="width: 100%"
          max-height="400"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="studentId" label="学号" width="120" align="center" />
          <el-table-column prop="name" label="姓名" width="120" align="center" />
          <el-table-column prop="class" label="班级" width="120" align="center" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.score !== undefined && row.score !== null ? 'success' : 'info'">
                {{ row.score !== undefined && row.score !== null ? '已录入' : '未录入' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                size="small"
                type="danger"
                @click="removeStudentFromCourse(row)"
                :icon="Delete"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="enrollmentDialog.visible = false">关闭</el-button>
          <el-button type="primary" @click="refreshEnrollmentList">刷新列表</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useGradeStore } from '@/stores/grade'
import { useCourseStore } from '@/stores/course'
import { useStudentStore } from '@/stores/student'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Check, EditPen, Upload, Download, Plus, Minus, User, Delete } from '@element-plus/icons-vue'

const gradeStore = useGradeStore()
const courseStore = useCourseStore()
const studentStore = useStudentStore()
const authStore = useAuthStore()

// 选择表单
const selectForm = reactive({
  courseId: '',
  semester: ''
})

// 选课表单
const enrollmentForm = reactive({
  studentId: ''
})

// 课程选项
const courseOptions = computed(() => courseStore.courses)

// 学生选项
const studentOptions = computed(() => studentStore.students)

// 当前课程名称
const currentCourseName = computed(() => {
  const course = courseStore.courses.find(c => c.id === selectForm.courseId)
  return course ? course.name : ''
})

// 是否可以选课
const canEnroll = computed(() => {
  return selectForm.courseId && enrollmentForm.studentId
})

// 是否可以取消选课
const canUnenroll = computed(() => {
  return selectForm.courseId && enrollmentForm.studentId
})

// 批量录入对话框
const batchDialog = ref({
  visible: false,
  form: {
    startScore: 60,
    step: 1,
    mode: 'fill' as 'overwrite' | 'fill'
  }
})

// 导入对话框
const importDialog = ref({
  visible: false,
  jsonData: '' as string
})

// 选课对话框
const enrollmentDialog = ref({
  visible: false,
  loading: false,
  students: [] as any[]
})

// 加载课程列表
const loadCourses = async () => {
  await courseStore.fetchCourses({ page: 1, limit: 100 })
}

// 加载学生列表
const loadStudents = async () => {
  await studentStore.fetchStudents({ page: 1, limit: 1000 })
}

// 课程选择变化
const handleCourseChange = () => {
  gradeStore.courseGrades = []
}

// 学生选课
const enrollStudent = async () => {
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }
  if (!enrollmentForm.studentId) {
    ElMessage.warning('请先选择学生')
    return
  }

  try {
    await courseStore.enrollStudentToCourse(selectForm.courseId, enrollmentForm.studentId)
    enrollmentForm.studentId = ''
    // 刷新成绩列表
    await loadCourseGrades()
  } catch (error) {
    // 错误已在store中处理
  }
}

// 取消选课
const unenrollStudent = async () => {
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }
  if (!enrollmentForm.studentId) {
    ElMessage.warning('请先选择学生')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要取消该学生的选课吗？这也会删除该学生的相关成绩记录。',
      '警告',
      { type: 'warning' }
    )

    await courseStore.unenrollStudentFromCourse(selectForm.courseId, enrollmentForm.studentId)
    enrollmentForm.studentId = ''
    // 刷新成绩列表
    await loadCourseGrades()
  } catch (cancel) {
    // 用户取消
  }
}

// 显示选课对话框
const showEnrollmentDialog = async () => {
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }

  enrollmentDialog.value.visible = true
  await refreshEnrollmentList()
}

// 刷新选课列表
const refreshEnrollmentList = async () => {
  if (!selectForm.courseId) return

  enrollmentDialog.value.loading = true
  try {
    const students = await courseStore.fetchCourseStudents(selectForm.courseId)
    enrollmentDialog.value.students = students
  } catch (error) {
    // 错误已在store中处理
  } finally {
    enrollmentDialog.value.loading = false
  }
}

// 从课程中移除学生
const removeStudentFromCourse = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要从课程中移除学生 ${row.name} 吗？这也会删除其成绩记录。`,
      '警告',
      { type: 'warning' }
    )

    await courseStore.unenrollStudentFromCourse(selectForm.courseId, row.studentId)
    // 从对话框列表中移除
    enrollmentDialog.value.students = enrollmentDialog.value.students.filter(
      s => s.studentId !== row.studentId
    )
    // 刷新成绩列表
    await loadCourseGrades()
  } catch (cancel) {
    // 用户取消
  }
}

// 清空选课对话框
const clearEnrollmentDialog = () => {
  enrollmentDialog.value.students = []
  enrollmentDialog.value.loading = false
}

// 加载课程成绩
const loadCourseGrades = async () => {
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }
  try {
    await gradeStore.fetchCourseGrades(selectForm.courseId, selectForm.semester)
  } catch (error) {
    // 错误已在store中处理
  }
}

// 重置选择
const resetSelect = () => {
  selectForm.courseId = ''
  selectForm.semester = ''
  gradeStore.courseGrades = []
}

// 成绩变化处理
const handleScoreChange = (row: any, index: number) => {
  // 可以在这里添加实时验证
  if (row.score < 0 || row.score > 100) {
    ElMessage.warning('成绩必须在0-100之间')
  }
}

// 保存单个成绩
const saveSingleGrade = async (row: any, index: number) => {
  if (row.score === undefined || row.score === null) {
    ElMessage.warning('请先输入成绩')
    return
  }

  try {
    if (row.gradeId) {
      // 更新已有成绩
      await gradeStore.updateGradeInfo(row.gradeId, {
        score: row.score,
        semester: selectForm.semester
      })
    } else {
      // 录入新成绩
      const grade = await gradeStore.addGrade({
        studentId: row.studentId,
        courseId: selectForm.courseId,
        score: row.score,
        semester: selectForm.semester
      })
      // 更新本地数据
      row.gradeId = grade.id
    }
    ElMessage.success(`学生 ${row.name} 成绩保存成功`)
  } catch (error) {
    // 错误已在store中处理
  }
}

// 保存所有成绩
const saveAllGrades = async () => {
  const validGrades = gradeStore.courseGrades.filter(row => 
    row.score !== undefined && row.score !== null
  )

  if (validGrades.length === 0) {
    ElMessage.warning('没有需要保存的成绩')
    return
  }

  try {
    await ElMessageBox.confirm(
      `共 ${validGrades.length} 条成绩需要保存，是否继续？`,
      '确认保存',
      { type: 'info' }
    )

    let successCount = 0
    let failCount = 0

    for (const row of validGrades) {
      try {
        if (row.gradeId) {
          await gradeStore.updateGradeInfo(row.gradeId, {
            score: row.score,
            semester: selectForm.semester
          })
        } else {
          const grade = await gradeStore.addGrade({
            studentId: row.studentId,
            courseId: selectForm.courseId,
            score: row.score,
            semester: selectForm.semester
          })
          row.gradeId = grade.id
        }
        successCount++
      } catch (error) {
        failCount++
      }
    }

    if (failCount > 0) {
      ElMessage.warning(`保存完成：成功 ${successCount} 条，失败 ${failCount} 条`)
    } else {
      ElMessage.success(`成功保存 ${successCount} 条成绩`)
    }
  } catch (cancel) {
    // 用户取消
  }
}

// 显示批量录入对话框
const showBatchDialog = () => {
  batchDialog.value.visible = true
}

// 应用批量输入
const applyBatchInput = () => {
  const { startScore, step, mode } = batchDialog.value.form

  let currentScore = startScore
  let count = 0

  for (const row of gradeStore.courseGrades) {
    if (mode === 'fill' && (row.score !== undefined && row.score !== null)) {
      continue
    }

    if (currentScore > 100) break

    row.score = currentScore
    currentScore += step
    count++
  }

  ElMessage.success(`已为 ${count} 名学生批量录入成绩`)
  batchDialog.value.visible = false
}

// 显示导入对话框
const showImportDialog = () => {
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }
  importDialog.value.visible = true
  importDialog.value.jsonData = ''
}

// 开始导入
const handleImport = async () => {
  if (!importDialog.value.jsonData.trim()) {
    ElMessage.warning('请输入JSON数据')
    return
  }

  try {
    const data = JSON.parse(importDialog.value.jsonData)
    if (!Array.isArray(data)) {
      ElMessage.error('数据格式错误：必须是数组格式')
      return
    }
    
    // 验证数据格式
    const isValid = data.every(item => 
      item.studentId && item.courseId && item.score !== undefined
    )
    
    if (!isValid) {
      ElMessage.error('数据格式错误：每条记录必须包含studentId、courseId和score字段')
      return
    }

    // 自动填充当前课程ID和学期
    const enrichedData = data.map(item => ({
      ...item,
      courseId: selectForm.courseId,
      semester: selectForm.semester || undefined
    }))

    await gradeStore.importGradesData(enrichedData)
    importDialog.value.visible = false
    await loadCourseGrades()
  } catch (error) {
    ElMessage.error('JSON格式错误，请检查输入')
  }
}

// 导出模板
const downloadTemplate = () => {
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }

  const templateData = [
    {"studentId": "2024001", "courseId": selectForm.courseId, "score": 85, "semester": selectForm.semester || "2024-1"},
    {"studentId": "2024002", "courseId": selectForm.courseId, "score": 92, "semester": selectForm.semester || "2024-1"}
  ]

  const content = JSON.stringify(templateData, null, 2)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `成绩导入模板_${currentCourseName.value}.json`
  link.click()
  window.URL.revokeObjectURL(url)
}

// 导出数据
const exportData = async () => {
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }

  try {
    await gradeStore.exportGradesData({
      courseId: selectForm.courseId,
      semester: selectForm.semester
    })
  } catch (error) {
    // 错误已在store中处理
  }
}

onMounted(() => {
  loadCourses()
  loadStudents()
})
</script>

<style scoped>
.grade-input-container {
  padding: 0;
}

.select-card {
  margin-bottom: 20px;
}

.enrollment-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #303133;
}

.enrollment-form {
  margin-bottom: 0;
}

.action-buttons {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.table-header .title {
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
}

.table-header .subtitle {
  font-size: 14px;
  color: #666;
}

.empty-state {
  padding: 60px 0;
}

.batch-preview {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin: 16px 0;
}

.preview-text {
  color: #409EFF;
  font-weight: 500;
  margin-top: 8px;
}

.import-content {
  padding: 20px 0;
}

.upload-area {
  text-align: center;
}

.template-download {
  margin-top: 16px;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.enrollment-content {
  padding: 0;
}

.enrollment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.student-count {
  font-weight: 600;
  color: #409EFF;
}
</style>