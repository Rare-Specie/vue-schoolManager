import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:21180', // 后端API地址
        changeOrigin: true
        // 注意：不使用rewrite，因为后端API地址已经是 http://localhost:21180/api
        // 前端请求 /api/auth/login -> 代理转发到 http://localhost:21180/api/auth/login
      }
    }
  }
})
