// 测试成绩逻辑

// 模拟数据
const students = [
  { studentId: 'S001', name: '张三', class: '一班' },
  { studentId: 'S002', name: '李四', class: '一班' },
  { studentId: 'S003', name: '王五', class: '一班' }
]

const grades = [
  { id: 'G001', studentId: 'S001', score: 0 },
  { id: 'G002', studentId: 'S002', score: 85 },
  // S003 没有成绩记录
]

// 当前的合并逻辑
const result = students.map(student => {
  const grade = grades.find(g => g.studentId === student.studentId)
  return {
    studentId: student.studentId,
    name: student.name,
    class: student.class,
    score: grade ? grade.score : undefined,
    gradeId: grade ? grade.id : undefined
  }
})

console.log('合并结果:', JSON.stringify(result, null, 2))

// 验证每个学生的情况
result.forEach(r => {
  console.log(`${r.name}: score=${r.score}, gradeId=${r.gradeId}`)
})
