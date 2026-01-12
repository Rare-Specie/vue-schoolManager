/**
 * SHA256密码哈希测试脚本
 * 运行: npx tsx test-sha256.ts
 */

import { hashPassword, verifyPassword, generateSalt, hashPasswordWithSalt } from '../src/utils/crypto'

console.log('=== SHA256密码哈希测试 ===\n')

// 测试1: 基本哈希
const password = 'admin123'
const hashed = hashPassword(password)
console.log('原始密码:', password)
console.log('SHA256哈希:', hashed)
console.log('哈希长度:', hashed.length, '字符\n')

// 测试2: 相同密码产生相同哈希
const hashed2 = hashPassword(password)
console.log('相同密码哈希一致性:', hashed === hashed2 ? '✓ 通过' : '✗ 失败')

// 测试3: 不同密码产生不同哈希
const differentPassword = 'different123'
const differentHash = hashPassword(differentPassword)
console.log('不同密码哈希差异:', hashed !== differentHash ? '✓ 通过' : '✗ 失败')

// 测试4: 密码验证
const isValid = verifyPassword(password, hashed)
const isInvalid = verifyPassword('wrong', hashed)
console.log('正确密码验证:', isValid ? '✓ 通过' : '✗ 失败')
console.log('错误密码验证:', !isInvalid ? '✓ 通过' : '✗ 失败')

// 测试5: 盐值哈希
const salt = generateSalt()
const saltedHash = hashPasswordWithSalt(password, salt)
console.log('\n盐值测试:')
console.log('生成盐值:', salt)
console.log('盐值哈希:', saltedHash)
console.log('盐值哈希长度:', saltedHash.length, '字符')

// 测试6: 相同密码不同盐值产生不同哈希
const salt2 = generateSalt()
const saltedHash2 = hashPasswordWithSalt(password, salt2)
console.log('相同密码不同盐值:', saltedHash !== saltedHash2 ? '✓ 通过' : '✗ 失败')

// 测试7: 实际登录场景模拟
console.log('\n=== 登录场景模拟 ===')
const userInput = 'teacher123'
const storedHash = hashPassword(userInput) // 假设这是存储在数据库中的哈希

// 用户登录时
const loginInput = 'teacher123'
const loginHash = hashPassword(loginInput)
console.log('用户输入:', loginInput)
console.log('存储哈希:', storedHash)
console.log('登录哈希:', loginHash)
console.log('登录验证:', storedHash === loginHash ? '✓ 成功' : '✗ 失败')

// 错误密码
const wrongInput = 'teacher124'
const wrongHash = hashPassword(wrongInput)
console.log('错误密码:', wrongInput)
console.log('错误验证:', storedHash === wrongHash ? '✗ 失败' : '✓ 正确拒绝')

console.log('\n=== 所有测试完成 ===')