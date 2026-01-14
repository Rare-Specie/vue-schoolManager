<template>
  <div class="grade-input-container">
    <!-- 课程选择 -->
    <el-card class="course-card">
      <div class="course-selection">
        <span class="label">选择课程：</span>
        <el-select
          v-model="selectedCourseId"
          placeholder="请选择要录入成绩的课程"
          filterable
          clearable
          style="width: 300px"
          @change="handleCourseChange"
        >
          <el-option
            v-for="course in courseOptions"
            :key="course.id"
            :label="course.name"
            :value="course.id"
          />
        </el-select>
        <el-button 
          type="primary" 
          @click="loadCourseStudents" 
          :icon="Refresh"
          :disabled="!selectedCourseId"
          style="margin-left: 12px"
        >
          加载学生
        </el-button>
      </div>
    </el-card>

    <!-- 成绩录入表格 -->
    <el-card class="table-card" v-if="selectedCourseId && courseStudents.length > 0">
      <div class="table-header">
        <span class="title">成绩录入 - {{ currentCourseName }}</span>
        <span class="count">共 {{ courseStudents.length }} 名学生</span>
      </div>

      <el-table
        :data="courseStudents"
        v-loading="loading"
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
        <el-table-column label="成绩" width="180" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.score"
              :min="0"
              :max="100"
              :precision="1"
              :step="1"
              size="small"
              style="width: 120px"
              :disabled="!canEdit"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="success" 
              @click="saveGrade(row)" 
              :icon="Check"
              :disabled="!canEdit || !row.score"
            >
              保存
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deleteGrade(row)" 
              :icon="Delete"
              :disabled="!canEdit"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="courseStudents.length > 0">
        <el-button 
          type="success" 
          @click="batchSaveAll" 
          :icon="Check"
          :disabled="!canEdit"
        >
          保存所有已填写成绩
        </el-button>
        <el-button 
          type="danger" 
          @click="clearAllScores" 
          :icon="Delete"
          :disabled="!canEdit"
        >
          删除所有成绩（学生也将被移除）
        </el-button>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-card class="empty-card" v-else-if="selectedCourseId">
      <el-empty description="该课程暂无学生，请先为学生选课">
        <el-button type="primary" @click="loadCourseStudents" :icon="Refresh">
          重新加载
        </el-button>
      </el-empty>
    </el-card>

    <!-- 未选择课程时的提示 -->
    <el-card class="empty-card" v-if="!selectedCourseId">
      <el-empty description="请先选择一个课程开始录入成绩" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onActivated, computed } from 'vue'
import { useGradeStore } from '@/stores/grade'
import { useCourseStore } from '@/stores/course'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Check, Delete } from '@element-plus/icons-vue'

const gradeStore = useGradeStore()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// 课程选择
const selectedCourseId = ref('')
const currentCourseName = ref('')

// 课程选项
const courseOptions = computed(() => courseStore.courses)

// 课程学生列表（带成绩）
const courseStudents = ref<any[]>([])

// 加载状态
const loading = ref(false)

// 权限控制
const canEdit = computed(() => {
  return authStore.isAdmin || authStore.isTeacher
})

// 加载课程列表
const loadCourses = async () => {
  try {
    await courseStore.fetchCourses({ page: 1, limit: 100 })
  } catch (error) {
    ElMessage.error('加载课程列表失败')
  }
}

// 课程选择变化
const handleCourseChange = (courseId: string) => {
  if (courseId) {
    const course = courseStore.courses.find(c => c.id === courseId)
    currentCourseName.value = course ? course.name : ''
    // 清空现有数据，确保不会使用旧数据
    courseStudents.value = []
    // 自动加载学生
    loadCourseStudents()
  } else {
    currentCourseName.value = ''
    courseStudents.value = []
  }
}

// 加载课程学生和成绩
const loadCourseStudents = async () => {
  if (!selectedCourseId.value) {
    ElMessage.warning('请先选择课程')
    return
  }

  loading.value = true
  try {
    console.log('开始加载课程学生数据，课程ID:', selectedCourseId.value)
    
    // 1. 获取课程学生列表
    const students = await courseStore.fetchCourseStudents(selectedCourseId.value, 1000)
    console.log('获取到的原始学生数据:', students)
    
    // 2. 获取该课程已有的成绩记录
    const gradesResponse = await gradeStore.fetchGrades({
      courseId: selectedCourseId.value,
      limit: 1000
    })
    console.log('获取到的成绩数据:', gradesResponse.data)
    
    // 3. 将成绩数据合并到学生列表中
    const studentsWithScores = students.map(student => {
      // 查找该学生的成绩记录
      const gradeRecord = gradesResponse.data.find(
        g => g.studentId === student.studentId
      )
      
      const result = {
        ...student,
        // 统一字段名：将 name 转换为 studentName 以匹配表格显示
        studentName: student.name,
        // 如果已有成绩，使用现有成绩；否则为0
        score: gradeRecord ? gradeRecord.score : 0,
        // 保存成绩ID，用于更新操作
        gradeId: gradeRecord ? gradeRecord.id : null
      }
      
      return result
    })
    
    console.log('合并后的学生数据:', studentsWithScores)
    console.log('班级信息检查:', studentsWithScores.map(s => ({ name: s.studentName, class: s.class })))
    
    courseStudents.value = studentsWithScores
    ElMessage.success(`成功加载 ${studentsWithScores.length} 名学生`)
  } catch (error) {
    console.error('加载学生和成绩失败:', error)
    ElMessage.error('加载学生和成绩失败')
  } finally {
    loading.value = false
  }
}

// 保存单个成绩（新增或更新）
const saveGrade = async (row: any) => {
  if (!row.score || row.score < 0 || row.score > 100) {
    ElMessage.warning('请输入有效的成绩（0-100）')
    return
  }

  loading.value = true
  try {
    if (row.gradeId) {
      // 更新已有成绩 - 使用GradeQuery.vue中的更新方式
      await gradeStore.updateGradeInfo(row.gradeId, {
        score: row.score
      })
    } else {
      // 新增成绩 - 使用GradeQuery.vue中的更新方式（通过API）
      // 注意：这里使用addGrade，但交互方式与GradeQuery保持一致
      const newGrade = await gradeStore.addGrade({
        studentId: row.studentId,
        courseId: selectedCourseId.value,
        score: row.score
      })
      
      // 更新本地记录的gradeId
      row.gradeId = newGrade.id
    }
    
    ElMessage.success(`已保存 ${row.studentName} 的成绩：${row.score}分`)
  } catch (error: any) {
    // 处理成绩已存在的特殊情况
    if (error.isDuplicateError) {
      ElMessage.warning(`${row.studentName} 的成绩已存在，正在尝试更新...`)
      try {
        // 先查询该学生的成绩ID
        const gradesResponse = await gradeStore.fetchGrades({
          studentId: row.studentId,
          courseId: selectedCourseId.value,
          limit: 1
        })
        
        if (gradesResponse.data.length > 0 && gradesResponse.data[0]) {
          const existingGradeId = gradesResponse.data[0].id
          if (existingGradeId) {
            // 使用GradeQuery.vue中的更新方式
            await gradeStore.updateGradeInfo(existingGradeId, {
              score: row.score
            })
            // 更新本地记录
            row.gradeId = existingGradeId
            ElMessage.success(`已更新 ${row.studentName} 的成绩：${row.score}分`)
          } else {
            ElMessage.error('无法获取现有成绩ID')
          }
        }
      } catch (updateError) {
        ElMessage.error(`保存失败：${updateError}`)
      }
    }
  } finally {
    loading.value = false
  }
}

// 删除单个成绩
const deleteGrade = async (row: any) => {
  if (!row.gradeId) {
    ElMessage.warning('该学生暂无成绩可删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.studentName} 的成绩吗？`,
      '删除确认',
      { type: 'warning' }
    )
    
    loading.value = true
    // 使用GradeQuery.vue中的删除方式
    await gradeStore.removeGrade(row.gradeId)
    
    ElMessage.success('成绩删除成功')
    
    // 刷新学生列表
    await loadCourseStudents()
  } catch (cancel) {
    // 用户取消
  } finally {
    loading.value = false
  }
}

// 批量保存所有已填写的成绩
const batchSaveAll = async () => {
  const studentsToSave = courseStudents.value.filter(s => s.score && s.score > 0)
  
  if (studentsToSave.length === 0) {
    ElMessage.warning('没有需要保存的成绩')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要保存 ${studentsToSave.length} 名学生的成绩吗？`,
      '批量保存',
      { type: 'info' }
    )
    
    loading.value = true
    
    let successCount = 0
    let failCount = 0
    
    for (const student of studentsToSave) {
      try {
        await saveGrade(student)
        successCount++
      } catch (error) {
        failCount++
      }
    }
    
    if (failCount === 0) {
      ElMessage.success(`批量保存成功：${successCount} 条记录`)
    } else {
      ElMessage.warning(`批量保存完成：成功 ${successCount} 条，失败 ${failCount} 条`)
    }
  } catch (cancel) {
    // 用户取消
  } finally {
    loading.value = false
  }
}

// 清空所有成绩
const clearAllScores = async () => {
  const studentsWithGrades = courseStudents.value.filter(s => s.gradeId)
  
  if (studentsWithGrades.length === 0) {
    ElMessage.warning('没有需要清空的成绩')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除 ${studentsWithGrades.length} 名学生的成绩吗？学生也将会被一并删除！！！！`,
      '清空确认',
      { type: 'warning' }
    )
    
    loading.value = true
    
    let successCount = 0
    let failCount = 0
    
    for (const student of studentsWithGrades) {
      try {
        await gradeStore.removeGrade(student.gradeId, true)
        successCount++
      } catch (error) {
        failCount++
      }
    }
    
    if (failCount === 0) {
      ElMessage.success(`清空成功：${successCount} 条记录`)
    } else {
      ElMessage.warning(`清空完成：成功 ${successCount} 条，失败 ${failCount} 条`)
    }
    
    // 刷新学生列表
    await loadCourseStudents()
  } catch (cancel) {
    // 用户取消
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(async () => {
  await loadCourses()
  
  // 权限检查
  if (!authStore.isAdmin && !authStore.isTeacher) {
    ElMessage.warning('您没有成绩录入权限')
  }
})

// 每次进入界面时强制重新加载数据，确保班级信息完整
onActivated(async () => {
  console.log('成绩录入界面被激活，开始强制刷新数据...')
  
  // 1. 重置所有相关数据，确保班级信息不会残留
  courseStudents.value = []
  currentCourseName.value = ''
  
  // 2. 重新加载课程列表
  await loadCourses()
  
  // 3. 如果之前已经选择了课程，强制重新加载学生数据
  if (selectedCourseId.value) {
    console.log('检测到已选择课程，强制重新加载学生数据:', selectedCourseId.value)
    
    // 清空当前数据，确保不会使用缓存
    courseStudents.value = []
    
    // 强制重新加载
    await loadCourseStudents()
    
    // 验证班级信息是否加载成功
    if (courseStudents.value.length > 0) {
      const hasClassInfo = courseStudents.value.some(s => s.class)
      console.log(`班级信息加载验证: ${hasClassInfo ? '成功' : '失败'}`)
      if (!hasClassInfo) {
        console.warn('警告：班级信息未正确加载')
      }
    }
  }
})
</script>

<style scoped>
.grade-input-container {
  padding: 0;
}

.course-card {
  margin-bottom: 20px;
}

.course-selection {
  display: flex;
  align-items: center;
  gap: 12px;
}

.course-selection .label {
  font-weight: 600;
  color: #333;
}

.table-card {
  margin-bottom: 20px;
}

.empty-card {
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

.batch-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 现代化滚动条样式 */
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

* {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}
</style>