<template>
  <div class="statistics-overview-container">
    <!-- 关键指标卡片 -->
    <el-row :gutter="20" class="stats-cards" v-loading="statisticsStore.loading">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="card-content">
            <div class="icon-wrapper bg-blue">
              <UserFilled />
            </div>
            <div class="info">
              <div class="label">总学生数</div>
              <div class="value">{{ statisticsStore.overview?.totalStudents || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="card-content">
            <div class="icon-wrapper bg-green">
              <Notebook />
            </div>
            <div class="info">
              <div class="label">总课程数</div>
              <div class="value">{{ statisticsStore.overview?.totalCourses || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="card-content">
            <div class="icon-wrapper bg-orange">
              <Document />
            </div>
            <div class="info">
              <div class="label">成绩记录</div>
              <div class="value">{{ statisticsStore.overview?.totalGrades || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="card-content">
            <div class="icon-wrapper bg-purple">
              <TrendCharts />
            </div>
            <div class="info">
              <div class="label">平均分</div>
              <div class="value">{{ statisticsStore.overview?.avgScore?.toFixed(1) || 0 }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 统计图表 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>及格率分析</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="passRateChartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>成绩分布</span>
              <el-button size="small" @click="loadDistribution">刷新</el-button>
            </div>
          </template>
          <div class="chart-container">
            <div ref="distributionChartRef" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 班级统计表格 -->
    <el-card class="table-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>班级统计</span>
          <div class="header-actions">
            <el-input
              v-model="classSearch"
              placeholder="搜索班级"
              style="width: 200px"
              clearable
              @clear="loadClassStats"
            />
            <el-button type="primary" @click="loadClassStats" :icon="Search">查询</el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="filteredClassStats"
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
        <el-table-column prop="topStudents" label="优秀学生" min-width="200">
          <template #default="{ row }">
            <div v-if="row.topStudents && row.topStudents.length > 0">
              <el-tag
                v-for="student in row.topStudents.slice(0, 3)"
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

    <!-- 班级成绩详情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="80%"
      destroy-on-close
      @close="handleDialogClose"
    >
      <div v-loading="classDetailLoading">
        <el-table
          v-if="classDetailData.length > 0"
          :data="classDetailData"
          border
          stripe
          style="width: 100%"
          height="400"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="studentId" label="学号" width="120" align="center" />
          <el-table-column prop="studentName" label="姓名" width="120" align="center" />
          <el-table-column prop="class" label="班级" width="120" align="center">
            <template #default="{ row }">
              {{ row.class || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="courseName" label="课程" min-width="150" />
          <el-table-column prop="score" label="成绩" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getScoreTagType(row.score)" effect="dark">
                {{ row.score }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="录入时间" width="160" align="center">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>

        <div v-else-if="!classDetailLoading" style="text-align: center; padding: 40px; color: #909399;">
          暂无数据
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStatisticsStore } from '@/stores/statistics'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { Search, Refresh } from '@element-plus/icons-vue'
import { Notebook, UserFilled, Document, TrendCharts } from '@element-plus/icons-vue'

const router = useRouter()
const statisticsStore = useStatisticsStore()

// 图表引用
const passRateChartRef = ref<HTMLElement>()
const distributionChartRef = ref<HTMLElement>()

// 图表实例
let passRateChart: echarts.ECharts | null = null
let distributionChart: echarts.ECharts | null = null

// 班级搜索
const classSearch = ref('')

// 弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const classDetailData = ref<any[]>([])
const classDetailLoading = ref(false)
const currentClass = ref('')

// 过滤后的班级统计
const filteredClassStats = computed(() => {
  if (!classSearch.value) return statisticsStore.classStats
  return statisticsStore.classStats.filter(item => 
    item.class.includes(classSearch.value)
  )
})

// 加载统计概览
const loadOverview = async () => {
  try {
    await statisticsStore.fetchOverviewStats()
    // 概览加载完成后加载图表
    await loadPassRateChart()
  } catch (error) {
    // 错误已在store中处理
  }
}

// 加载及格率图表
const loadPassRateChart = async () => {
  if (!passRateChartRef.value || !statisticsStore.overview) return

  if (!passRateChart) {
    passRateChart = echarts.init(passRateChartRef.value)
  }

  const passRate = statisticsStore.overview.passRate
  const failRate = 100 - passRate

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `${params.name}: ${params.value.toFixed(2)}% (${params.percent.toFixed(2)}%)`
      }
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '及格情况',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: (params: any) => {
            return `${params.name}: ${params.value.toFixed(2)}%`
          }
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: [
          { value: passRate, name: '及格', itemStyle: { color: '#67C23A' } },
          { value: failRate, name: '不及格', itemStyle: { color: '#F56C6C' } }
        ]
      }
    ]
  }

  passRateChart.setOption(option)
}

// 加载成绩分布图表
const loadDistribution = async () => {
  try {
    await statisticsStore.fetchDistribution()
    renderDistributionChart()
  } catch (error) {
    // 错误已在store中处理
  }
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
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.range),
      axisLabel: {
        rotate: 0
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        data: data.map(item => ({
          value: item.count,
          itemStyle: {
            color: getBarColor(item.range)
          }
        })),
        label: {
          show: true,
          position: 'top',
          formatter: '{c}人'
        }
      }
    ]
  }

  distributionChart.setOption(option)
}

// 获取柱状图颜色
const getBarColor = (range: string) => {
  if (range.includes('90')) return '#67C23A'
  if (range.includes('80')) return '#409EFF'
  if (range.includes('70')) return '#E6A23C'
  if (range.includes('60')) return '#F56C6C'
  return '#909399'
}

// 加载班级统计
const loadClassStats = async () => {
  try {
    await statisticsStore.fetchClassStats()
  } catch (error) {
    // 错误已在store中处理
  }
}





// 处理弹窗关闭
const handleDialogClose = () => {
  classDetailData.value = []
  currentClass.value = ''
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

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 监听窗口大小变化，重绘图表
watch(() => [passRateChartRef.value, distributionChartRef.value], () => {
  if (passRateChart) passRateChart.resize()
  if (distributionChart) distributionChart.resize()
})

// 处理窗口大小变化的回调函数
const handleResize = () => {
  if (passRateChart) passRateChart.resize()
  if (distributionChart) distributionChart.resize()
}

onMounted(async () => {
  await loadOverview()
  await loadClassStats()
  await loadDistribution()

  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('resize', handleResize)
  
  // 清理图表实例
  if (passRateChart) {
    passRateChart.dispose()
    passRateChart = null
  }
  if (distributionChart) {
    distributionChart.dispose()
    distributionChart = null
  }
})
</script>

<style scoped>
.statistics-overview-container {
  padding: 0;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
  cursor: pointer;
  transition: transform 0.3s;
  overflow: hidden !important;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
  width: 100%;
  overflow: hidden !important;
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  flex-shrink: 0;
}

.bg-blue { background: linear-gradient(135deg, #409EFF, #337ECC); }
.bg-green { background: linear-gradient(135deg, #67C23A, #529B2E); }
.bg-orange { background: linear-gradient(135deg, #E6A23C, #C08E2D); }
.bg-purple { background: linear-gradient(135deg, #9B59B6, #8E44AD); }

.info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.chart-container {
  padding: 20px 0;
  min-height: 300px;
}

.table-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

/* 弹窗样式优化 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 确保弹窗内的表格滚动条正常工作 */
.el-dialog__body {
  padding: 20px;
}

.el-table {
  border-radius: 4px;
}

.el-table .el-tag {
  font-weight: bold;
}

/* 现代化滚动条样式 - Vue3风格 */
/* Webkit 浏览器 (Chrome, Safari, Edge) */
.statistics-overview-container ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.statistics-overview-container ::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.statistics-overview-container ::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
  transition: background 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.statistics-overview-container ::-webkit-scrollbar-thumb:hover {
  background: rgba(107, 114, 128, 0.7);
}

.statistics-overview-container ::-webkit-scrollbar-thumb:active {
  background: rgba(75, 85, 99, 0.8);
}

/* Firefox */
.statistics-overview-container {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

/* 强制隐藏卡片内的滚动条 */
.stat-card .el-card__body {
  padding: 0 !important;
  height: 100% !important;
  overflow: hidden !important;
}

/* 确保el-card本身没有滚动条 */
.stat-card {
  overflow: hidden !important;
}

.stat-card .el-card__body::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.stat-card .el-card__body {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}
</style>