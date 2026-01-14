<template>
  <div class="grade-query-container">
    <!-- 查询条件 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="学生学号">
          <el-input
            v-model="searchForm.studentId"
            :disabled="authStore.isStudent"
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

      <div class="action-buttons">
        <el-button 
          type="danger" 
          @click="batchDelete" 
          :icon="Delete" 
          :disabled="selectedRows.length === 0"
          v-if="authStore.isAdmin || authStore.isTeacher"
        >
          批量删除 ({{ selectedRows.length }})
        </el-button>
        <el-button type="info" @click="exportData" :icon="Download">导出JSON</el-button>
        <el-button type="warning" @click="printResults" :icon="Printer">打印</el-button>
        <span class="hint-text">如果班级未能正常显示，请点击重置</span>
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
        <el-table-column prop="createdAt" label="录入时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center" v-if="authStore.isAdmin || authStore.isTeacher">
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { useGradeStore } from '@/stores/grade'
import { useCourseStore } from '@/stores/course'
import { useStudentStore } from '@/stores/student'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Search, Refresh, Download, Printer, Edit, Delete } from '@element-plus/icons-vue'

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

// 分页
const pagination = reactive({
  page: 1,
  limit: 10
})

// 课程选项
const courseOptions = computed(() => courseStore.courses)

// 选中的记录
const selectedRows = ref<any[]>([])

// 编辑对话框
const editDialog = ref({
  visible: false,
  loading: false,
  currentId: '',
  studentName: '',
  courseName: '',
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

// 加载课程列表
const loadCourses = async () => {
  await courseStore.fetchCourses({ page: 1, limit: 100 })
}

// 搜索
const handleSearch = async () => {
  pagination.page = 1
  await loadGrades()
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

// 加载成绩数据（前端筛选）
const loadGrades = async () => {
  // 1. 获取所有成绩（不带筛选参数）
  const gradesResponse = await gradeStore.fetchGrades({ page: 1, limit: 10000 })
  let allGrades = gradesResponse.data || []

  // 2. 获取所有学生信息（用于班级筛选和补全）
  let studentClassMap = new Map()
  try {
    const studentsResponse = await studentStore.fetchStudents({ page: 1, limit: 10000 })
    studentsResponse.data.forEach(student => {
      studentClassMap.set(student.studentId, student.class)
    })
  } catch (error) {
    // 获取失败时，班级用'-'
  }

  // 3. 前端本地筛选
  let filtered = allGrades.filter(grade => {
    // 学号筛选
    if (searchForm.studentId && grade.studentId !== searchForm.studentId) return false;
    // 课程筛选
    if (searchForm.courseId) {
      const course = courseStore.courses.find(c => c.id === searchForm.courseId)
      if (course && grade.courseId !== course.courseId) return false;
    }
    // 班级筛选
    if (searchForm.class) {
      const stuClass = studentClassMap.get(grade.studentId) || grade.class || '-';
      if (!stuClass.includes(searchForm.class)) return false;
    }
    // 时间范围筛选
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      const created = grade.createdAt ? grade.createdAt.slice(0, 10) : ''
      const [startDate, endDate] = searchForm.timeRange
      if (startDate && endDate && (created < startDate || created > endDate)) return false;
    }
    return true;
  })

  // 4. 为每条记录补全班级信息
  gradeStore.grades = filtered.map(grade => ({
    ...grade,
    class: studentClassMap.get(grade.studentId) || grade.class || '-'
  }))
  gradeStore.total = gradeStore.grades.length
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

// 批量删除成绩
const batchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的成绩')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要批量删除选中的 ${selectedRows.value.length} 条成绩记录吗？删除后需要重新添加选课！！`,
      '批量删除警告',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )

    // 显示加载状态
    gradeStore.loading = true

    // 逐个删除选中的记录
    let successCount = 0
    let failCount = 0
    const failMessages: string[] = []

    for (const row of selectedRows.value) {
      try {
        // 使用 silent 模式避免重复显示成功消息
        await gradeStore.removeGrade(row.id, true)
        successCount++
      } catch (error) {
        failCount++
        failMessages.push(`${row.studentName} - ${row.courseName}`)
      }
    }

    // 显示结果
    if (failCount === 0) {
      ElMessage.success(`批量删除成功：${successCount} 条记录`)
    } else {
      ElMessage.warning(`批量删除完成：成功 ${successCount} 条，失败 ${failCount} 条`)
      if (failMessages.length > 0) {
        ElMessage.info(`失败记录：${failMessages.join('、')}`)
      }
    }

    // 清空选择
    selectedRows.value = []
    
    // 重新加载数据
    await loadGrades()

  } catch (cancel) {
    // 用户取消
  } finally {
    gradeStore.loading = false
  }
}

// 导出数据为JSON
const exportData = async () => {
  if (gradeStore.grades.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  // 生成导出数据
  const exportData = gradeStore.grades.map(grade => ({
    学号: grade.studentId,
    姓名: grade.studentName,
    课程: grade.courseName,
    成绩: grade.score,
    录入时间: formatDate(grade.createdAt)
  }))

  // 创建并下载JSON文件
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `成绩查询结果_${new Date().toISOString().split('T')[0]}.json`
  link.click()
  window.URL.revokeObjectURL(url)

  ElMessage.success(`已导出 ${exportData.length} 条成绩记录`)
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
  // 如果是学生角色，自动填充学号（使用 user.studentId）
  if (authStore.isStudent) {
    const sid = authStore.user?.studentId
    if (sid) {
      searchForm.studentId = sid
      handleSearch()
    } else {
      // 未绑定学号，提示并禁止查询
      searchForm.studentId = ''
      // 不自动查询，提示用户绑定学号
      // 使用 setTimeout 以避免 onMounted 中打断流程
      setTimeout(() => {
        ElMessage.warning('您的账号尚未绑定学号，无法查看个人成绩，请联系管理员绑定学号')
      }, 200)
    }
  }
})

// 每次组件被激活时刷新数据（用于在路由切换回来或 keep-alive 激活时）
onActivated(() => {
  loadCourses()
  if (authStore.isStudent) {
    const sid = authStore.user?.studentId
    if (sid) {
      searchForm.studentId = sid
      handleSearch()
    } else {
      searchForm.studentId = ''
      setTimeout(() => {
        ElMessage.warning('您的账号尚未绑定学号，无法查看个人成绩，请联系管理员绑定学号')
      }, 200)
    }
  } else {
    // 非学生角色，每次进入都刷新列表
    loadGrades()
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
  align-items: center;
}

.hint-text {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
  font-style: italic;
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