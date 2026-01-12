/**
 * 登录状态保持功能测试
 * 测试token管理、状态恢复和自动刷新机制
 */

import { createPinia } from 'pinia'
import { useAuthStore } from '../src/stores/auth'
import { tokenManager } from '../src/utils/tokenManager'

// 创建pinia实例
const pinia = createPinia()

// 测试函数
async function testLoginStatus() {
  console.log('=== 登录状态保持功能测试 ===\n')

  // 1. 测试Token管理器
  console.log('1. 测试Token管理器:')
  console.log('   - 初始状态:', tokenManager.isValid() ? '有效' : '无效')
  console.log('   - Token值:', tokenManager.getToken() || '无')
  console.log('   - 剩余时间:', tokenManager.getRemainingTime(), 'ms')
  console.log('   - 需要刷新:', tokenManager.needsRefresh() ? '是' : '否')

  // 2. 测试AuthStore
  console.log('\n2. 测试AuthStore:')
  const authStore = useAuthStore(pinia)
  console.log('   - 认证状态:', authStore.isAuthenticated ? '已登录' : '未登录')
  console.log('   - Token:', authStore.token ? '存在' : '不存在')
  console.log('   - 用户信息:', authStore.user ? '存在' : '不存在')

  // 3. 模拟登录状态
  console.log('\n3. 模拟登录状态:')
  const mockToken = 'test-token-' + Date.now()
  tokenManager.setToken(mockToken, 60 * 1000) // 1分钟过期
  
  console.log('   - 设置Token:', mockToken)
  console.log('   - Token有效:', tokenManager.isValid() ? '是' : '否')
  console.log('   - 剩余时间:', tokenManager.getRemainingTime(), 'ms')

  // 4. 测试状态恢复
  console.log('\n4. 测试状态恢复:')
  const authStore2 = useAuthStore(pinia)
  console.log('   - 新Store实例认证状态:', authStore2.isAuthenticated ? '已登录' : '未登录')
  console.log('   - 新Store实例Token:', authStore2.token ? '存在' : '不存在')

  // 5. 测试过期处理
  console.log('\n5. 测试过期处理:')
  console.log('   - 等待1秒后检查...')
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('   - Token有效:', tokenManager.isValid() ? '是' : '否')
  console.log('   - 剩余时间:', tokenManager.getRemainingTime(), 'ms')

  // 6. 清理测试数据
  console.log('\n6. 清理测试数据:')
  tokenManager.clear()
  console.log('   - 清理后Token有效:', tokenManager.isValid() ? '是' : '否')
  console.log('   - 清理后Token值:', tokenManager.getToken() || '无')

  console.log('\n=== 测试完成 ===')
}

// 运行测试
if (typeof window !== 'undefined') {
  // 浏览器环境
  testLoginStatus().catch(console.error)
} else {
  // Node.js环境（需要模拟）
  console.log('请在浏览器环境中运行此测试')
}

export { testLoginStatus }