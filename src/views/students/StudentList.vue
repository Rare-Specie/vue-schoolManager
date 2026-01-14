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
        <el-table-column label="操作" width="220" fixed="right" align="center">
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
          :current-page="pagination.page"
          :page-size="pagination.limit"
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
          title="请粘贴JSON格式的学生数据"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />
        <el-row :gutter="16" style="margin-bottom: 12px">
          <el-col :span="12">
            <el-button type="primary" plain @click="downloadTemplate" style="width: 100%">
              下载导入模板
            </el-button>
          </el-col>
          <el-col :span="12">
            <el-button type="success" plain @click="showExample" style="width: 100%">
              查看示例
            </el-button>
          </el-col>
        </el-row>
        <el-input
          v-model="importDialog.jsonData"
          type="textarea"
          :rows="12"
          placeholder='请粘贴JSON数据，格式示例：
[
  {
    "studentId": "2024001",
    "name": "张三",
    "class": "计算机2401",
    "gender": "male",
    "phone": "13800138000",
    "email": "zhangsan@example.com"
  }
]

必填字段：studentId, name, class
可选字段：gender, phone, email'
        />
        <div style="margin-top: 12px; font-size: 12px; color: #666;">
          <p>📌 <strong>导入规则：</strong></p>
          <p>• 单次最多导入 1000 条数据</p>
          <p>• 学号必须唯一，格式为字母数字组合</p>
          <p>• 手机号为11位数字，邮箱需符合格式</p>
          <p>• 性别可选：male（男）或 female（女）</p>
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
const loadData = async (page?: number, limit?: number) => {
  // 优先使用显式传参（来自分页事件），否则使用当前 pagination
  const reqPage = typeof page === 'number' ? page : pagination.page
  const reqLimit = typeof limit === 'number' ? limit : pagination.limit

  console.log('[StudentList] loadData -> page:', reqPage, 'limit:', reqLimit, 'search:', searchForm)

  const response = await studentStore.fetchStudents({
    class: searchForm.class,
    search: searchForm.search,
    page: reqPage,
    limit: reqLimit
  })

  // 如果后端返回 page/limit，优先以后端为准；否则使用请求时的值，确保 UI 与请求一致
  if (response) {
    const respPage = typeof response.page === 'number' ? response.page : reqPage
    const respLimit = typeof response.limit === 'number' ? response.limit : reqLimit
    if (pagination.page !== respPage) pagination.page = respPage
    if (pagination.limit !== respLimit) pagination.limit = respLimit
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData(1, pagination.limit)
}

// 重置搜索
const resetSearch = () => {
  searchForm.class = ''
  searchForm.search = ''
  pagination.page = 1
  loadData(1, pagination.limit)
}

// 分页处理
const handlePageChange = (page: number) => {
  console.log('[StudentList] handlePageChange ->', page)
  pagination.page = page
  loadData(page, pagination.limit)
}

const handleSizeChange = (size: number) => {
  console.log('[StudentList] handleSizeChange ->', size)
  pagination.limit = size
  pagination.page = 1
  loadData(1, size)
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

// 显示示例数据
const showExample = () => {
  const example = [
    {
      "studentId": "2024001",
      "name": "张三",
      "class": "计算机2401",
      "gender": "male",
      "phone": "13800138000",
      "email": "zhangsan@example.com"
    },
    {
      "studentId": "2024002",
      "name": "李四",
      "class": "计算机2401",
      "gender": "female",
      "phone": "13800138001",
      "email": "lisi@example.com"
    },
    {
      "studentId": "2024003",
      "name": "王五",
      "class": "计算机2402",
      "gender": "male"
    }
  ]
  
  importDialog.jsonData = JSON.stringify(example, null, 2)
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
    if (data.length === 0) {
      ElMessage.warning('数据不能为空')
      return
    }

    // 批量大小限制
    if (data.length > 1000) {
      ElMessage.warning('单次导入不能超过1000条数据')
      return
    }

    // 详细验证每条记录
    const errors: string[] = []
    const validData = data.filter((item, index) => {
      const row = index + 1
      const errs: string[] = []
      
      if (!item.studentId) errs.push('学号')
      if (!item.name) errs.push('姓名')
      if (!item.class) errs.push('班级')
      
      // 验证学号格式（假设学号为数字或字母数字组合）
      if (item.studentId && !/^[a-zA-Z0-9]+$/.test(item.studentId)) {
        errs.push('学号格式不正确')
      }
      
      // 验证手机号（如果存在）
      if (item.phone && !/^1[3-9]\d{9}$/.test(item.phone)) {
        errs.push('手机号格式不正确')
      }
      
      // 验证邮箱（如果存在）
      if (item.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) {
        errs.push('邮箱格式不正确')
      }
      
      // 验证性别（如果存在）
      if (item.gender && !['male', 'female'].includes(item.gender)) {
        errs.push('性别必须是male或female')
      }
      
      if (errs.length > 0) {
        errors.push(`第${row}行: ${errs.join(', ')}`)
        return false
      }
      return true
    })

    if (errors.length > 0) {
      ElMessage.error(`数据验证失败：\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...等' + errors.length + '个错误' : ''}`)
      return
    }

    if (validData.length === 0) {
      ElMessage.warning('没有有效的数据')
      return
    }

    // 确认导入
    try {
      await ElMessageBox.confirm(
        `准备导入 ${validData.length} 条学生数据，是否继续？`,
        '导入确认',
        { type: 'warning' }
      )
    } catch (cancel) {
      return
    }

    await studentStore.importStudentsData(validData)
    importDialog.visible = false
    loadData()
  } catch (error) {
    if (error instanceof SyntaxError) {
      ElMessage.error('JSON格式错误，请检查输入')
    } else {
      ElMessage.error('导入过程出错')
    }
    console.error('导入错误:', error)
  }
}

// 下载模板
const downloadTemplate = () => {
  const templateData = [
    {
      "studentId": "2024001",
      "name": "张三",
      "class": "计算机2401",
      "gender": "male",
      "phone": "13800138000",
      "email": "zhangsan@example.com"
    },
    {
      "studentId": "2024002",
      "name": "李四",
      "class": "计算机2401",
      "gender": "female",
      "phone": "13800138001",
      "email": "lisi@example.com"
    },
    {
      "studentId": "2024003",
      "name": "王五",
      "class": "计算机2402",
      "gender": "male"
      // phone和email为可选字段
    }
  ]
  
  const templateInfo = {
    description: "学生数据导入模板",
    requiredFields: ["studentId", "name", "class"],
    optionalFields: ["gender", "phone", "email"],
    genderValues: "male 或 female",
    phoneFormat: "11位手机号，如：13800138000",
    emailFormat: "有效邮箱格式",
    data: templateData
  }
  
  const content = JSON.stringify(templateInfo, null, 2)
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

/* 紧凑的按钮样式 */
:deep(.el-table .cell) {
  display: flex;
  justify-content: center;
  gap: 4px;
}

:deep(.el-table .el-button + .el-button) {
  margin-left: 0;
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