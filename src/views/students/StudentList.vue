<template>
  <div class="student-list-container">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="班级">
          <el-input
            v-model="searchForm.class"
            placeholder="请输入班级"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="学号/姓名"
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
        <el-button type="success" @click="showAddDialog" :icon="Plus">添加学生</el-button>
        <el-button type="warning" @click="showImportDialog" :icon="Upload">批量导入</el-button>
        <el-button type="info" @click="exportData" :icon="Download">导出数据</el-button>
      </div>
    </el-card>

    <!-- 学生列表 -->
    <el-card class="table-card">
      <el-table
        :data="studentStore.students"
        v-loading="studentStore.loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="class" label="班级" width="120" align="center" />
        <el-table-column prop="gender" label="性别" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.gender === 'male' ? 'primary' : 'danger'">
              {{ row.gender === 'male' ? '男' : '女' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)" :icon="View">查看</el-button>
            <el-button size="small" type="primary" @click="editStudent(row)" :icon="Edit">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteStudent(row)" :icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="studentStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑学生对话框 -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.title"
      width="500px"
      @close="resetDialogForm"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialog.form"
        :rules="dialog.rules"
        label-width="100px"
      >
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="dialog.form.studentId" placeholder="请输入学号" :disabled="dialog.isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="班级" prop="class">
          <el-input v-model="dialog.form.class" placeholder="请输入班级" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="dialog.form.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="dialog.form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="dialog.form.email" placeholder="请输入邮箱" />
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

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="importDialog.visible"
      title="批量导入学生"
      width="600px"
    >
      <div class="import-content">
        <el-alert
          title="请粘贴JSON格式的学生数据，格式为：[{'studentId':'2024001','name':'张三','class':'计算机2401'}]"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />
        <el-input
          v-model="importDialog.jsonData"
          type="textarea"
          :rows="10"
          placeholder='[{"studentId": "2024001", "name": "张三", "class": "计算机2401", "gender": "male", "phone": "13800138000", "email": "zhangsan@example.com"}]'
        />
        <div class="template-download" style="margin-top: 12px">
          <el-button type="text" @click="downloadTemplate">下载JSON导入模板</el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="handleImport" :loading="studentStore.loading">
            开始导入
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentStore } from '@/stores/student'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { 
  Search, Refresh, Plus, Upload, Download, Document, 
  View, Edit, Delete 
} from '@element-plus/icons-vue'

const router = useRouter()
const studentStore = useStudentStore()

// 搜索表单
const searchForm = reactive({
  class: '',
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
    studentId: '',
    name: '',
    class: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    email: ''
  },
  rules: {
    studentId: [
      { required: true, message: '请输入学号', trigger: 'blur' }
    ],
    name: [
      { required: true, message: '请输入姓名', trigger: 'blur' }
    ],
    class: [
      { required: true, message: '请输入班级', trigger: 'blur' }
    ],
    gender: [
      { required: true, message: '请选择性别', trigger: 'change' }
    ],
    phone: [
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ],
    email: [
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ]
  }
})

const dialogFormRef = ref<FormInstance>()

// 导入对话框
const importDialog = reactive({
  visible: false,
  jsonData: '' as string
})

// 加载数据
const loadData = async () => {
  await studentStore.fetchStudents({
    class: searchForm.class,
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
  searchForm.class = ''
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
  dialog.title = '添加学生'
  dialog.isEdit = false
  dialog.currentId = ''
  resetDialogForm()
}

// 编辑学生
const editStudent = (row: any) => {
  dialog.visible = true
  dialog.title = '编辑学生'
  dialog.isEdit = true
  dialog.currentId = row.id
  dialog.form = {
    studentId: row.studentId,
    name: row.name,
    class: row.class,
    gender: row.gender || 'male',
    phone: row.phone || '',
    email: row.email || ''
  }
}

// 查看详情
const viewDetail = (row: any) => {
  router.push(`/main/students/${row.id}`)
}

// 删除学生
const deleteStudent = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除学生 ${row.name} 吗？`, '警告', {
      type: 'warning'
    })
    await studentStore.removeStudent(row.id)
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
          await studentStore.updateStudentInfo(dialog.currentId, dialog.form)
        } else {
          await studentStore.addStudent(dialog.form)
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
    studentId: '',
    name: '',
    class: '',
    gender: 'male',
    phone: '',
    email: ''
  }
}

// 显示导入对话框
const showImportDialog = () => {
  importDialog.visible = true
  importDialog.jsonData = ''
}

// 开始导入
const handleImport = async () => {
  if (!importDialog.jsonData.trim()) {
    ElMessage.warning('请输入JSON数据')
    return
  }

  try {
    const data = JSON.parse(importDialog.jsonData)
    if (!Array.isArray(data)) {
      ElMessage.error('数据格式错误：必须是数组格式')
      return
    }
    
    // 验证数据格式
    const isValid = data.every(item => 
      item.studentId && item.name && item.class
    )
    
    if (!isValid) {
      ElMessage.error('数据格式错误：每条记录必须包含studentId、name和class字段')
      return
    }

    await studentStore.importStudentsData(data)
    importDialog.visible = false
    loadData()
  } catch (error) {
    ElMessage.error('JSON格式错误，请检查输入')
  }
}

// 下载模板
const downloadTemplate = () => {
  const templateData = [
    {"studentId": "2024001", "name": "张三", "class": "计算机2401", "gender": "male", "phone": "13800138000", "email": "zhangsan@example.com"},
    {"studentId": "2024002", "name": "李四", "class": "计算机2401", "gender": "female", "phone": "13800138001", "email": "lisi@example.com"}
  ]
  
  const content = JSON.stringify(templateData, null, 2)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = '学生导入模板.json'
  link.click()
  window.URL.revokeObjectURL(url)
}

// 导出数据
const exportData = async () => {
  try {
    await studentStore.exportStudentsData()
  } catch (error) {
    // 错误已在store中处理
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
.student-list-container {
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
</style>