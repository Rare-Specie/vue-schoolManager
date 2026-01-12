import './assets/main.css'

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

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 应用启动时的初始化逻辑
const initializeApp = async () => {
  // 延迟一小段时间，确保所有依赖都已加载
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // 从router导入auth store
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore(pinia)
  
  // 如果有token，尝试恢复登录状态（不阻塞应用启动）
  if (authStore.token && !authStore.isInitialized) {
    // 异步初始化，不影响页面渲染
    authStore.init().catch(() => {
      // 初始化失败也没关系，会在路由守卫中处理
    })
  }
  
  // 启动登录状态监控
  const { startAuthMonitor } = await import('@/utils/authMonitor')
  startAuthMonitor()
  
  // 启动会话自动保存
  const { startSessionAutoSave } = await import('@/utils/sessionRecovery')
  startSessionAutoSave()
}

// 启动应用
app.mount('#app')

// 执行初始化
initializeApp()
