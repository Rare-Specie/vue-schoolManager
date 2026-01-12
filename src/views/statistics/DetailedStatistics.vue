<template>
  <div class="detailed-statistics-container">
    <!-- 查询条件 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="班级">
          <el-input
            v-model="searchForm.class"
            placeholder="请输入班级"
            clearable
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
        <el-form-item>
          <el-button type="primary" @click="loadData" :icon="Search">查询</el-button>
          <el-button @click="resetSearch" :icon="Refresh">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="action-buttons">
        <el-button type="success" @click="exportReport('pdf')" :icon="Document">导出PDF</el-button>
        <el-button type="info" @click="exportReport('excel')" :icon="Download">导出Excel</el-button>
      </div>
    </el-card>

    <!-- 课程统计详情 -->
    <el-card class="chart-card" v-if="searchForm.courseId">
      <template #header>
        <div class="card-header">
          <span>课程统计详情</span>
        </div>
      </template>
      <div v-if="statisticsStore.courseStats" class="course-stats-grid">
        <div class="stat-item">
          <div class="label">课程名称</div>
          <div class="value">{{ statisticsStore.courseStats.courseName }}</div>
        </div>
        <div class="stat-item">
          <div class="label">平均分</div>
          <div class="value">{{ statisticsStore.courseStats.avgScore.toFixed(1) }}</div>
        </div>
        <div class="stat-item">
          <div class="label">及格率</div>
          <div class="value">{{ statisticsStore.courseStats.passRate }}%</div>
        </div>
        <div class="stat-item">
          <div class="label">学生人数</div>
          <div class="value">{{ statisticsStore.courseStats.totalStudents }}</div>
        </div>
        <div class="stat-item">
          <div class="label">最高分</div>
          <div class="value">{{ statisticsStore.courseStats.highestScore }}</div>
        </div>
        <div class="stat-item">
          <div class="label">最低分</div>
          <div class="value">{{ statisticsStore.courseStats.lowestScore }}</div>
        </div>
      </div>
      <div class="chart-container">
        <div ref="courseChartRef" style="width: 100%; height: 300px;"></div>
      </div>
    </el-card>

    <!-- 班级统计详情 -->
    <el-card class="chart-card" v-if="searchForm.class || !searchForm.courseId">
      <template #header>
        <div class="card-header">
          <span>班级统计详情</span>
        </div>
      </template>
      <el-table
        :data="statisticsStore.classStats"
        v-loading="statisticsStore.loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="class" label="班级" width="120" align="center" />
        <el-table-column prop="totalStudents" label="学生数" width="100" align="center" />
        <el-table-column prop="avgScore" label="平均分" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getScoreTagType(row.avgScore)">
              {{ row.avgScore.toFixed(1) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="passRate" label="及格率" width="120" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.passRate"
              :color="getProgressColor(row.passRate)"
              :text-inside="true"
              :stroke-width="20"
            />
          </template>
        </el-table-column>
        <el-table-column prop="topStudents" label="优秀学生">
          <template #default="{ row }">
            <div v-if="row.topStudents && row.topStudents.length > 0">
              <el-tag
                v-for="student in row.topStudents.slice(0, 5)"
                :key="student.studentId"
                size="small"
                style="margin: 2px;"
              >
                {{ student.name }} ({{ student.score }})
              </el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 成绩分布分析 -->
    <el-card class="chart-card">
      <template #header>
        <div class="card-header">
          <span>成绩分布分析</span>
        </div>
      </template>
      <div class="chart-container">
        <div ref="distributionChartRef" style="width: 100%; height: 350px;"></div>
      </div>
      <div class="distribution-table" v-if="statisticsStore.distribution.length > 0">
        <el-table
          :data="statisticsStore.distribution"
          border
          stripe
          style="width: 100%"
        >
          <el-table-column prop="range" label="分数段" width="120" align="center" />
          <el-table-column prop="count" label="人数" width="100" align="center" />
          <el-table-column prop="percentage" label="占比" align="center">
            <template #default="{ row }">
              {{ row.percentage.toFixed(1) }}%
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 排名列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>排名列表</span>
          <div class="header-actions">
            <el-select
              v-model="rankingLimit"
              placeholder="显示数量"
              style="width: 120px"
              @change="loadRanking"
            >
              <el-option :value="10" label="前10名" />
              <el-option :value="20" label="前20名" />
              <el-option :value="50" label="前50名" />
            </el-select>
            <el-button type="primary" @click="loadRanking" :icon="Refresh">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="statisticsStore.ranking"
        v-loading="statisticsStore.loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column label="排名" width="100" align="center">
          <template #default="{ $index }">
            <el-tag
              :type="$index < 3 ? 'danger' : 'info'"
              effect="dark"
              size="large"
            >
              {{ $index + 1 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="studentId" label="学号" width="120" align="center" />
        <el-table-column prop="name" label="姓名" width="120" align="center" />
        <el-table-column prop="class" label="班级" width="120" align="center" />
        <el-table-column prop="totalScore" label="总分" width="100" align="center">
          <template #default="{ row }">
            <strong style="color: #409EFF;">{{ row.totalScore }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="avgScore" label="平均分" width="100" align="center">
          <template #default="{ row }">
            {{ row.avgScore.toFixed(1) }}
          </template>
        </el-table-column>
        <el-table-column prop="courseCount" label="课程数" width="100" align="center" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="viewStudentDetail(row)" :icon="View">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStatisticsStore } from '@/stores/statistics'
import { useCourseStore } from '@/stores/course'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { Search, Refresh, Download, Document, View } from '@element-plus/icons-vue'

const router = useRouter()
const statisticsStore = useStatisticsStore()
const courseStore = useCourseStore()

// 搜索表单
const searchForm = reactive({
  class: '',
  courseId: ''
})

// 排名数量
const rankingLimit = ref(10)

// 图表引用
const courseChartRef = ref<HTMLElement>()
const distributionChartRef = ref<HTMLElement>()

// 图表实例
let courseChart: echarts.ECharts | null = null
let distributionChart: echarts.ECharts | null = null

// 课程选项
const courseOptions = computed(() => courseStore.courses)

// 加载课程列表
const loadCourses = async () => {
  await courseStore.fetchCourses({ page: 1, limit: 100 })
}

// 加载数据
const loadData = async () => {
  // 加载班级统计
  if (searchForm.class || !searchForm.courseId) {
    await statisticsStore.fetchClassStats({
      class: searchForm.class,
      courseId: searchForm.courseId
    })
  }

  // 加载课程统计
  if (searchForm.courseId) {
    await statisticsStore.fetchCourseStats({
      courseId: searchForm.courseId
    })
    renderCourseChart()
  }

  // 加载分布数据
  await statisticsStore.fetchDistribution({
    class: searchForm.class,
    courseId: searchForm.courseId
  })
  renderDistributionChart()

  // 加载排名
  await loadRanking()
}

// 重置搜索
const resetSearch = () => {
  searchForm.class = ''
  searchForm.courseId = ''
  loadData()
}

// 加载排名
const loadRanking = async () => {
  try {
    await statisticsStore.fetchRanking({
      class: searchForm.class,
      courseId: searchForm.courseId,
      limit: rankingLimit.value
    })
  } catch (error) {
    // 错误已在store中处理
  }
}

// 渲染课程统计图表
const renderCourseChart = () => {
  if (!courseChartRef.value || !statisticsStore.courseStats) return

  if (!courseChart) {
    courseChart = echarts.init(courseChartRef.value)
  }

  const stats = statisticsStore.courseStats
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['平均分', '最高分', '最低分']
    },
    xAxis: {
      type: 'category',
      data: [stats.courseName]
    },
    yAxis: {
      type: 'value',
      max: 100
    },
    series: [
      {
        name: '平均分',
        type: 'bar',
        data: [stats.avgScore],
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '最高分',
        type: 'bar',
        data: [stats.highestScore],
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '最低分',
        type: 'bar',
        data: [stats.lowestScore],
        itemStyle: { color: '#F56C6C' }
      }
    ]
  }

  courseChart.setOption(option)
}

// 渲染分布图表
const renderDistributionChart = () => {
  if (!distributionChartRef.value || statisticsStore.distribution.length === 0) return

  if (!distributionChart) {
    distributionChart = echarts.init(distributionChartRef.value)
  }

  const data = statisticsStore.distribution
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.range)
    },
    yAxis: {
      type: 'value',
      name: '人数'
    },
    series: [
      {
        name: '人数',
        type: 'line',
        data: data.map(item => item.count),
        smooth: true,
        itemStyle: { color: '#9B59B6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(155, 89, 182, 0.5)' },
            { offset: 1, color: 'rgba(155, 89, 182, 0.1)' }
          ])
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  }

  distributionChart.setOption(option)
}

// 导出报表
const exportReport = async (format: 'pdf' | 'excel') => {
  const params: any = {
    type: searchForm.courseId ? 'course' : 'class',
    format
  }

  if (searchForm.class) params.class = searchForm.class
  if (searchForm.courseId) params.courseId = searchForm.courseId

  try {
    await statisticsStore.generateStatReport(params)
  } catch (error) {
    // 错误已在store中处理
  }
}

// 查看学生详情
const viewStudentDetail = (row: any) => {
  router.push(`/main/students/${row.studentId}`)
}

// 根据分数获取标签类型
const getScoreTagType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 80) return 'primary'
  if (score >= 70) return 'warning'
  return 'danger'
}

// 获取进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#67C23A'
  if (percentage >= 80) return '#409EFF'
  if (percentage >= 60) return '#E6A23C'
  return '#F56C6C'
}

// 监听窗口大小变化
watch(() => [courseChartRef.value, distributionChartRef.value], () => {
  if (courseChart) courseChart.resize()
  if (distributionChart) distributionChart.resize()
})

onMounted(async () => {
  await loadCourses()
  await loadData()

  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (courseChart) courseChart.resize()
    if (distributionChart) distributionChart.resize()
  })
})
</script>

<style scoped>
.detailed-statistics-container {
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

.chart-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.course-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-item .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-item .value {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.chart-container {
  padding: 20px 0;
  min-height: 300px;
}

.distribution-table {
  margin-top: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>