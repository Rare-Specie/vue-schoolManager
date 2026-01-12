<template>
  <div class="course-list-container">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="课程编号/课程名称"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :icon="Search">查询</el-button>
          <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>
      
      <div class="action-buttons">
        <el-button type="success" @click="showAddDialog" :icon="Plus">添加课程</el-button>
      </div>
    </el-card>

    <!-- 课程列表 -->
    <el-card class="table-card">
      <el-table
        :data="courseStore.courses"
        v-loading="courseStore.loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="courseId" label="课程编号" width="120" align="center" />
        <el-table-column prop="name" label="课程名称" min-width="180" />
        <el-table-column prop="credit" label="学分" width="80" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.credit }}分</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="teacher" label="授课教师" width="140" align="center" />
        <el-table-column prop="description" label="课程描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)" :icon="View">查看</el-button>
            <el-button size="small" type="primary" @click="editCourse(row)" :icon="Edit">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteCourse(row)" :icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="courseStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑课程对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="550px"
      @close="resetDialogForm"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialog.form"
        :rules="dialog.rules"
        label-width="110px"
      >
        <el-form-item label="课程编号" prop="courseId">
          <el-input v-model="dialog.form.courseId" placeholder="请输入课程编号" :disabled="dialog.isEdit" />
        </el-form-item>
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="学分" prop="credit">
          <el-input-number 
            v-model="dialog.form.credit" 
            :min="0.5" 
            :max="10" 
            :step="0.5"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="授课教师" prop="teacher">
          <el-input v-model="dialog.form.teacher" placeholder="请输入授课教师" />
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="dialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入课程描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="dialog.loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Search, Refresh, Plus, View, Edit, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const courseStore = useCourseStore()

// 搜索表单
const searchForm = reactive({
  search: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10
})

// 对话框
const dialog = reactive({
  visible: false,
  title: '',
  isEdit: false,
  loading: false,
  currentId: '',
  form: {
    courseId: '',
    name: '',
    credit: 2,
    teacher: '',
    description: ''
  },
  rules: {
    courseId: [
      { required: true, message: '请输入课程编号', trigger: 'blur' }
    ],
    name: [
      { required: true, message: '请输入课程名称', trigger: 'blur' }
    ],
    credit: [
      { required: true, message: '请输入学分', trigger: 'blur' },
      { type: 'number', min: 0.5, max: 10, message: '学分必须在0.5-10之间', trigger: 'blur' }
    ]
  }
})

const dialogFormRef = ref<FormInstance>()

// 加载数据
const loadData = async () => {
  await courseStore.fetchCourses({
    search: searchForm.search,
    page: pagination.page,
    limit: pagination.limit
  })
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.search = ''
  pagination.page = 1
  loadData()
}

// 分页处理
const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadData()
}

// 显示添加对话框
const showAddDialog = () => {
  dialog.visible = true
  dialog.title = '添加课程'
  dialog.isEdit = false
  dialog.currentId = ''
  resetDialogForm()
}

// 编辑课程
const editCourse = (row: any) => {
  dialog.visible = true
  dialog.title = '编辑课程'
  dialog.isEdit = true
  dialog.currentId = row.id
  dialog.form = {
    courseId: row.courseId,
    name: row.name,
    credit: row.credit,
    teacher: row.teacher || '',
    description: row.description || ''
  }
}

// 查看详情
const viewDetail = (row: any) => {
  router.push(`/main/courses/${row.id}`)
}

// 删除课程
const deleteCourse = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除课程 ${row.name} 吗？`, '警告', {
      type: 'warning'
    })
    await courseStore.removeCourse(row.id)
    loadData()
  } catch (cancel) {
    // 用户取消
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!dialogFormRef.value) return

  await dialogFormRef.value.validate(async (valid) => {
    if (valid) {
      dialog.loading = true
      try {
        if (dialog.isEdit) {
          await courseStore.updateCourseInfo(dialog.currentId, dialog.form)
        } else {
          await courseStore.addCourse(dialog.form)
        }
        dialog.visible = false
        loadData()
      } catch (error) {
        // 错误已在store中处理
      } finally {
        dialog.loading = false
      }
    }
  })
}

// 重置对话框表单
const resetDialogForm = () => {
  dialog.form = {
    courseId: '',
    name: '',
    credit: 2,
    teacher: '',
    description: ''
  }
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
  loadData()
})
</script>

<style scoped>
.course-list-container {
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

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>