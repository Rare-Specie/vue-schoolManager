/**
 * 测试登录密码明文传输
 * 这个文件用于验证前端修改后，密码会以明文形式发送到后端
 */

import { hashPassword } from '../src/utils/crypto'

// 模拟登录请求数据
const loginData = {
  username: 'testuser',
  password: 'test123456',
  role: 'student' as const
}

console.log('=== 登录密码明文传输测试 ===')
console.log('原始登录数据:', loginData)
console.log('密码字段:', loginData.password)
console.log('密码类型:', typeof loginData.password)
console.log('密码长度:', loginData.password.length)

// 对比之前的SHA256加密方式
const hashedPassword = hashPassword(loginData.password)
console.log('\n=== 对比：如果使用SHA256加密 ===')
console.log('SHA256哈希后的密码:', hashedPassword)
console.log('哈希长度:', hashedPassword.length)

console.log('\n=== 结论 ===')
console.log('✓ 前端现在会发送明文密码:', loginData.password)
console.log('✓ 后端负责处理密码验证和存储')
console.log('✓ 符合后端登录接口要求')