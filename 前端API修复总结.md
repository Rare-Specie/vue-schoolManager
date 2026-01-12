# 前端API修复总结

## 修复概述

根据API文档检查，我们对Vue前端项目进行了以下修复，确保所有API调用与后端文档保持一致。

## 主要修复内容

### 1. 学生管理API (`src/stores/api/student.ts`)

#### 批量导入学生
- **修复前**: 使用FormData上传文件
- **修复后**: 发送JSON数组格式 `{students: [...]}`
- **API调用**: `POST /api/students/batch`

#### 导出学生数据
- **修复前**: 支持format参数（excel/csv）
- **修复后**: 移除format参数，返回JSON格式
- **API调用**: `GET /api/students/export`

### 2. 成绩管理API (`src/stores/api/grade.ts`)

#### 批量导入成绩
- **修复前**: 使用FormData上传文件
- **修复后**: 发送JSON数组格式 `{grades: [...]}`
- **API调用**: `POST /api/grades/batch`

#### 导出成绩数据
- **修复前**: 支持format参数（excel/csv）
- **修复后**: 移除format参数，返回JSON格式
- **API调用**: `GET /api/grades/export`

#### 添加semester参数
- **修复前**: GradeListParams缺少semester字段
- **修复后**: 添加semester?: string字段

### 3. 统计分析API (`src/stores/api/statistics.ts`)

#### 生成统计报表
- **修复前**: 返回类型为Blob
- **修复后**: 返回类型为any（根据实际后端实现）
- **API调用**: `GET /api/statistics/report`

### 4. 认证管理API (`src/stores/api/auth.ts`)

#### 移除不支持的接口
- **修复前**: 包含`PUT /api/user/profile`接口
- **修复后**: 注释掉该接口，并添加说明
- **说明**: 系统不支持此接口，如需更新用户信息请使用管理员权限调用`PUT /api/users/{id}`

### 5. 视图层修改

#### 学生列表视图 (`src/views/students/StudentList.vue`)
- **导入功能**: 从文件上传改为JSON文本输入
- **导出功能**: 移除格式选择，统一返回JSON
- **模板下载**: 提供JSON格式模板

#### 成绩录入视图 (`src/views/grades/GradeInput.vue`)
- **导入功能**: 从文件上传改为JSON文本输入
- **导出功能**: 移除格式选择，统一返回JSON
- **模板下载**: 提供JSON格式模板
- **自动填充**: 导入时自动填充当前课程ID和学期

## 数据格式变更

### 学生批量导入
```json
// 修复前：文件上传
// 修复后：JSON数组
[
  {"studentId": "2024001", "name": "张三", "class": "计算机2401", "gender": "male", "phone": "13800138000", "email": "zhangsan@example.com"}
]
```

### 成绩批量导入
```json
// 修复前：文件上传
// 修复后：JSON数组
[
  {"studentId": "2024001", "courseId": "CS101", "score": 85, "semester": "2024-1"}
]
```

### 导出数据
- **修复前**: Excel/CSV格式
- **修复后**: JSON格式

## 用户体验改进

### 1. 更直观的导入界面
- 提供清晰的JSON格式说明
- 实时数据验证
- 下载模板功能

### 2. 简化的导出流程
- 移除格式选择步骤
- 统一返回JSON格式
- 浏览器自动下载

### 3. 更好的错误提示
- JSON格式错误提示
- 数据字段验证
- 明确的错误信息

## 验证结果

✅ **构建成功**: 项目可以正常构建，无TypeScript错误
✅ **API一致**: 所有API调用与后端文档完全一致
✅ **类型安全**: 修复了所有TypeScript类型错误
✅ **功能完整**: 批量导入和导出功能正常工作

## 使用指南

### 批量导入学生/成绩
1. 点击"批量导入"按钮
2. 点击"下载JSON导入模板"获取格式示例
3. 按照模板格式准备JSON数据
4. 粘贴到文本框中
5. 点击"开始导入"

### 导出数据
1. 点击"导出数据"按钮
2. 浏览器会自动下载JSON文件

## 注意事项

1. **JSON格式要求**: 必须是有效的JSON数组格式
2. **必填字段**: 
   - 学生: studentId, name, class
   - 成绩: studentId, courseId, score
3. **数据验证**: 系统会自动验证数据格式和必填字段
4. **错误处理**: 详细的错误提示帮助用户修正数据

## 后续建议

1. **批量导入优化**: 考虑支持更大批量的数据导入
2. **数据预览**: 导入前提供数据预览功能
3. **错误详情**: 提供更详细的错误报告，指出具体哪条数据有问题
4. **进度显示**: 大批量导入时显示进度条

## 总结

通过本次修复，前端API调用已完全符合后端文档要求，解决了批量导入和导出功能的兼容性问题，提升了用户体验和数据处理的可靠性。