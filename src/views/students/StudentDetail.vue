<template>
  <div class="student-detail-container">
    <el-page-header @back="goBack">
      <template #content>
        <span class="title">学生详情</span>
      </template>
    </el-page-header>

    <div class="content" v-loading="studentStore.detailLoading">
      <el-row :gutter="20" v-if="studentStore.currentStudent">
        <!-- 基本信息 -->
        <el-col :span="12">
          <el-card class="box-card">
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
                <el-button size="small" type="primary" @click="editStudent">编辑</el-button>
              </div>
            </template>
            <div class="info-list">
              <div class="info-item">
                <span class="label">学号：</span>
                <span class="value">{{ studentStore.currentStudent.studentId }}</span>
              </div>
              <div class="info-item">
                <span class="label">姓名：</span>
                <span class="value">{{ studentStore.currentStudent.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">班级：</span>
                <span class="value">{{ studentStore.currentStudent.class }}</span>
              </div>
              <div class="info-item">
                <span class="label">性别：</span>
                <span class="value">
                  <el-tag :type="studentStore.currentStudent.gender === 'male' ? 'primary' : 'danger'">
                    {{ studentStore.currentStudent.gender === 'male' ? '男' : '女' }}
                  </el-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="label">联系电话：</span>
                <span class="value">{{ studentStore.currentStudent.phone || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">邮箱：</span>
                <span class="value">{{ studentStore.currentStudent.email || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间：</span>
                <span class="value">{{ formatDate(studentStore.currentStudent.createdAt) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 成绩概览 -->
        <el-col :span="12">
          <el-card class="box-card">
            <template #header>
              <div class="card-header">
                <span>成绩概览</span>
                <el-button size="small" type="success" @click="refreshGrades">刷新</el-button>
              </div>
            </template>
            <div v-if="gradesOverview" class="grades-overview">
              <div class="grade-stats">
                <div class="stat-item">
                  <div class="stat-value">{{ gradesOverview.totalCourses || 0 }}</div>
                  <div class="stat-label">总课程数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ gradesOverview.avgScore?.toFixed(1) || 0 }}</div>
                  <div class="stat-label">平均分</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ gradesOverview.passRate || 0 }}%</div>
                  <div class="stat-label">及格率</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ gradesOverview.totalScore || 0 }}</div>
                  <div class="stat-label">总分</div>
                </div>
              </div>

              <el-divider>最近成绩</el-divider>
              
              <el-table :data="gradesOverview.recentGrades || []" size="small" border>
                <el-table-column prop="courseName" label="课程" />
                <el-table-column prop="score" label="成绩" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getScoreTagType(row.score)">
                      {{ row.score }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="semester" label="学期" width="100" align="center" />
              </el-table>
            </div>
            <div v-else class="empty-state">
              <el-empty description="暂无成绩数据" />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 操作记录 -->
      <el-card class="box-card" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>操作记录</span>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="(log, index) in operationLogs"
            :key="index"
            :timestamp="formatDate(log.createdAt)"
            placement="top"
          >
            <el-card>
              <h4>{{ log.action }}</h4>
              <p class="log-module">模块：{{ log.module }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <div v-if="operationLogs.length === 0" class="empty-state">
          <el-empty description="暂无操作记录" />
        </div>
      </el-card>
    </div>

    <!-- 编辑学生对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      title="编辑学生信息"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editDialog.form"
        :rules="editDialog.rules"
        label-width="100px"
      >
        <el-form-item label="学号" prop="studentId">
          <el-input v-model="editDialog.form.studentId" disabled />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editDialog.form.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="班级" prop="class">
          <el-input v-model="editDialog.form.class" placeholder="请输入班级" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="editDialog.form.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editDialog.form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editDialog.form.email" placeholder="请输入邮箱" />
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
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStudentStore } from '@/stores/student'
import { getOperationLogs } from '@/stores/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const route = useRoute()
const studentStore = useStudentStore()

const studentId = route.params.id as string

// 成绩概览
const gradesOverview = ref<any>(null)

// 操作日志
const operationLogs = ref<any[]>([])

// 编辑对话框
const editDialog = ref({
  visible: false,
  loading: false,
  form: {
    studentId: '',
    name: '',
    class: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    email: ''
  },
  rules: {
    name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
    class: [{ required: true, message: '请输入班级', trigger: 'blur' }],
    gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
    phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
  }
})

const editFormRef = ref<FormInstance>()

// 返回
const goBack = () => {
  router.push('/main/students')
}

// 加载学生详情
const loadStudentDetail = async () => {
  try {
    await studentStore.fetchStudentDetail(studentId)
    // 加载成绩概览，使用 student 的学号（studentId 字段）而非路由 id
    const sid = studentStore.currentStudent?.studentId
    await loadGradesOverview(sid)
    // 加载操作日志
    await loadOperationLogs()
  } catch (error) {
    ElMessage.error('加载学生详情失败')
  }
}

// 加载成绩概览
const loadGradesOverview = async (sid?: string) => {
  try {
    const overview = await studentStore.fetchStudentGradesOverview(sid)
    gradesOverview.value = overview
  } catch (error) {
    // 成绩数据可能不存在，不显示错误
    gradesOverview.value = null
  }
}

// 刷新成绩
const refreshGrades = () => {
  loadGradesOverview()
}

// 加载操作日志
const loadOperationLogs = async () => {
  try {
    const response = await getOperationLogs({ page: 1, limit: 10 })
    operationLogs.value = response.data
  } catch (error) {
    operationLogs.value = []
  }
}

// 显示编辑对话框
const editStudent = () => {
  if (!studentStore.currentStudent) return

  const student = studentStore.currentStudent
  editDialog.value.form = {
    studentId: student.studentId,
    name: student.name,
    class: student.class,
    gender: student.gender || 'male',
    phone: student.phone || '',
    email: student.email || ''
  }
  editDialog.value.visible = true
}

// 提交更新
const handleUpdate = async () => {
  if (!editFormRef.value) return

  await editFormRef.value.validate(async (valid) => {
    if (valid) {
      editDialog.value.loading = true
      try {
        await studentStore.updateStudentInfo(studentId, editDialog.value.form)
        editDialog.value.visible = false
        await loadStudentDetail()
      } catch (error) {
        // 错误已在store中处理
      } finally {
        editDialog.value.loading = false
      }
    }
  })
}

// 根据分数获取标签类型
const getScoreTagType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 60) return 'warning'
  return 'danger'
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
  if (!studentId) {
    ElMessage.error('学生ID不存在')
    goBack()
    return
  }
  loadStudentDetail()
})
</script>

<style scoped>
.student-detail-container {
  padding: 20px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.content {
  margin-top: 20px;
}

.box-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.info-list {
  padding: 16px 0;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #666;
  width: 100px;
  text-align: right;
  margin-right: 12px;
}

.value {
  color: #333;
  font-size: 14px;
}

.grades-overview {
  padding: 16px 0;
}

.grade-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.log-module {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>