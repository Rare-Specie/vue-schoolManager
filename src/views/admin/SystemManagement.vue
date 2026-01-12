<template>
  <div class="system-management-container">
    <!-- 系统操作卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="8">
        <el-card class="action-card" shadow="hover">
          <div class="card-header">
            <span>数据备份</span>
            <el-button type="primary" size="small" @click="createBackup" :loading="systemStore.loading">
              创建备份
            </el-button>
          </div>
          <div class="card-content">
            <p>定期备份系统数据，防止数据丢失</p>
            <p class="tip">备份包含：学生、课程、成绩、用户等所有数据</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="action-card" shadow="hover">
          <div class="card-header">
            <span>日志管理</span>
            <el-button type="warning" size="small" @click="cleanLogs" :loading="systemStore.loading">
              清理日志
            </el-button>
          </div>
          <div class="card-content">
            <p>清理过期的系统日志，释放存储空间</p>
            <p class="tip">保留时间根据系统设置而定</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="action-card" shadow="hover">
          <div class="card-header">
            <span>系统设置</span>
            <el-button type="success" size="small" @click="showSettingsDialog">
              修改设置
            </el-button>
          </div>
          <div class="card-content">
            <p>配置系统运行参数</p>
            <p class="tip">包括备份间隔、日志保留时间等</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 备份列表 -->
    <el-card class="section-card">
      <template #header>
        <div class="card-header">
          <span>备份列表</span>
          <el-button size="small" @click="loadBackups" :icon="Refresh">刷新</el-button>
        </div>
      </template>

      <el-table
        :data="systemStore.backups"
        v-loading="systemStore.loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="name" label="备份名称" min-width="180" />
        <el-table-column prop="size" label="大小" width="120" align="center">
          <template #default="{ row }">
            {{ formatSize(row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" width="120" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" type="success" @click="restoreBackup(row)" :icon="RefreshLeft">
              恢复
            </el-button>
            <el-button size="small" type="danger" @click="deleteBackup(row)" :icon="Delete">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="systemStore.backups.length === 0" class="empty-state">
        <el-empty description="暂无备份数据" />
      </div>
    </el-card>

    <!-- 系统日志 -->
    <el-card class="section-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>系统日志</span>
          <div class="header-actions">
            <el-select
              v-model="logParams.level"
              placeholder="日志级别"
              style="width: 120px"
              clearable
            >
              <el-option label="信息" value="info" />
              <el-option label="警告" value="warning" />
              <el-option label="错误" value="error" />
            </el-select>
            <el-date-picker
              v-model="logParams.timeRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 220px"
            />
            <el-button type="primary" @click="loadLogs" :icon="Search">查询</el-button>
            <el-button type="info" @click="exportLogs" :icon="Download">导出</el-button>
          </div>
        </div>
      </template>

      <el-table
        :data="systemStore.logs"
        v-loading="systemStore.loading"
        border
        stripe
        style="width: 100%"
        max-height="400"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="level" label="级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)">
              {{ getLevelText(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="模块" width="120" align="center" />
        <el-table-column prop="message" label="日志内容" min-width="250" />
        <el-table-column prop="ip" label="IP地址" width="120" align="center" />
        <el-table-column prop="createdAt" label="时间" width="160" align="center">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="systemStore.total > 0">
        <el-pagination
          v-model:current-page="logParams.page"
          v-model:page-size="logParams.limit"
          :total="systemStore.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleLogSizeChange"
          @current-change="handleLogPageChange"
        />
      </div>

      <div v-if="systemStore.logs.length === 0 && !systemStore.loading" class="empty-state">
        <el-empty description="暂无日志数据" />
      </div>
    </el-card>

    <!-- 系统设置对话框 -->
    <el-dialog
      v-model="settingsDialog.visible"
      title="系统设置"
      width="500px"
      @open="loadSettings"
    >
      <el-form
        ref="settingsFormRef"
        :model="settingsDialog.form"
        :rules="settingsDialog.rules"
        label-width="140px"
      >
        <el-form-item label="备份间隔(天)" prop="backupInterval">
          <el-input-number
            v-model="settingsDialog.form.backupInterval"
            :min="1"
            :max="30"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="日志保留天数" prop="logRetentionDays">
          <el-input-number
            v-model="settingsDialog.form.logRetentionDays"
            :min="1"
            :max="365"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="最大登录尝试次数" prop="maxLoginAttempts">
          <el-input-number
            v-model="settingsDialog.form.maxLoginAttempts"
            :min="3"
            :max="10"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="会话超时时间(分钟)" prop="sessionTimeout">
          <el-input-number
            v-model="settingsDialog.form.sessionTimeout"
            :min="10"
            :max="120"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingsDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveSettings" :loading="settingsDialog.loading">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useSystemStore } from '@/stores/system'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Refresh, Delete, RefreshLeft, Search, Download } from '@element-plus/icons-vue'

const systemStore = useSystemStore()

// 日志查询参数
const logParams = reactive({
  page: 1,
  limit: 10,
  level: '',
  timeRange: [] as string[]
})

// 系统设置对话框
const settingsDialog = ref({
  visible: false,
  loading: false,
  form: {
    backupInterval: 7,
    logRetentionDays: 30,
    maxLoginAttempts: 5,
    sessionTimeout: 30
  },
  rules: {
    backupInterval: [
      { required: true, message: '请输入备份间隔', trigger: 'blur' }
    ],
    logRetentionDays: [
      { required: true, message: '请输入日志保留天数', trigger: 'blur' }
    ],
    maxLoginAttempts: [
      { required: true, message: '请输入最大登录尝试次数', trigger: 'blur' }
    ],
    sessionTimeout: [
      { required: true, message: '请输入会话超时时间', trigger: 'blur' }
    ]
  }
})

const settingsFormRef = ref<FormInstance>()

// 创建备份
const createBackup = async () => {
  try {
    await ElMessageBox.confirm('确定要创建系统备份吗？', '提示', {
      type: 'info'
    })
    await systemStore.createSystemBackup()
  } catch (cancel) {
    // 用户取消
  }
}

// 加载备份列表
const loadBackups = async () => {
  await systemStore.fetchBackups()
}

// 恢复备份
const restoreBackup = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复备份 ${row.name} 吗？此操作将覆盖当前数据，且不可恢复！`,
      '警告',
      { type: 'warning' }
    )
    await systemStore.restoreSystemBackup(row.id)
  } catch (cancel) {
    // 用户取消
  }
}

// 删除备份
const deleteBackup = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除备份 ${row.name} 吗？`, '警告', {
      type: 'warning'
    })
    await systemStore.removeBackup(row.id)
  } catch (cancel) {
    // 用户取消
  }
}

// 加载日志
const loadLogs = async () => {
  const params: any = {
    page: logParams.page,
    limit: logParams.limit
  }

  if (logParams.level) params.level = logParams.level
  if (logParams.timeRange && logParams.timeRange.length === 2) {
    params.startTime = logParams.timeRange[0]
    params.endTime = logParams.timeRange[1]
  }

  await systemStore.fetchSystemLogs(params)
}

// 导出日志
const exportLogs = async () => {
  const params: any = {}
  if (logParams.level) params.level = logParams.level
  if (logParams.timeRange && logParams.timeRange.length === 2) {
    params.startTime = logParams.timeRange[0]
    params.endTime = logParams.timeRange[1]
  }

  try {
    await systemStore.exportSystemLogs(params)
  } catch (error) {
    // 错误已在store中处理
  }
}

// 清理日志
const cleanLogs = async () => {
  try {
    await ElMessageBox.confirm('确定要清理所有过期日志吗？此操作不可恢复！', '警告', {
      type: 'warning'
    })
    await systemStore.cleanSystemLogs()
  } catch (cancel) {
    // 用户取消
  }
}

// 显示设置对话框
const showSettingsDialog = () => {
  settingsDialog.value.visible = true
}

// 加载系统设置
const loadSettings = async () => {
  try {
    const settings = await systemStore.fetchSystemSettings()
    if (settings) {
      settingsDialog.value.form = { ...settings }
    }
  } catch (error) {
    // 错误已在store中处理
  }
}

// 保存设置
const saveSettings = async () => {
  if (!settingsFormRef.value) return

  await settingsFormRef.value.validate(async (valid) => {
    if (valid) {
      settingsDialog.value.loading = true
      try {
        await systemStore.updateSettings(settingsDialog.value.form)
        settingsDialog.value.visible = false
      } catch (error) {
        // 错误已在store中处理
      } finally {
        settingsDialog.value.loading = false
      }
    }
  })
}

// 日志分页处理
const handleLogPageChange = (page: number) => {
  logParams.page = page
  loadLogs()
}

const handleLogSizeChange = (size: number) => {
  logParams.limit = size
  logParams.page = 1
  loadLogs()
}

// 格式化大小
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

// 获取日志级别文本
const getLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    info: '信息',
    warning: '警告',
    error: '错误'
  }
  return levelMap[level] || level
}

// 获取日志级别标签类型
const getLevelTagType = (level: string) => {
  const typeMap: Record<string, string> = {
    info: 'info',
    warning: 'warning',
    error: 'danger'
  }
  return typeMap[level] || 'info'
}

onMounted(() => {
  loadBackups()
  loadLogs()
})
</script>

<style scoped>
.system-management-container {
  padding: 0;
}

.action-card {
  height: 140px;
  transition: transform 0.3s;
}

.action-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 12px;
}

.card-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.card-content .tip {
  color: #999;
  font-size: 12px;
  margin-top: 4px;
}

.section-card {
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>