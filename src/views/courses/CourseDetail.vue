<template>
  <div class="course-detail-container">
    <el-page-header @back="goBack">
      <template #content>
        <span class="title">课程详情</span>
      </template>
    </el-page-header>

    <div class="content" v-loading="courseStore.detailLoading">
      <el-row :gutter="20" v-if="courseStore.currentCourse">
        <!-- 基本信息 -->
        <el-col :span="12">
          <el-card class="box-card">
            <template #header>
              <div class="card-header">
                <span>课程信息</span>
                <el-button size="small" type="primary" @click="editCourse">编辑</el-button>
              </div>
            </template>
            <div class="info-list">
              <div class="info-item">
                <span class="label">课程编号：</span>
                <span class="value">{{ courseStore.currentCourse.courseId }}</span>
              </div>
              <div class="info-item">
                <span class="label">课程名称：</span>
                <span class="value">{{ courseStore.currentCourse.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">学分：</span>
                <span class="value">
                  <el-tag type="success">{{ courseStore.currentCourse.credit }}分</el-tag>
                </span>
              </div>
              <div class="info-item">
                <span class="label">授课教师：</span>
                <span class="value">{{ courseStore.currentCourse.teacher || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">课程描述：</span>
                <span class="value">{{ courseStore.currentCourse.description || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间：</span>
                <span class="value">{{ formatDate(courseStore.currentCourse.createdAt) }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 选课学生 -->
        <el-col :span="12">
          <el-card class="box-card">
            <template #header>
              <div class="card-header">
                <span>选课学生 ({{ courseStore.courseStudents.length }}人)</span>
                <el-button size="small" type="success" @click="refreshStudents">刷新</el-button>
              </div>
            </template>
            <div v-if="courseStore.courseStudents.length > 0" class="students-list">
              <el-table
                :data="courseStore.courseStudents"
                border
                stripe
                size="small"
                max-height="400"
              >
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="studentId" label="学号" width="100" align="center" />
                <el-table-column prop="name" label="姓名" width="100" align="center" />
                <el-table-column prop="class" label="班级" width="100" align="center" />
                <el-table-column prop="score" label="成绩" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.score !== undefined" :type="getScoreTagType(row.score)">
                      {{ row.score }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="empty-state">
              <el-empty description="暂无选课学生" />
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 课程统计 -->
      <el-card class="box-card" style="margin-top: 20px;" v-if="courseStats">
        <template #header>
          <div class="card-header">
            <span>课程统计</span>
          </div>
        </template>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ courseStats.totalStudents }}</div>
            <div class="stat-label">总学生数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ courseStats.avgScore?.toFixed(1) || 0 }}</div>
            <div class="stat-label">平均分</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ courseStats.passRate || 0 }}%</div>
            <div class="stat-label">及格率</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ courseStats.highestScore || 0 }}</div>
            <div class="stat-label">最高分</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ courseStats.lowestScore || 0 }}</div>
            <div class="stat-label">最低分</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 编辑课程对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      title="编辑课程信息"
      width="550px"
    >
      <el-form
        ref="editFormRef"
        :model="editDialog.form"
        :rules="editDialog.rules"
        label-width="110px"
      >
        <el-form-item label="课程编号" prop="courseId">
          <el-input v-model="editDialog.form.courseId" disabled />
        </el-form-item>
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="editDialog.form.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="学分" prop="credit">
          <el-input-number 
            v-model="editDialog.form.credit" 
            :min="0.5" 
            :max="10" 
            :step="0.5"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="授课教师" prop="teacher">
          <el-input v-model="editDialog.form.teacher" placeholder="请输入授课教师" />
        </el-form-item>
        <el-form-item label="课程描述" prop="description">
          <el-input
            v-model="editDialog.form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入课程描述"
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
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCourseStore } from '@/stores/course'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const route = useRoute()
const courseStore = useCourseStore()

const courseId = route.params.id as string

// 课程统计
const courseStats = computed(() => {
  const students = courseStore.courseStudents
  if (students.length === 0) return null

  const scores = students.filter(s => s.score !== undefined).map(s => s.score!)
  const totalStudents = students.length
  const totalScored = scores.length
  
  if (totalScored === 0) return null

  const avgScore = scores.reduce((a, b) => a + b, 0) / totalScored
  const passCount = scores.filter(s => s >= 60).length
  const passRate = (passCount / totalScored) * 100
  const highestScore = Math.max(...scores)
  const lowestScore = Math.min(...scores)

  return {
    totalStudents,
    avgScore,
    passRate: passRate.toFixed(1),
    highestScore,
    lowestScore
  }
})

// 编辑对话框
const editDialog = ref({
  visible: false,
  loading: false,
  form: {
    courseId: '',
    name: '',
    credit: 2,
    teacher: '',
    description: ''
  },
  rules: {
    name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
    credit: [
      { required: true, message: '请输入学分', trigger: 'blur' },
      { type: 'number', min: 0.5, max: 10, message: '学分必须在0.5-10之间', trigger: 'blur' }
    ]
  }
})

const editFormRef = ref<FormInstance>()

// 返回
const goBack = () => {
  router.push('/main/courses')
}

// 加载课程详情
const loadCourseDetail = async () => {
  try {
    await courseStore.fetchCourseDetail(courseId)
    // 加载选课学生
    await loadCourseStudents()
  } catch (error) {
    ElMessage.error('加载课程详情失败')
  }
}

// 加载选课学生
const loadCourseStudents = async () => {
  try {
    await courseStore.fetchCourseStudents(courseId)
  } catch (error) {
    // 学生数据可能不存在，不显示错误
  }
}

// 刷新学生
const refreshStudents = () => {
  loadCourseStudents()
}

// 显示编辑对话框
const editCourse = () => {
  if (!courseStore.currentCourse) return

  const course = courseStore.currentCourse
  editDialog.value.form = {
    courseId: course.courseId,
    name: course.name,
    credit: course.credit,
    teacher: course.teacher || '',
    description: course.description || ''
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
        await courseStore.updateCourseInfo(courseId, editDialog.value.form)
        editDialog.value.visible = false
        await loadCourseDetail()
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
  if (!courseId) {
    ElMessage.error('课程ID不存在')
    goBack()
    return
  }
  loadCourseDetail()
})
</script>

<style scoped>
.course-detail-container {
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

.students-list {
  max-height: 400px;
  overflow-y: auto;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  padding: 16px 0;
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>