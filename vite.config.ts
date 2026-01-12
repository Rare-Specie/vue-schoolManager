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
    // 生产环境下禁用devTools以提升性能
    process.env.NODE_ENV === 'production' ? null : vueDevTools(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // 优化构建配置
  build: {
    // 减少chunk大小
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'element-plus': ['element-plus'],
          'echarts': ['echarts'],
          'utils': ['axios', 'crypto-js']
        }
      }
    }
  },
  // 开发服务器优化
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:21180', // 后端API地址
        changeOrigin: true,
        // 配置超时防止请求挂起
        timeout: 10000
        // 注意：不使用rewrite，因为后端API地址已经是 http://localhost:21180/api
        // 前端请求 /api/auth/login -> 代理转发到 http://localhost:21180/api/auth/login
      }
    },
    // HMR优化
    hmr: {
      overlay: false // 禁用错误覆盖层，避免卡死
    }
  }
})
