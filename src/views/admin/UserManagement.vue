<template>
  <div class="user-management-container">
    <!-- 搜索和操作栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm" @submit.prevent="handleSearch">
        <el-form-item label="角色">
          <el-select
            v-model="searchForm.role"
            placeholder="选择角色"
            clearable
            style="width: 120px"
          >
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="用户名/姓名"
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
        <el-button type="success" @click="showAddDialog" :icon="Plus">添加用户</el-button>
        <el-button type="warning" @click="showBatchAddDialog" :icon="UserFilled">批量添加</el-button>
        <el-button type="danger" @click="batchDelete" :icon="Delete" :disabled="selectedIds.length === 0">
          批量删除
        </el-button>
      </div>
    </el-card>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <el-table
        :data="userStore.users"
        v-loading="userStore.loading"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="username" label="用户名" width="120" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="role" label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRoleTagType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="class" label="班级" width="120" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click="editUser(row)" :icon="Edit">编辑</el-button>
            <el-button size="small" type="warning" @click="resetPwd(row)" :icon="Unlock">重置密码</el-button>
            <el-button size="small" type="danger" @click="deleteUser(row)" :icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="userStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑用户对话框 -->
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
        <el-form-item label="用户名" prop="username">
          <el-input v-model="dialog.form.username" placeholder="请输入用户名" :disabled="dialog.isEdit" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!dialog.isEdit">
          <el-input
            v-model="dialog.form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="dialog.form.role" placeholder="选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="教师" value="teacher" />
            <el-option label="学生" value="student" />
          </el-select>
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="dialog.form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="班级" prop="class" v-if="dialog.form.role === 'student'">
          <el-input v-model="dialog.form.class" placeholder="请输入班级" />
        </el-form-item>
        <el-form-item label="学号" prop="studentId" v-if="dialog.form.role === 'student'">
          <el-input v-model="dialog.form.studentId" placeholder="请输入学号（与学生记录绑定）" />
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

    <!-- 批量添加对话框 -->
    <el-dialog
      v-model="batchDialog.visible"
      title="批量添加用户"
      width="600px"
    >
      <div class="batch-add-content">
        <el-alert
          title="请按格式输入用户信息，每行一个用户"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />
        
        <el-input
          v-model="batchDialog.text"
          type="textarea"
          :rows="10"
          placeholder="用户名,密码,角色,姓名,班级,学号（可选，仅学生）
例如：
teacher001,pass123,teacher,李老师,,
student001,pass123,student,张三,计算机2401,2024001
student002,pass123,student,李四,计算机2401,2024002"
        />

        <div class="batch-preview" v-if="batchDialog.parsedData.length > 0">
          <p class="preview-title">解析结果预览：</p>
          <el-table :data="batchDialog.parsedData" border stripe size="small" max-height="200">
            <el-table-column prop="username" label="用户名" width="100" />
            <el-table-column prop="role" label="角色" width="80" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="class" label="班级" />
            <el-table-column prop="studentId" label="学号" width="140" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="parseBatchData" :icon="Search">解析</el-button>
          <el-button type="success" @click="submitBatchAdd" :loading="userStore.loading">
            开始导入
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPwdDialog.visible"
      title="重置密码"
      width="400px"
    >
      <el-form :model="resetPwdDialog.form" label-width="100px">
        <el-form-item label="用户名">
          <span>{{ resetPwdDialog.username }}</span>
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPwdDialog.form.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="resetPwdDialog.form.confirmPassword"
            type="password"
            placeholder="请确认新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPwdDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitResetPwd" :loading="resetPwdDialog.loading">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useStudentStore } from '@/stores/student'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Search, Refresh, Plus, Delete, Edit, Unlock, UserFilled } from '@element-plus/icons-vue'

const userStore = useUserStore()
const studentStore = useStudentStore()

// 搜索表单
const searchForm = reactive({
  role: '' as 'admin' | 'teacher' | 'student' | '',
  search: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10
})

// 选中的用户ID
const selectedIds = ref<string[]>([])

// 添加/编辑对话框
const dialog = reactive({
  visible: false,
  title: '',
  isEdit: false,
  loading: false,
  currentId: '',
  form: {
    username: '',
    password: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    name: '',
    class: '',
    studentId: ''
  },
  rules: {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度至少为6位', trigger: 'blur' }
    ],
    role: [
      { required: true, message: '请选择角色', trigger: 'change' }
    ],
    name: [
      { required: true, message: '请输入姓名', trigger: 'blur' }
    ],
    class: [
      // 班级在学生角色下必填
      { validator: (rule: any, value: string, callback: any) => {
        if (dialog.form.role === 'student' && !value) {
          callback(new Error('请输入班级'))
        } else {
          callback()
        }
      }, trigger: 'blur' }
    ],
    studentId: [
      // 当角色为学生时，学号必填
      { validator: (rule: any, value: string, callback: any) => {
        if (dialog.form.role === 'student' && !value) {
          callback(new Error('请输入学号'))
        } else {
          callback()
        }
      }, trigger: 'blur' }
    ]
  }
})

const dialogFormRef = ref<FormInstance>()

// 批量添加对话框
const batchDialog = ref({
  visible: false,
  text: '',
  parsedData: [] as any[]
})

// 重置密码对话框
const resetPwdDialog = ref({
  visible: false,
  loading: false,
  username: '',
  currentId: '',
  form: {
    newPassword: '',
    confirmPassword: ''
  }
})

// 加载数据
const loadData = async () => {
  const params: any = {
    search: searchForm.search,
    page: pagination.page,
    limit: pagination.limit
  }
  if (searchForm.role) {
    params.role = searchForm.role
  }
  await userStore.fetchUsers(params)
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  loadData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.role = ''
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

// 选择变化
const handleSelectionChange = (rows: any[]) => {
  selectedIds.value = rows.map(row => row.id)
}

// 显示添加对话框
const showAddDialog = () => {
  dialog.visible = true
  dialog.title = '添加用户'
  dialog.isEdit = false
  dialog.currentId = ''
  resetDialogForm()
}

// 编辑用户
const editUser = (row: any) => {
  dialog.visible = true
  dialog.title = '编辑用户'
  dialog.isEdit = true
  dialog.currentId = row.id
  dialog.form = {
    username: row.username,
    password: '',
    role: row.role,
    name: row.name,
    class: row.class || '',
    studentId: row.studentId || ''
  }
}

// 删除用户
const deleteUser = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${row.username} 吗？`, '警告', {
      type: 'warning'
    })
    await userStore.removeUser(row.id)
    loadData()
  } catch (cancel) {
    // 用户取消
  }
}

// 批量删除
const batchDelete = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要删除的用户')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个用户吗？`, '警告', {
      type: 'warning'
    })
    await userStore.batchDelete({ ids: selectedIds.value })
    selectedIds.value = []
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
          // 编辑时，如果密码为空则不更新密码
          const updateData: any = {
            role: dialog.form.role,
            name: dialog.form.name
          }
          if (dialog.form.class) updateData.class = dialog.form.class
          if (dialog.form.studentId) updateData.studentId = dialog.form.studentId
          
          await userStore.updateUserInfo(dialog.currentId, updateData)
        } else {
          await userStore.addUser({ ...dialog.form })
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
    username: '',
    password: '',
    role: 'student',
    name: '',
    class: '',
    studentId: ''
  }
}

// 显示批量添加对话框
const showBatchAddDialog = () => {
  batchDialog.value.visible = true
  batchDialog.value.text = ''
  batchDialog.value.parsedData = []
}

// 解析批量数据
const parseBatchData = () => {
  const lines = batchDialog.value.text.trim().split('\n')
  const parsed: any[] = []

  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim())
    if (parts.length >= 4) {
      const item = {
        username: parts[0],
        password: parts[1],
        role: parts[2] as 'admin' | 'teacher' | 'student',
        name: parts[3],
        class: parts[4] || '',
        studentId: parts[5] || ''
      }
      
      // 验证基本格式
      if (item.username && item.password && item.role && item.name) {
        parsed.push(item)
      }
    }
  }

  if (parsed.length === 0) {
    ElMessage.warning('未解析到有效数据，请检查格式')
    return
  }

  batchDialog.value.parsedData = parsed
  ElMessage.success(`解析成功，共 ${parsed.length} 条数据`)
}

// 提交批量添加
const submitBatchAdd = async () => {
  if (batchDialog.value.parsedData.length === 0) {
    ElMessage.warning('请先解析数据')
    return
  }

  // 预校验：对于 role === 'student' 的记录，若指定了 studentId 则验证该学号存在
  try {
    // 加载学生（取大量结果以覆盖可能的学号）
    await studentStore.fetchStudents({ page: 1, limit: 1000 })
    const missing: string[] = []

    for (const item of batchDialog.value.parsedData) {
      if (item.role === 'student') {
        if (!item.studentId) {
          missing.push(`${item.username}（缺少学号）`)
        } else {
          const found = studentStore.students.find((s: any) => s.studentId === item.studentId)
          if (!found) missing.push(`${item.username}（学号 ${item.studentId} 不存在）`)
        }
      }
    }

    if (missing.length > 0) {
      ElMessage.warning(`导入前校验未通过：\n${missing.slice(0, 5).join('\n')}${missing.length > 5 ? '\n...' : ''}`)
      return
    }

    await userStore.importUsersData({ users: batchDialog.value.parsedData })
    batchDialog.value.visible = false
    loadData()
  } catch (error) {
    // 错误已在store中处理
  }
}

// 显示重置密码对话框
const resetPwd = (row: any) => {
  resetPwdDialog.value.visible = true
  resetPwdDialog.value.username = row.username
  resetPwdDialog.value.currentId = row.id
  resetPwdDialog.value.form = { newPassword: '', confirmPassword: '' }
}

// 提交重置密码
const submitResetPwd = async () => {
  if (!resetPwdDialog.value.form.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (resetPwdDialog.value.form.newPassword.length < 6) {
    ElMessage.warning('密码长度至少为6位')
    return
  }
  if (resetPwdDialog.value.form.newPassword !== resetPwdDialog.value.form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  resetPwdDialog.value.loading = true
  try {
    await userStore.resetUserPassword(resetPwdDialog.value.currentId, resetPwdDialog.value.form.newPassword)
    resetPwdDialog.value.visible = false
  } catch (error) {
    // 错误已在store中处理
  } finally {
    resetPwdDialog.value.loading = false
  }
}

// 获取角色文本
const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: '管理员',
    teacher: '教师',
    student: '学生'
  }
  return roleMap[role] || role
}

// 获取角色标签类型
const getRoleTagType = (role: string) => {
  const typeMap: Record<string, string> = {
    admin: 'danger',
    teacher: 'warning',
    student: 'info'
  }
  return typeMap[role] || 'info'
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
.user-management-container {
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

.batch-add-content {
  padding: 10px 0;
}

.batch-preview {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.preview-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>