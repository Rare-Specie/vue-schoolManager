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
        <el-form-item>
          <el-button type="primary" @click="loadCourseGrades" :icon="Search">加载学生</el-button>
          <el-button @click="resetSelect" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 学生选课管理已移至学生详情页的“选课管理”Tab -->

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
        <span class="student-count" v-if="gradeStore.courseGrades.length > 0">
          共 {{ gradeStore.courseGrades.length }} 名学生
        </span>
      </div>
      
      <el-table
        ref="tableRef"
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
              placeholder="未录入"
              @change="handleScoreChange(row, $index)"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.gradeId ? 'success' : 'info'">
              {{ row.gradeId ? '已保存' : '未保存' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
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
            <el-button
              v-if="row.gradeId"
              size="small"
              type="danger"
              @click="deleteSingleGrade(row, $index)"
              :icon="Delete"
              plain
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 空状态处理 -->
    <el-card class="empty-card" v-else-if="selectForm.courseId && !gradeStore.loading">
      <el-empty
        description="该课程暂无选课学生或成绩数据"
        class="empty-state"
      >
        <template #description>
          <div class="empty-description">
            <p>该课程暂无选课学生或成绩数据</p> 
            <p class="empty-hint">请先确保：</p>
            <ul class="empty-list">
              <li>已选择正确的课程</li>
              <li>已为该课程添加选课学生</li>
            </ul>
          </div>
        </template>
        <div class="empty-actions">
          <el-button type="primary" @click="loadCourseGrades" :icon="Refresh">
            重新加载
          </el-button>
        </div>
      </el-empty>
    </el-card>

    <!-- 未选择课程时的提示 -->
    <el-card v-else-if="!selectForm.courseId && !gradeStore.loading" class="empty-card">
      <el-empty
        description="请先选择课程并加载学生数据"
        class="empty-state"
      >
        <template #description>
          <div class="empty-description">
            <p>请先选择课程并加载学生数据</p>
            <p class="empty-hint">操作步骤：</p>
            <ul class="empty-list">
              <li>1. 在上方选择课程</li>
              <li>2. 点击"加载学生"按钮</li>
            </ul>
          </div>
        </template>
      </el-empty>
    </el-card>

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
          title="请粘贴JSON格式的成绩数据，格式为：[{'studentId':'2024001','courseId':'CS101','score':85}]"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />
        <el-input
          v-model="importDialog.jsonData"
          type="textarea"
          :rows="10"
          placeholder='[{"studentId": "2024001", "courseId": "CS101", "score": 85}]'
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
              <el-tag :type="row.gradeId ? 'success' : 'info'">
                {{ row.gradeId ? '已保存' : '未保存' }}
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
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
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
  courseId: ''
})

// 选课表单
const enrollmentForm = reactive({
  studentId: ''
})

// 表格引用
const tableRef = ref<any>(null)

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
const handleCourseChange = async () => {
  gradeStore.courseGrades = []
  if (selectForm.courseId) {
    await loadCourseGrades()
  }
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
    // 使用课程的数据库ID
    const courseId = selectForm.courseId
    
    await courseStore.enrollStudentToCourse(courseId, enrollmentForm.studentId)
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

    // 使用课程的数据库ID
    const courseId = selectForm.courseId
    
    await courseStore.unenrollStudentFromCourse(courseId, enrollmentForm.studentId)
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
    // 使用课程的数据库ID
    const courseId = selectForm.courseId
    
    const students = await courseStore.fetchCourseStudents(courseId, 1000)
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

    // 使用课程的数据库ID
    const courseId = selectForm.courseId
    
    await courseStore.unenrollStudentFromCourse(courseId, row.studentId)
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
  
  // 查找当前选中的课程详情
  const currentCourse = courseStore.courses.find(c => c.id === selectForm.courseId)
  
  gradeStore.loading = true
  try {
    // 查找当前课程，获取课程编号用于成绩查询
    const currentCourse = courseStore.courses.find(c => c.id === selectForm.courseId)
    if (!currentCourse) {
      ElMessage.error('系统错误：找不到对应的课程信息')
      return
    }
    
    // 使用课程数据库ID获取选课学生
    const courseId = selectForm.courseId
    const students = await courseStore.fetchCourseStudents(courseId)
    
    // 使用课程编号获取成绩
    const courseCode = currentCourse.courseId
    let grades = []
    try {
      grades = await gradeStore.fetchCourseGrades(courseCode)
    } catch (gradeError) {
      // 如果获取成绩失败，可能是还没有成绩，继续处理
      grades = []
    }
    
    // 合并学生和成绩数据
    // 如果学生有成绩，显示成绩；如果没有成绩，显示空成绩字段
    gradeStore.courseGrades = students.map(student => {
      const grade = grades.find(g => g.studentId === student.studentId)
      return {
        studentId: student.studentId,
        name: student.name,
        class: student.class,
        score: grade ? grade.score : undefined,
        gradeId: grade ? grade.id : undefined
      }
    })
    
    if (gradeStore.courseGrades.length === 0) {
      ElMessage.info('该课程暂无选课学生，请先添加选课学生')
    } else {
      ElMessage.success(`已加载 ${gradeStore.courseGrades.length} 名学生`)
    }
  } catch (error) {
    ElMessage.error('加载学生列表失败，请检查课程是否正确')
  } finally {
    gradeStore.loading = false
  }
}

// 重置选择
const resetSelect = () => {
  selectForm.courseId = ''
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

  // 验证课程选择
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }

  // 查找当前课程的courseId
  const currentCourse = courseStore.courses.find(c => c.id === selectForm.courseId)
  
  if (!currentCourse) {
    ElMessage.error('系统错误：找不到对应的课程信息，请刷新页面重试')
    return
  }
  
  const courseCode = currentCourse.courseId

  // 额外验证：确保课程编号格式正确
  if (!courseCode || courseCode.trim() === '') {
    ElMessage.error('课程编号无效，请联系管理员')
    return
  }

  try {
    if (row.gradeId) {
      // 更新已有成绩
      await gradeStore.updateGradeInfo(row.gradeId, {
        score: row.score
      })
    } else {
      // 录入新成绩 - 使用课程编号而不是数据库ID
      const finalCourseId = courseCode && courseCode.includes('_') ? courseCode : courseCode
      
      const grade = await gradeStore.addGrade({
        studentId: row.studentId,
        courseId: finalCourseId,
        score: row.score
      })
      
      // 更新本地数据
      row.gradeId = grade.id
    }
    ElMessage.success(`学生 ${row.name} 成绩保存成功`)
  } catch (error) {
    // 错误已在store中处理
  }
}

// 删除单个成绩
const deleteSingleGrade = async (row: any, index: number) => {
  if (!row.gradeId) {
    ElMessage.warning('该学生没有成绩记录，无需删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除学生 ${row.name} 的成绩吗？`,
      '删除成绩',
      { type: 'warning' }
    )

    
    // 调用store的删除方法
    await gradeStore.removeGrade(row.gradeId)
    
    // 从本地数据中移除
    const currentIndex = gradeStore.courseGrades.findIndex(g => g.studentId === row.studentId)
    if (currentIndex !== -1) {
      gradeStore.courseGrades.splice(currentIndex, 1)
    }
    
    ElMessage.success(`成功删除学生 ${row.name} 的成绩`)
  } catch (cancel) {
    // 用户取消
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

  // 验证课程选择
  if (!selectForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }

  // 查找当前课程的courseId
  const currentCourse = courseStore.courses.find(c => c.id === selectForm.courseId)
  
  if (!currentCourse) {
    ElMessage.error('系统错误：找不到对应的课程信息，请刷新页面重试')
    return
  }
  
  const courseCode = currentCourse.courseId

  // 额外验证：确保课程编号格式正确
  if (!courseCode || courseCode.trim() === '') {
    ElMessage.error('课程编号无效，请联系管理员')
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
            score: row.score
          })
        } else {
          const grade = await gradeStore.addGrade({
            studentId: row.studentId,
            courseId: courseCode,
            score: row.score
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
  if (gradeStore.courseGrades.length === 0) {
    ElMessage.warning('暂无学生数据，请先加载学生')
    return
  }
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

    // 查找当前课程的courseId
    const currentCourse = courseStore.courses.find(c => c.id === selectForm.courseId)
    const courseCode = currentCourse ? currentCourse.courseId : selectForm.courseId
    
    // 自动填充当前课程编号
    const enrichedData = data.map(item => ({
      ...item,
      courseId: courseCode
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

  // 查找当前课程的courseId
  const currentCourse = courseStore.courses.find(c => c.id === selectForm.courseId)
  const courseCode = currentCourse ? currentCourse.courseId : selectForm.courseId
  
  const templateData = [
    {"studentId": "2024001", "courseId": courseCode, "score": 85},
    {"studentId": "2024002", "courseId": courseCode, "score": 92}
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

  // 查找当前课程，获取课程编号
  const currentCourse = courseStore.courses.find(c => c.id === selectForm.courseId)
  if (!currentCourse) {
    ElMessage.error('系统错误：找不到对应的课程信息')
    return
  }
  
  const courseCode = currentCourse.courseId

  try {
    await gradeStore.exportGradesData({
      courseId: courseCode
    })
  } catch (error) {
    // 错误已在store中处理
  }
}

onMounted(() => {
  loadCourses()
  loadStudents()
  // 每次打开成绩录入页面时重置选择
  resetSelect()
})

// 组件被激活时也执行重置（处理keep-alive缓存情况）
onActivated(() => {
  resetSelect()
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
  padding: 40px 0;
}

.empty-card {
  margin-bottom: 20px;
}

.empty-description {
  text-align: center;
  margin-bottom: 16px;
}

.empty-description p {
  margin: 8px 0;
  font-size: 16px;
  color: #606266;
}

.empty-hint {
  font-weight: 600;
  color: #303133 !important;
  margin-top: 16px !important;
}

.empty-list {
  list-style: none;
  padding: 0;
  margin: 8px 0;
  text-align: left;
  display: inline-block;
}

.empty-list li {
  padding: 4px 0;
  color: #909399;
  font-size: 14px;
}

.empty-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.student-count {
  font-weight: 600;
  color: #409EFF;
  margin-left: 12px;
  font-size: 14px;
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