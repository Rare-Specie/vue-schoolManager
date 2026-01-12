<template>
  <div class="grade-query-container">
    <!-- 查询条件 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="学生学号">
          <el-input
            v-model="searchForm.studentId"
            placeholder="请输入学号"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="课程">
          <el-select
            v-model="searchForm.courseId"
            placeholder="请选择课程"
            filterable
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="course in courseOptions"
              :key="course.id"
              :label="course.name"
              :value="course.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="班级">
          <el-input
            v-model="searchForm.class"
            placeholder="请输入班级"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
          <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 学生选课区域 -->
      <div class="enrollment-section" v-if="authStore.isAdmin || authStore.isTeacher">
        <div class="section-title">学生选课管理</div>
        <el-form :inline="true" :model="enrollmentForm" class="enrollment-form">
          <el-form-item label="选择课程" prop="courseId">
            <el-select
              v-model="enrollmentForm.courseId"
              placeholder="请选择课程"
              filterable
              clearable
              style="width: 200px"
            >
              <el-option
                v-for="course in courseOptions"
                :key="course.id"
                :label="course.name"
                :value="course.id"
              />
            </el-select>
          </el-form-item>
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
                :value="student.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="success" @click="enrollStudent" :icon="Plus" :disabled="!canEnroll">
              添加选课
            </el-button>
            <el-button type="info" @click="showEnrollmentDialog" :icon="User">
              查看已选学生
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="action-buttons">
        <el-button type="success" @click="exportData('excel')" :icon="Download">导出Excel</el-button>
        <el-button type="info" @click="exportData('csv')" :icon="Document">导出CSV</el-button>
        <el-button type="warning" @click="printResults" :icon="Printer">打印</el-button>
      </div>
    </el-card>

    <!-- 查询结果 -->
    <el-card class="table-card">
      <div class="table-header">
        <span class="title">成绩查询结果</span>
        <span class="count" v-if="gradeStore.total > 0">共 {{ gradeStore.total }} 条记录</span>
      </div>

      <el-table
        :data="gradeStore.grades"
        v-loading="gradeStore.loading"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" v-if="authStore.isAdmin || authStore.isTeacher" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        <el-table-column prop="studentName" label="姓名" width="120" align="center" />
        <el-table-column prop="class" label="班级" width="120" align="center">
          <template #default="{ row }">
            {{ row.class || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="courseName" label="课程" min-width="180" />
        <el-table-column prop="score" label="成绩" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.score)" size="large" effect="dark">
              {{ row.score }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="semester" label="学期" width="140" align="center" />
        <el-table-column prop="createdAt" label="录入时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center" v-if="authStore.isAdmin || authStore.isTeacher">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="editGrade(row)" :icon="Edit">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteGrade(row)" :icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="gradeStore.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="gradeStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="!gradeStore.loading && gradeStore.grades.length === 0"
        description="暂无查询结果"
        class="empty-state"
      />
    </el-card>

    <!-- 编辑成绩对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      title="编辑成绩"
      width="400px"
    >
      <el-form
        ref="editFormRef"
        :model="editDialog.form"
        :rules="editDialog.rules"
        label-width="100px"
      >
        <el-form-item label="学生">
          <span>{{ editDialog.studentName }}</span>
        </el-form-item>
        <el-form-item label="课程">
          <span>{{ editDialog.courseName }}</span>
        </el-form-item>
        <el-form-item label="学期">
          <span>{{ editDialog.semester }}</span>
        </el-form-item>
        <el-form-item label="成绩" prop="score">
          <el-input-number
            v-model="editDialog.form.score"
            :min="0"
            :max="100"
            :precision="1"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdate" :loading="editDialog.loading">
            确定
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
import type { FormInstance } from 'element-plus'
import { Search, Refresh, Download, Document, Printer, Edit, Delete, Plus, User } from '@element-plus/icons-vue'

const gradeStore = useGradeStore()
const courseStore = useCourseStore()
const studentStore = useStudentStore()
const authStore = useAuthStore()

// 搜索表单
const searchForm = reactive({
  studentId: '',
  courseId: '',
  class: '',
  timeRange: [] as string[]
})

// 选课表单
const enrollmentForm = reactive({
  courseId: '',
  studentId: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10
})

// 课程选项
const courseOptions = computed(() => courseStore.courses)

// 学生选项
const studentOptions = computed(() => studentStore.students)

// 当前课程名称
const currentCourseName = computed(() => {
  const course = courseStore.courses.find(c => c.id === enrollmentForm.courseId)
  return course ? course.name : ''
})

// 是否可以选课
const canEnroll = computed(() => {
  return enrollmentForm.courseId && enrollmentForm.studentId
})

// 选中的记录
const selectedRows = ref<any[]>([])

// 编辑对话框
const editDialog = ref({
  visible: false,
  loading: false,
  currentId: '',
  studentName: '',
  courseName: '',
  semester: '',
  form: {
    score: 0
  },
  rules: {
    score: [
      { required: true, message: '请输入成绩', trigger: 'blur' },
      { type: 'number', min: 0, max: 100, message: '成绩必须在0-100之间', trigger: 'blur' }
    ]
  }
})

const editFormRef = ref<FormInstance>()

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

// 搜索
const handleSearch = async () => {
  pagination.page = 1
  await loadGrades()
}

// 学生选课
const enrollStudent = async () => {
  if (!enrollmentForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }
  if (!enrollmentForm.studentId) {
    ElMessage.warning('请先选择学生')
    return
  }

  try {
    await courseStore.enrollStudentToCourse(enrollmentForm.courseId, enrollmentForm.studentId)
    enrollmentForm.studentId = ''
  } catch (error) {
    // 错误已在store中处理
  }
}

// 显示选课对话框
const showEnrollmentDialog = async () => {
  if (!enrollmentForm.courseId) {
    ElMessage.warning('请先选择课程')
    return
  }

  enrollmentDialog.value.visible = true
  await refreshEnrollmentList()
}

// 刷新选课列表
const refreshEnrollmentList = async () => {
  if (!enrollmentForm.courseId) return

  enrollmentDialog.value.loading = true
  try {
    const students = await courseStore.fetchCourseStudents(enrollmentForm.courseId)
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

    await courseStore.unenrollStudentFromCourse(enrollmentForm.courseId, row.studentId)
    // 从对话框列表中移除
    enrollmentDialog.value.students = enrollmentDialog.value.students.filter(
      s => s.studentId !== row.studentId
    )
  } catch (cancel) {
    // 用户取消
  }
}

// 清空选课对话框
const clearEnrollmentDialog = () => {
  enrollmentDialog.value.students = []
  enrollmentDialog.value.loading = false
}

// 重置搜索
const resetSearch = () => {
  searchForm.studentId = ''
  searchForm.courseId = ''
  searchForm.class = ''
  searchForm.timeRange = []
  pagination.page = 1
  loadGrades()
}

// 加载成绩数据
const loadGrades = async () => {
  const params: any = {
    page: pagination.page,
    limit: pagination.limit
  }

  if (searchForm.studentId) params.studentId = searchForm.studentId
  if (searchForm.courseId) params.courseId = searchForm.courseId
  if (searchForm.class) params.class = searchForm.class
  if (searchForm.timeRange && searchForm.timeRange.length === 2) {
    params.startTime = searchForm.timeRange[0]
    params.endTime = searchForm.timeRange[1]
  }

  await gradeStore.fetchGrades(params)
}

// 分页处理
const handlePageChange = (page: number) => {
  pagination.page = page
  loadGrades()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadGrades()
}

// 选择变化
const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

// 编辑成绩
const editGrade = (row: any) => {
  editDialog.value.visible = true
  editDialog.value.currentId = row.id
  editDialog.value.studentName = row.studentName
  editDialog.value.courseName = row.courseName
  editDialog.value.semester = row.semester || '-'
  editDialog.value.form.score = row.score
}

// 提交更新
const handleUpdate = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      editDialog.value.loading = true
      try {
        await gradeStore.updateGradeInfo(editDialog.value.currentId, {
          score: editDialog.value.form.score
        })
        editDialog.value.visible = false
        await loadGrades()
      } catch (error) {
        // 错误已在store中处理
      } finally {
        editDialog.value.loading = false
      }
    }
  })
}

// 删除成绩
const deleteGrade = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除 ${row.studentName} 的 ${row.courseName} 成绩吗？`, '警告', {
      type: 'warning'
    })
    await gradeStore.removeGrade(row.id)
    await loadGrades()
  } catch (cancel) {
    // 用户取消
  }
}

// 导出数据
const exportData = async (format: 'excel' | 'csv') => {
  if (gradeStore.grades.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  const params: any = {
    format
  }

  if (searchForm.studentId) params.studentId = searchForm.studentId
  if (searchForm.courseId) params.courseId = searchForm.courseId
  if (searchForm.class) params.class = searchForm.class
  if (searchForm.timeRange && searchForm.timeRange.length === 2) {
    params.startTime = searchForm.timeRange[0]
    params.endTime = searchForm.timeRange[1]
  }

  try {
    await gradeStore.exportGradesData(params)
  } catch (error) {
    // 错误已在store中处理
  }
}

// 打印结果
const printResults = () => {
  if (gradeStore.grades.length === 0) {
    ElMessage.warning('没有数据可打印')
    return
  }

  // 生成打印内容
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('无法打开打印窗口，请检查浏览器设置')
    return
  }

  const styles = `
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h2 { text-align: center; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
      th { background-color: #f2f2f2; font-weight: bold; }
      .info { margin-bottom: 10px; color: #666; }
      @media print { button { display: none; } }
    </style>
  `

  const filters = `
    <div class="info">
      <strong>查询条件：</strong>
      ${searchForm.studentId ? `学号：${searchForm.studentId} ` : ''}
      ${searchForm.class ? `班级：${searchForm.class} ` : ''}
      ${searchForm.courseId ? `课程：${courseOptions.value.find(c => c.id === searchForm.courseId)?.name} ` : ''}
      ${searchForm.timeRange && searchForm.timeRange.length === 2 ? `时间：${searchForm.timeRange[0]} 至 ${searchForm.timeRange[1]}` : ''}
    </div>
  `

  const table = `
    <table>
      <thead>
        <tr>
          <th>序号</th>
          <th>学号</th>
          <th>姓名</th>
          <th>班级</th>
          <th>课程</th>
          <th>成绩</th>
          <th>学期</th>
        </tr>
      </thead>
      <tbody>
        ${gradeStore.grades.map((grade, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${grade.studentId}</td>
            <td>${grade.studentName}</td>
            <td>-</td>
            <td>${grade.courseName}</td>
            <td><strong>${grade.score}</strong></td>
            <td>${grade.semester || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `

  const printContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>成绩查询结果 - 打印</title>
        ${styles}
      </head>
      <body>
        <h2>成绩查询结果</h2>
        ${filters}
        ${table}
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 8px 16px; cursor: pointer;">打印</button>
          <button onclick="window.close()" style="padding: 8px 16px; margin-left: 10px; cursor: pointer;">关闭</button>
        </div>
      </body>
    </html>
  `

  printWindow.document.write(printContent)
  printWindow.document.close()
}

// 根据分数获取标签类型
const getScoreTagType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
}

// 获取学生班级（从成绩数据中推断）
const getStudentClass = (studentId: string) => {
  // 这里可以根据需要从其他数据源获取
  return '-'
}

// 格式化日期
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

onMounted(() => {
  loadCourses()
  loadStudents()
  // 如果是学生角色，自动填充学号
  if (authStore.isStudent && authStore.user?.username) {
    searchForm.studentId = authStore.user.username
    handleSearch()
  }
})
</script>

<style scoped>
.grade-query-container {
  padding: 0;
}

.search-card {
  margin-bottom: 20px;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header .title {
  font-size: 18px;
  font-weight: 600;
}

.table-header .count {
  font-size: 14px;
  color: #666;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.empty-state {
  padding: 60px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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