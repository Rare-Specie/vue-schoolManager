# 课程学生显示限制修复总结

## 问题描述

在【学生管理-选课列表】和【学生管理-课程列表-查看】中只能显示10个学生，无法显示所有选课学生。

## 根本原因

1. `getCourseStudents` API 方法不支持 `limit` 参数
2. `fetchCourseStudents` store 方法未传递 `limit` 参数
3. 两个页面都未在调用时指定较大的 `limit` 值，导致后端返回默认的 10 条数据

## 解决方案

参照【学生管理-学生列表】中的解决方案，在 `StudentList.vue` 中调用 `fetchStudents({ page: 1, limit: 1000 })` 来获取所有学生。

### 修改清单

#### 1. 修改 `src/stores/api/course.ts`

**变更**：添加 `limit` 参数到 `getCourseStudents` 方法

```typescript
// 获取选课学生列表
export const getCourseStudents = (courseId: string, limit?: number): Promise<CourseStudent[]> => {
  // 后端可能返回 { data: CourseStudent[] }（分页/封装）或直接返回数组，这里统一返回数组
  const params: any = {}
  if (limit !== undefined) {
    params.limit = limit
  }
  return request.get(`/courses/${courseId}/students`, { params }).then((res: any) => {
    return res && res.data ? res.data : res
  })
}
```

**说明**：
- 支持可选的 `limit` 参数
- 当提供 `limit` 时，作为查询参数传递给后端

#### 2. 修改 `src/stores/course.ts`

**变更**：在 `fetchCourseStudents` 方法中添加 `limit` 参数且设置默认值为 1000

```typescript
// 获取选课学生
const fetchCourseStudents = async (courseId: string, limit: number = 1000) => {
  try {
    const students = await getCourseStudents(courseId, limit)
    courseStudents.value = students
    return students
  } catch (error) {
    ElMessage.error('获取选课学生失败')
    throw error
  }
}
```

**说明**：
- 添加 `limit` 参数，默认值为 1000（参照 StudentList）
- 调用 `getCourseStudents` 时传递 `limit` 参数

#### 3. 修改 `src/views/students/EnrollmentManagement.vue`

**变更**：在 `refreshEnrolled` 方法中调用 `fetchCourseStudents` 时传递 `limit: 1000`

```typescript
const refreshEnrolled = async () => {
  if (!form.value.courseId) {
    enrolledStudents.value = []
    return
  }
  loading.value = true
  try {
    const students = await courseStore.fetchCourseStudents(form.value.courseId, 1000)
    enrolledStudents.value = students
  } catch (error) {
    // store already shows error, but also log for diagnosis
    console.error('[EnrollmentManagement] refreshEnrolled error:', error)
    enrolledStudents.value = []
  } finally {
    loading.value = false
  }
}
```

**说明**：显式传递 `limit: 1000` 以获取所有选课学生

#### 4. 修改 `src/views/courses/CourseDetail.vue`

**变更**：在 `loadCourseStudents` 方法中调用 `fetchCourseStudents` 时传递 `limit: 1000`

```typescript
// 加载选课学生
const loadCourseStudents = async () => {
  try {
    await courseStore.fetchCourseStudents(courseId, 1000)
  } catch (error) {
    // 学生数据可能不存在，不显示错误
  }
}
```

**说明**：显式传递 `limit: 1000` 以获取所有选课学生

## 测试建议

1. 在某个课程中选择多于 10 个学生（推荐 50+ 个）
2. 在【学生管理-选课列表】中选择该课程，验证是否显示所有选课学生
3. 在【学生管理-课程列表】中进入该课程的详情页面，验证是否显示所有选课学生
4. 验证统计数据（平均分、及格率等）是否基于所有学生而非仅前 10 个

## 后端适配

后端需要支持 `limit` 查询参数，当前实现：
- 路径：`GET /api/courses/<courseId>/students`
- 参数：可选的 `limit` 参数
- 默认值：如后端默认值为 10，需要确保支持更大值

## 参考

- 【学生管理-学生列表】使用的参数：`{ page: 1, limit: 1000 }`
- StudentList.vue 中的 fetchStudents 调用
