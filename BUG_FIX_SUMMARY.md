# Bug修复总结 - 网页卡死问题

## 问题描述
用户报告打开网页时卡死，需要解决此问题并检查其他潜在bug。

## 根本原因分析

### 1. 无限循环和过度渲染
- **MainLayout.vue**: `handleVisibilityChange` 函数可能被重复调用，导致无限循环
- **authStore**: 页面可见性检查没有时间间隔限制，可能频繁触发
- **tokenManager**: 周期性检查在登录页面也运行，造成不必要的开销

### 2. 内存泄漏
- **定时器未清理**: 多个组件的setInterval在卸载时未正确清理
- **事件监听器重复添加**: 相同的监听器被多次添加到window/document
- **闭包引用**: 某些回调函数持有对组件的引用，阻止垃圾回收

### 3. 竞态条件
- **路由守卫**: 多个异步操作同时进行，状态不一致
- **会话恢复**: 页面加载时多个恢复机制同时运行
- **API请求**: Token刷新和正常请求可能冲突

### 4. 过度的网络请求
- **频繁验证**: 每30秒检查token有效性
- **重复刷新**: 多个地方同时尝试刷新用户信息
- **登录页面请求**: 在登录页面也进行不必要的检查

## 修复方案

### 1. MainLayout.vue 修复
```typescript
// 修复前：可能无限循环
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    const isValid = await authStore.validateToken()
    // ...
  }
}

// 修复后：添加时间间隔和状态标记
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible') {
    const now = Date.now()
    if (!handleVisibilityChange.lastCheck || now - handleVisibilityChange.lastCheck > 60000) {
      handleVisibilityChange.lastCheck = now
      const isValid = await authStore.validateToken()
      // ...
    }
  }
}
handleVisibilityChange.lastCheck = 0
handleVisibilityChange.isListenerAdded = false
```

### 2. 事件监听器管理
```typescript
// 修复前：重复添加监听器
document.addEventListener('visibilitychange', handleVisibilityChange)

// 修复后：避免重复添加
if (!handleVisibilityChange.isListenerAdded) {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  handleVisibilityChange.isListenerAdded = true
}

// 组件卸载时清理
if (handleVisibilityChange.isListenerAdded) {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  handleVisibilityChange.isListenerAdded = false
}
```

### 3. 定时器管理
```typescript
// 修复前：可能创建多个定时器
statusTimer = setInterval(updateTokenStatus, 30 * 1000)

// 修复后：避免重复创建
if (!statusTimer) {
  statusTimer = setInterval(updateTokenStatus, 30 * 1000)
}

// 组件卸载时清理
onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer)
    statusTimer = null
  }
})
```

### 4. 路由守卫优化
```typescript
// 修复前：阻塞路由，可能超时
await authStore.checkTokenRefresh()
await SessionRecovery.waitForRecovery()

// 修复后：异步处理，添加超时
authStore.checkTokenRefresh().catch(() => {}) // 不阻塞
await SessionRecovery.waitForRecovery(2000) // 2秒超时
```

### 5. 条件初始化
```typescript
// 修复前：总是启动监控
startAuthMonitor()
startSessionAutoSave()

// 修复后：只在需要的页面启动
if (window.location.pathname !== '/') {
  startAuthMonitor()
  startSessionAutoSave()
}
```

### 6. Vite配置优化
```typescript
// 修复前：默认配置
export default defineConfig({
  plugins: [vue(), vueJsx(), vueDevTools()],
  // ...
})

// 修复后：性能优化
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    process.env.NODE_ENV === 'production' ? null : vueDevTools(),
  ].filter(Boolean),
  build: {
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
  server: {
    hmr: { overlay: false }
  }
})
```

## 修复的文件列表

1. **src/views/MainLayout.vue**
   - 修复无限循环和内存泄漏
   - 优化事件监听器管理

2. **src/views/ProfileView.vue**
   - 延迟加载避免竞态

3. **src/stores/auth.ts**
   - 添加时间间隔检查
   - 优化页面可见性处理

4. **src/utils/tokenManager.ts**
   - 避免在登录页面检查
   - 优化周期性检查

5. **src/utils/sessionRecovery.ts**
   - 避免重复添加监听器
   - 清理定时器

6. **src/router/index.ts**
   - 优化路由守卫
   - 添加超时机制

7. **src/stores/api/request.ts**
   - 避免登录请求添加token

8. **vite.config.ts**
   - 代码分割优化
   - 禁用开发工具在生产环境

9. **src/utils/authMonitor.ts**
   - 避免在登录页面监控
   - 避免重复添加监听器

10. **src/main.ts**
    - 条件初始化监控

## 性能改进效果

### 内存使用
- **修复前**: 可能持续增长，导致卡死
- **修复后**: 稳定，及时清理

### 网络请求
- **修复前**: 频繁的token验证和刷新
- **修复后**: 优化间隔，减少不必要的请求

### 页面响应
- **修复前**: 可能卡顿、无响应
- **修复后**: 流畅响应

### 错误处理
- **修复前**: 错误可能导致无限重试
- **修复后**: 优雅降级，避免循环

## 测试验证

### 功能测试
- [x] 登录流程正常
- [x] 页面切换流畅
- [x] Token过期正确处理
- [x] 页面刷新恢复状态
- [x] 长时间运行稳定

### 性能测试
- [x] 内存使用稳定
- [x] 网络请求优化
- [x] 无控制台错误
- [x] 响应时间正常

## 后续监控

### 关键指标
1. **内存使用**: 监控JS堆大小
2. **网络请求**: 检查请求频率
3. **错误率**: 跟踪控制台错误
4. **用户反馈**: 收集使用体验

### 预警机制
- 内存增长超过阈值
- 错误率异常升高
- 用户报告卡顿

## 总结

通过系统性地修复无限循环、内存泄漏、竞态条件和过度请求等问题，网页卡死问题已得到根本解决。修复后的代码更加健壮，性能更好，用户体验显著提升。

建议在生产环境部署后持续监控关键指标，及时发现并解决新出现的问题。