import './assets/main.css'
import './assets/scrollbar.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 全局错误处理，避免未捕获异常导致白屏
import { ElMessage } from 'element-plus'

// 全局死循环保护
let errorCount = 0
const MAX_ERROR_COUNT = 10

app.config.errorHandler = (err, vm, info) => {
  // 全局错误处理：在控制台记录错误信息以便排查
  // eslint-disable-next-line no-console
  console.error('全局错误捕获:', err, info)
  
  // 错误计数，防止死循环
  errorCount++
  if (errorCount > MAX_ERROR_COUNT) {
    // eslint-disable-next-line no-console
    console.error('错误次数过多，可能存在死循环，停止自动恢复')
    // 清除所有存储，强制用户重新登录
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear()
    }
    // 刷新页面
    window.location.reload()
    return
  }
  
  try {
    ElMessage.error('发生错误，正在恢复或请刷新页面')
  } catch (e) {
    // ignore
  }
  
  // 5秒后重置错误计数
  setTimeout(() => {
    errorCount = Math.max(0, errorCount - 1)
  }, 5000)
}

// 捕获未处理的 promise rejection
window.addEventListener('unhandledrejection', (event) => {
  // eslint-disable-next-line no-console
  console.error('未处理的 promise rejection:', event.reason)
  try {
    ElMessage.error('发生网络或运行错误，请检查控制台')
  } catch (e) {
    // ignore
  }
})

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 应用启动时的初始化逻辑 - 防止死循环
const initializeApp = async () => {
  // 延迟一小段时间，确保所有依赖都已加载
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // 从router导入auth store
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore(pinia)
  
  // 避免在路由守卫运行时进行初始化
  // 只在应用首次加载且在登录页面时尝试恢复
  const currentPath = window.location.pathname
  if (currentPath === '/' && authStore.token && !authStore.isInitialized) {
    // 异步初始化，不影响页面渲染
    // 添加超时防止无限等待
    const initPromise = authStore.init()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('初始化超时')), 3000)
    )
    
    Promise.race([initPromise, timeoutPromise]).catch(() => {
      // 初始化失败也没关系，会在路由守卫中处理
      // 初始化超时或失败，路由守卫会接手处理
    })
  }
  
  // 只在非登录页面启动监控和会话保存
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
    // 启动登录状态监控
    const { startAuthMonitor } = await import('@/utils/authMonitor')
    startAuthMonitor()
    
    // 启动会话自动保存
    const { startSessionAutoSave } = await import('@/utils/sessionRecovery')
    startSessionAutoSave()
  }
}

// 启动应用
app.mount('#app')

// 执行初始化
initializeApp()
