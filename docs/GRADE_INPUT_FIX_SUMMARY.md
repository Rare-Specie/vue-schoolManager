# 成绩录入功能修复总结

## 问题描述

**时间**: 2026-01-13 17:09:01  
**错误**: POST `/api/grades` 返回409冲突  
**日志**:
```
(2026-01-13 17:09:01) [INFO    ] Request: 127.0.0.1:63907 0x136009218 HTTP/1.1 POST /api/grades
(2026-01-13 17:09:01) [INFO    ] Response: 0x136009218 /api/grades 409 1
```

## 根本原因

1. **成绩已存在**: 所有成绩已被预设为0，数据库中已有记录
2. **逻辑缺陷**: GradeInput.vue尝试使用POST创建成绩，导致409冲突
3. **处理复杂**: 原代码在创建失败后才尝试更新，流程繁琐

## 修复方案

### 核心原则
- **优先更新**: 因为成绩已预设为0，大部分情况应使用PUT更新
- **简化流程**: 参考GradeQuery.vue的编辑功能实现
- **多次API**: 批量操作时，为每个学生发送独立请求

### 修改文件

#### `/src/views/grades/GradeInput.vue`

##### 1. `saveSingleGrade` 函数（约520-620行）

**修复前逻辑**:
```
if (row.gradeId) {
  更新
} else {
  尝试创建
  如果失败且是409错误 {
    重新获取成绩ID
    更新
  }
}
```

**修复后逻辑**:
```
if (row.gradeId) {
  直接更新
} else {
  先查找是否已存在
  if (存在) {
    更新
  } else {
    创建
  }
  如果创建失败且是409错误 {
    更新
  }
}
```

**关键改进**:
- 优先使用更新API
- 409错误自动转换为更新
- 逻辑更清晰

##### 2. `saveAllGrades` 函数（约620-750行）

**修复前逻辑**:
```
for (const row of validGrades) {
  if (row.gradeId) {
    更新
  } else {
    检查是否存在
    if (存在) {
      更新
    } else {
      尝试创建
      如果失败且是409错误 {
        重新获取并更新
      }
    }
  }
}
```

**修复后逻辑**:
```
// 先获取所有成绩建立查找表
const existingGrades = await fetchCourseGrades(courseCode)

// 构建操作数组
const operations = validGrades.map(row => async () => {
  if (row.gradeId) {
    直接更新
  } else {
    查找是否存在
    if (存在) {
      更新
    } else {
      创建
    }
  }
  如果创建失败且是409错误 {
    更新
  }
})

// 执行所有操作
await Promise.all(operations.map(op => op()))
```

**关键改进**:
- 按用户要求：批量操作仅需多次发送API
- 每个操作独立处理错误
- 使用Promise.all并行执行

## 技术细节

### API使用策略

| 场景 | API方法 | 说明 |
|------|---------|------|
| 已知gradeId | `PUT /api/grades/{id}` | 直接更新 |
| 未知gradeId但已存在 | `PUT /api/grades/{id}` | 先查找后更新 |
| 确实不存在 | `POST /api/grades` | 创建新记录 |
| 创建返回409 | `PUT /api/grades/{id}` | 自动重试为更新 |

### 错误处理

```typescript
catch (error: any) {
  if (error.isDuplicateError || error.response?.status === 409) {
    // 自动转换为更新操作
    const existingGrade = await findGrade(row.studentId, courseCode)
    await updateGrade(existingGrade.id, { score: row.score })
  }
}
```

## 与GradeQuery.vue的一致性

GradeQuery.vue的编辑功能：
```typescript
// 简单直接的更新
await gradeStore.updateGradeInfo(row.id, { score: newScore })
```

GradeInput.vue修复后：
```typescript
// 也是简单直接的更新
await gradeStore.updateGradeInfo(gradeId, { score: row.score })
```

两者都使用相同的`updateGradeInfo`方法，确保逻辑一致。

## 验证方法

### 测试场景1：单个保存
1. 选择课程
2. 修改一个学生的成绩
3. 点击"保存"按钮
4. ✅ 应该成功，无409错误

### 测试场景2：批量保存
1. 选择课程
2. 修改多个学生成绩
3. 点击"保存所有成绩"
4. ✅ 应该批量成功，无409错误

### 测试场景3：重复操作
1. 保存成绩
2. 再次保存相同成绩
3. ✅ 应该成功更新，无错误

## 相关文件

- `/src/views/grades/GradeInput.vue` - 主要修复
- `/src/stores/grade.ts` - 未修改，已包含正确逻辑
- `/src/stores/api/grade.ts` - 未修改，API接口正常
- `/src/views/grades/GradeQuery.vue` - 参考实现

## 总结

本次修复遵循了用户的核心要求：
1. ✅ 使用成绩查询中的修改方案（直接更新）
2. ✅ 批量操作仅需多次发送API
3. ✅ 解决409冲突错误
4. ✅ 保持与现有代码的一致性

修复后的代码更简洁、更可靠，且与GradeQuery.vue的编辑功能保持一致。
