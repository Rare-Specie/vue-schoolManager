import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 应用启动时初始化认证状态
router.beforeEach(async (to, from, next) => {
  const pinia = createPinia()
  const { useAuthStore } = await import('@/stores/auth')
  const authStore = useAuthStore(pinia)
  
  // 如果有token，先初始化认证状态
  if (authStore.token && !authStore.user) {
    await authStore.init()
  }
  
  next()
})

app.mount('#app')
