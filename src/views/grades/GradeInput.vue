<template>
  <div class="grade-query-container">
    <!-- 查询条件 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
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
        <!-- 学号、班级、时间范围 筛选已移除 -->
        <el-form-item>
          <el-button type="success" @click="handleSearch" >确定</el-button>
          <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
          <span class="hint-text">如果不选择课程，则展示所有课程的成绩</span>
        </el-form-item>
      </el-form>

      <!-- 批量删除、导出JSON、打印按钮及提示文字已移除 -->
    </el-card>

    <!-- 查询结果 -->
    <el-card class="table-card">
      <div class="table-header">
        <span class="title">成绩录入</span>
        <span class="count" v-if="gradeStore.total > 0">共 {{ gradeStore.total }} 条记录</span>
      </div>

      <el-table
        v-if="hasSearched"
        :data="gradeStore.grades"
        v-loading="gradeStore.loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        <el-table-column prop="studentName" label="姓名" width="120" align="center" />
        <el-table-column prop="class" label="班级" width="120" align="center">
          <template #default="{ row }">
            {{ row.class || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="courseName" label="课程" min-width="180" />
        <el-table-column prop="score" label="成绩" width="160" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row._editedScore"
              :min="0"
              :max="100"
              :precision="1"
              :step="1"
              size="small"
              style="width:120px"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="录入时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center" v-if="authStore.isAdmin || authStore.isTeacher">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="saveScore(row)">保存</el-button>
            <el-button size="small" type="danger" @click="deleteGrade(row)" :icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="hasSearched && gradeStore.total > 0">
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
        v-if="hasSearched && !gradeStore.loading && gradeStore.grades.length === 0"
        description="暂无查询结果"
        class="empty-state"
      />
    </el-card>

    <!-- 编辑成绩对话框 -->
      <!-- 行内编辑已迁移到表格操作列 -->
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { useGradeStore } from '@/stores/grade'
import { useCourseStore } from '@/stores/course'
import { useStudentStore } from '@/stores/student'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'

const gradeStore = useGradeStore()
const courseStore = useCourseStore()
const studentStore = useStudentStore()
const authStore = useAuthStore()

// 搜索表单（已移除学生学号、班级、时间范围筛选）
const searchForm = reactive({
  courseId: ''
})

// 是否已执行过搜索，用于控制页面是否显示数据
const hasSearched = ref(false)

// 分页
const pagination = reactive({
  page: 1,
  limit: 10
})

// 课程选项
const courseOptions = computed(() => courseStore.courses)

// 行内编辑状态由每条记录的 `_editedScore` 字段控制（常驻输入框）

// 加载课程列表
const loadCourses = async () => {
  await courseStore.fetchCourses({ page: 1, limit: 100 })
}

// 搜索
const handleSearch = async () => {
  pagination.page = 1
  hasSearched.value = true
  await loadGrades()
}

// 重置搜索
const resetSearch = () => {
  searchForm.courseId = ''
  pagination.page = 1
  hasSearched.value = false
  gradeStore.grades = []
  gradeStore.total = 0
}

// 加载成绩数据（前端筛选）
const loadGrades = async () => {
  // 如果尚未执行搜索，则不加载数据
  if (!hasSearched.value) {
    gradeStore.grades = []
    gradeStore.total = 0
    return
  }

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

  // 3. 前端本地筛选（仅按课程筛选）
  let filtered = allGrades.filter(grade => {
    if (searchForm.courseId) {
      const course = courseStore.courses.find(c => c.id === searchForm.courseId)
      if (course && grade.courseId !== course.courseId) return false;
    }
    return true;
  })

  // 4. 为每条记录补全班级信息
  gradeStore.grades = filtered.map(grade => ({
    ...grade,
    class: studentClassMap.get(grade.studentId) || grade.class || '-',
    _editedScore: grade.score
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

// 已移除表格多选功能

// 编辑成绩
// 保存行内修改的成绩
const saveScore = async (row: any) => {
  const newScore = Number(row._editedScore)
  if (isNaN(newScore) || newScore < 0 || newScore > 100) {
    ElMessage.warning('成绩必须为 0-100 之间的数字')
    return
  }
  try {
    await gradeStore.updateGradeInfo(row.id, { score: newScore })
    // 更新本地展示值
    row.score = newScore
    ElMessage.success('成绩已保存')
    await loadGrades()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 提交更新（已迁移为行内确认，旧逻辑已移除）

// 删除成绩
const deleteGrade = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除 ${row.studentName} 的 ${row.courseName} 成绩吗？删除后需要重新添加选课！！`, '警告', {
      type: 'warning'
    })
    await gradeStore.removeGrade(row.id)
    await loadGrades()
  } catch (cancel) {
    // 用户取消
  }
}

// 批量删除功能已移除

// 导出功能已移除

// 打印功能已移除

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
})

// 若页面被 keep-alive 缓存，切换回该视图时触发刷新
onActivated(() => {
  pagination.page = 1
  loadCourses()
  if (hasSearched.value) {
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