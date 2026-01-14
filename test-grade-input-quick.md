# 成绩录入修复 - 快速测试指南

## 修复概述

**问题**: 录入成绩时返回409冲突错误  
**原因**: 成绩已存在，但代码尝试创建而非更新  
**解决**: 优先使用更新API，409错误自动转换为更新

## 修改的函数

### 1. `saveSingleGrade` (单个保存)
- ✅ 有gradeId → 直接更新
- ✅ 无gradeId → 先查找，存在则更新，不存在则创建
- ✅ 创建返回409 → 自动转为更新

### 2. `saveAllGrades` (批量保存)
- ✅ 先获取所有成绩建立查找表
- ✅ 为每个学生构建独立操作
- ✅ 多次发送API（按用户要求）
- ✅ 每个操作独立处理409错误

## 测试步骤

### 测试1: 单个成绩保存
```bash
# 操作
1. 进入成绩录入页面
2. 选择课程（如：JP01）
3. 修改一个学生的成绩（如：85分）
4. 点击该行的"保存"按钮

# 预期
✅ 提示"学生XXX成绩保存成功"
✅ 状态变为"已保存"
✅ 无409错误
```

### 测试2: 批量成绩保存
```bash
# 操作
1. 选择课程
2. 修改多个学生成绩（至少3个）
3. 点击"保存所有成绩"
4. 确认对话框

# 预期
✅ 提示"成功保存X条成绩"
✅ 所有修改的成绩都变为"已保存"
✅ 无409错误
```

### 测试3: 重复保存
```bash
# 操作
1. 保存某个学生的成绩
2. 再次修改并保存相同学生

# 预期
✅ 第二次也能成功
✅ 提示更新成功
✅ 无409错误
```

### 测试4: 批量录入功能
```bash
# 操作
1. 点击"批量录入"
2. 设置起始分数：60，步长：5
3. 点击"应用"
4. 点击"保存所有成绩"

# 预期
✅ 批量录入成功
✅ 所有成绩保存成功
✅ 无409错误
```

## 代码变更对比

### 修复前（saveSingleGrade）
```typescript
if (row.gradeId) {
  await updateGrade(row.gradeId, { score })
} else {
  try {
    await createGrade({ studentId, courseId, score })
  } catch (error) {
    if (error.isDuplicateError) {
      // 复杂的重试逻辑
      const existing = await fetchCourseGrades()
      const grade = existing.find(g => g.studentId === row.studentId)
      await updateGrade(grade.id, { score })
    }
  }
}
```

### 修复后（saveSingleGrade）
```typescript
if (row.gradeId) {
  await updateGrade(row.gradeId, { score })
} else {
  const existing = await fetchCourseGrades()
  const grade = existing.find(g => g.studentId === row.studentId)
  
  if (grade) {
    await updateGrade(grade.id, { score })
  } else {
    try {
      await createGrade({ studentId, courseId, score })
    } catch (error) {
      if (error.response?.status === 409) {
        await updateGrade(grade.id, { score })
      }
    }
  }
}
```

## 关键改进

1. **逻辑简化**: 减少嵌套，更易理解
2. **优先更新**: 符合"成绩已预设为0"的场景
3. **多次API**: 批量操作按用户要求实现
4. **错误处理**: 409自动转换，无需手动重试

## 预期结果

所有测试都应该：
- ✅ 无409冲突错误
- ✅ 成功保存/更新成绩
- ✅ 正确显示"已保存"状态
- ✅ 提示信息准确

## 如果仍有问题

请检查：
1. 浏览器控制台是否有错误
2. 网络请求是否正确（应为PUT而非POST）
3. 后端日志是否显示409错误
4. 数据库中是否已存在该成绩记录
