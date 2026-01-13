<template>
  <div class="enrollment-management-container">
    <el-card class="select-card">
      <el-form :inline="true" :model="form">
        <el-form-item label="选择课程" prop="courseId">
          <el-select v-model="form.courseId" placeholder="请选择课程" filterable clearable style="width: 280px" @change="handleCourseChange">
            <el-option v-for="course in courseOptions" :key="course.id" :label="`${course.name} (${course.courseId})`" :value="course.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="选择学生" prop="studentIds">
          <el-select v-model="form.studentIds" multiple filterable collapse-tags placeholder="可多选学生，按姓名/学号搜索" style="width: 380px">
            <el-option v-for="student in studentOptions" :key="student.id" :label="`${student.name}(${student.studentId})`" :value="student.studentId" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="success" :disabled="!canBatchEnroll" @click="batchEnroll">批量添加选课</el-button>
          <el-button type="info" @click="refreshLists">刷新</el-button>
        </el-form-item>
      </el-form>

      <div class="info-row" style="margin-top: 12px; display:flex; gap:12px; align-items:center;">
        <div>已选学生：<strong>{{ enrolledStudents.length }}</strong></div>
        <div v-if="enrolledStudents.length > 0">示例：{{ enrolledStudents.slice(0,3).map(s=>s.name).join('、') }}{{ enrolledStudents.length>3? '...' : '' }}</div>
      </div>
    </el-card>

    <el-card class="table-card" style="margin-top: 16px;">
      <div class="table-header">
        <span class="title">课程已选学生</span>
        <span class="subtitle">当前课程：{{ currentCourseName }}</span>
      </div>
      <el-table :data="enrolledStudents" size="small" border v-loading="loading" max-height="400">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        <el-table-column prop="name" label="姓名" width="140" align="center" />
        <el-table-column prop="class" label="班级" width="120" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="unenrollStudent(row.studentId)" :icon="Delete">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="enrolledStudents.length === 0" class="empty-state" style="padding:20px; text-align:center;">
        <el-empty description="当前课程暂无学生" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCourseStore } from '@/stores/course'
import { useStudentStore } from '@/stores/student'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'

const courseStore = useCourseStore()
const studentStore = useStudentStore()
const authStore = useAuthStore()

const form = ref({ courseId: '', studentIds: [] as string[] })

const courseOptions = computed(() => courseStore.courses)
const studentOptions = computed(() => studentStore.students)

const enrolledStudents = ref<any[]>([])
const loading = ref(false)

const currentCourseName = computed(() => {
  const c = courseStore.courses.find(c => c.id === form.value.courseId)
  return c ? `${c.name} (${c.courseId})` : ''
})

const canBatchEnroll = computed(() => {
  return Boolean(form.value.courseId && form.value.studentIds && form.value.studentIds.length > 0)
})

const loadCourses = async () => {
  await courseStore.fetchCourses({ page: 1, limit: 200 })
}

const loadStudents = async () => {
  await studentStore.fetchStudents({ page: 1, limit: 1000 })
}

const handleCourseChange = async (val: string) => {
  await refreshEnrolled()
}

const refreshEnrolled = async () => {
  if (!form.value.courseId) {
    enrolledStudents.value = []
    return
  }
  loading.value = true
  try {
    // 查找当前选中的课程，获取课程编号
    // 使用课程的数据库ID
    const courseId = form.value.courseId
    
    const students = await courseStore.fetchCourseStudents(courseId, 1000)
    enrolledStudents.value = students
  } catch (error) {
    // store already shows error, but also log for diagnosis
    console.error('[EnrollmentManagement] refreshEnrolled error:', error)
    enrolledStudents.value = []
  } finally {
    loading.value = false
  }
}

const refreshLists = async () => {
  await Promise.all([loadCourses(), loadStudents(), refreshEnrolled()])
}

const batchEnroll = async () => {
  if (!canBatchEnroll.value) return

  try {
    await ElMessageBox.confirm(`将为当前课程添加 ${form.value.studentIds.length} 名学生，是否继续？`, '确认批量添加', { type: 'warning' })
    
    // 使用课程的数据库ID
    const courseId = form.value.courseId
    const ids = form.value.studentIds
    let success = 0
    let skipped = 0
    let failed = 0

    // build set of already enrolled studentIds for dedup
    const already = new Set(enrolledStudents.value.map((s: any) => s.studentId))

    for (const sid of ids) {
      if (already.has(sid)) {
        skipped++
        continue
      }
      try {
        // enroll (sequential to avoid backend stress) - 使用课程数据库ID
        await courseStore.enrollStudentToCourse(courseId, sid)
        success++
      } catch (e) {
        failed++
        // log failure for diagnosis
        console.error('[EnrollmentManagement] batchEnroll failed for studentId:', sid, e)
      }
    }

    // 手动刷新选课学生列表（因为选课管理界面没有设置 currentCourse）
    await refreshEnrolled()
    let msg = `批量添加完成：成功 ${success}，跳过 ${skipped}`
    if (failed > 0) msg += `，失败 ${failed}`
    if (success > 0) ElMessage.success(msg)
    else ElMessage.info(msg)
    // clear selected students that were added
    form.value.studentIds = []
  } catch (cancel) {
    // user cancelled
  }
}

const unenrollStudent = async (studentId: string) => {
  if (!form.value.courseId) return
  try {
    await ElMessageBox.confirm('确定要从课程中移除该学生吗？这也会删除其成绩记录。', '确认移除', { type: 'warning' })
    
    // 使用课程的数据库ID
    const courseId = form.value.courseId
    
    await courseStore.unenrollStudentFromCourse(courseId, studentId)
    ElMessage.success('移除成功')
    await refreshEnrolled()
  } catch (cancel) {
    // canceled
  }
}

onMounted(() => {
  // 仅 admin/teacher 可用，但页面路由权限由路由守卫控制
  (async () => {
    try {
      await refreshLists()
    } catch (e) {
      console.error('[EnrollmentManagement] onMounted refreshLists error:', e)
    }
  })()
})
</script>

<style scoped>
.enrollment-management-container {
  padding: 20px;
}
.select-card {
  padding-bottom: 12px;
}
.table-card {
  margin-top: 12px;
}
.table-header {
  margin-bottom: 12px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}
.title { font-weight:600 }
.subtitle { color:#666 }
.empty-state { padding: 20px }
</style>
