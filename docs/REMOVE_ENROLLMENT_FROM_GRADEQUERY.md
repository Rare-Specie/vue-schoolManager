# 移除成绩查询中的学生选课管理模块

## 修改概述

从 `src/views/grades/GradeQuery.vue` 文件中完全移除了学生选课管理模块。

## 删除的内容

### 1. 模板部分

#### 删除的学生选课管理区域
- 位置：查询表单下方
- 内容：包含课程选择、学生选择、添加选课、查看已选学生按钮的整个区域
- 权限控制：仅对管理员和教师显示

#### 删除的已选学生对话框
- 标题：已选学生列表
- 宽度：600px
- 功能：显示课程已选学生列表，支持移除学生

### 2. 脚本部分

#### 删除的导入
- `User` 图标从 `@element-plus/icons-vue`

#### 删除的响应式数据
- `enrollmentForm` - 选课表单（courseId, studentId）
- `enrollmentDialog` - 选课对话框状态（visible, loading, students）
- `studentOptions` - 学生选项（计算属性）
- `currentCourseName` - 当前课程名称（计算属性）
- `canEnroll` - 是否可以选课（计算属性）

#### 删除的函数
- `loadStudents()` - 加载学生列表
- `enrollStudent()` - 学生选课
- `showEnrollmentDialog()` - 显示选课对话框
- `refreshEnrollmentList()` - 刷新选课列表
- `removeStudentFromCourse()` - 从课程中移除学生
- `clearEnrollmentDialog()` - 清空选课对话框

#### 删除的 onMounted 调用
- `loadStudents()` 调用

### 3. 样式部分

#### 删除的CSS类
- `.enrollment-section` - 选课区域容器
- `.section-title` - 选课区域标题
- `.enrollment-form` - 选课表单
- `.enrollment-content` - 选课对话框内容
- `.enrollment-header` - 选课对话框头部
- `.student-count` - 学生计数样式

## 文件变化

- **原文件行数**：740行
- **修改后行数**：546行
- **删除行数**：194行

## 影响范围

### 功能变化
- ✅ 成绩查询功能完全保留
- ✅ 成绩编辑、删除功能保留
- ✅ 成绩导出、打印功能保留
- ❌ 移除了成绩查询页面内的学生选课管理功能

### 页面优化
- 界面更简洁，专注于成绩查询核心功能
- 减少了不必要的数据加载（学生列表）
- 提升了页面加载性能

## 后续建议

如果需要学生选课管理功能，建议：
1. 在【学生管理-选课列表】中使用
2. 或创建独立的选课管理页面
3. 避免在成绩查询页面混用不同功能模块

## 测试验证

建议测试以下功能确保修改正确：
1. 成绩查询（按学生、课程、班级、时间范围）
2. 成绩编辑
3. 成绩删除
4. 成绩导出（Excel/CSV）
5. 成绩打印
6. 页面加载性能
