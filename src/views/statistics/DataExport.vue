<template>
  <div class="data-export-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span>数据导出</span>
        </div>
      </template>
      
      <div class="placeholder-content">
        <el-empty description="功能开发中...">
          <template #description>
            <div class="placeholder-text">
              <p>数据导出功能正在开发中</p>
              <p class="sub-text">预计将在后续版本中提供</p>
            </div>
          </template>
        </el-empty>
        
        <div class="feature-list">
          <h4>计划支持的导出功能：</h4>
          <ul>
            <li>📊 成绩数据导出 (Excel/PDF)</li>
            <li>📈 统计报表导出</li>
            <li>📋 学生信息导出</li>
            <li>🎯 课程数据导出</li>
            <li>🔍 自定义筛选导出</li>
          </ul>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
// 数据导出功能 - 待开发
// 开发完成后，这里将包含：
// 1. 数据筛选条件
// 2. 导出格式选择 (Excel/PDF)
// 3. 导出范围选择
// 4. 进度显示
// 5. 下载功能
</script>

<style scoped>
.data-export-container {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.main-card {
  height: 100%;
  min-height: 400px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.placeholder-text {
  margin-bottom: 20px;
}

.placeholder-text p {
  margin: 8px 0;
  font-size: 16px;
  color: #606266;
}

.placeholder-text .sub-text {
  font-size: 14px;
  color: #909399;
}

.feature-list {
  margin-top: 30px;
  text-align: left;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
}

.feature-list h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.feature-list ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.feature-list li {
  margin: 8px 0;
  color: #606266;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.feature-list li::before {
  content: "•";
  margin-right: 8px;
  color: #409EFF;
  font-weight: bold;
  font-size: 18px;
}

@media (max-width: 768px) {
  .data-export-container {
    padding: 10px;
  }
  
  .placeholder-content {
    padding: 20px 10px;
  }
  
  .feature-list {
    padding: 15px;
  }
}
</style>