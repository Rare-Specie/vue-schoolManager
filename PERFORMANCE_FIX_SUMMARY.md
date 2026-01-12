# 性能优化和卡死问题修复总结

## 问题分析

网页卡死的主要原因可能包括：
1. **无限循环或过度渲染** - 路由守卫、定时器、事件监听器重复添加
2. **内存泄漏** - 未清理的定时器和事件监听器
3. **竞态条件** - 多个异步操作同时进行导致状态不一致
4. **过度的网络请求** - 频繁的token验证和用户信息刷新

## 已修复的问题

### 1. MainLayout.vue - 修复无限循环和内存泄漏

**问题：**
- `handleVisibilityChange` 函数可能被重复调用
- 定时器可能被重复创建
- 事件监听器可能被重复添加

**修复：**
```typescript
// 添加静态属性记录状态
handleVisibilityChange.lastCheck = 0
handleVisibilityChange.isListenerAdded = false

// 避免重复添加监听器
if (!handleVisibilityChange.isListenerAdded) {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  handleVisibilityChange.isListenerAdded = true
}

// 组件卸载时正确清理
if (handleVisibilityChange.isListenerAdded) {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  handleVisibilityChange.isListenerAdded = false
}
```

### 2. ProfileView.vue - 延迟加载避免竞态

**问题：**
- 页面挂载时立即加载日志，可能与store初始化竞争

**修复：**
```typescript
onMounted(() => {
  setTimeout(() => {
    if (authStore.isAuthenticated && authStore.user) {
      loadLogs()
    }
  }, 100)
})
```

### 3. authStore - 避免频繁检查

**问题：**
- `handlePageVisibility` 可能被频繁调用
- 每次调用都进行完整的token验证

**修复：**
```typescript
// 添加时间间隔检查
const now = Date.now()
if (!handlePageVisibility.lastCheck || now - handlePageVisibility.lastCheck > 30000) {
  handlePageVisibility.lastCheck = now
  // ... 执行检查逻辑
}
```

### 4. tokenManager - 优化周期性检查

**问题：**
- 在登录页面也进行token检查
- 可能重复启动检查定时器

**修复：**
```typescript
// 避免在登录页面检查
if (typeof window !== 'undefined' && window.location.pathname === '/') {
  return
}

// 清理现有定时器
if (this.checkTimer) {
  clearInterval(this.checkTimer)
}
```

### 5. sessionRecovery - 避免重复添加监听器

**问题：**
- 页面加载时可能多次添加事件监听器

**修复：**
```typescript
if (!window.__sessionRecoveryInitialized) {
  // 添加监听器...
  window.__sessionRecoveryInitialized = true
}

// 清理定时器
if (sessionSaveTimer) {
  clearInterval(sessionSaveTimer)
}
```

### 6. router - 优化路由守卫

**问题：**
- 路由守卫中的异步操作可能阻塞导航
- 等待恢复可能超时

**修复：**
```typescript
// 异步检查token刷新，不阻塞路由
authStore.checkTokenRefresh().catch(() => {})

// 限制等待时间
await SessionRecovery.waitForRecovery(2000)
```

### 7. request.ts - 避免登录请求添加token

**问题：**
- 登录请求可能被错误地添加token

**修复：**
```typescript
// 避免在登录页面添加token
if (config.url?.includes('/auth/login')) {
  return config
}
```

### 8. Vite配置 - 性能优化

**修复：**
```typescript
// 生产环境禁用devTools
process.env.NODE_ENV === 'production' ? null : vueDevTools(),

// 代码分割
manualChunks: {
  'vue-vendor': ['vue', 'vue-router', 'pinia'],
  'element-plus': ['element-plus'],
  'echarts': ['echarts'],
  'utils': ['axios', 'crypto-js']
}

// 禁用错误覆盖层
hmr: {
  overlay: false
}
```

### 9. authMonitor - 避免在登录页面监控

**修复：**
```typescript
// 避免在登录页面启动监控
if (typeof window !== 'undefined' && window.location.pathname === '/') {
  return
}

// 避免重复添加监听器
if (!window.__authMonitorInitialized) {
  // 添加监听器...
  window.__authMonitorInitialized = true
}
```

### 10. main.ts - 条件初始化

**修复：**
```typescript
// 只在非登录页面启动监控和会话保存
if (typeof window !== 'undefined' && window.location.pathname !== '/') {
  startAuthMonitor()
  startSessionAutoSave()
}
```

## 性能优化建议

### 1. 减少不必要的API调用
- Token验证间隔从30秒延长到60秒
- 用户信息刷新间隔保持5分钟，但添加时间检查

### 2. 避免内存泄漏
- 所有定时器在组件卸载时清理
- 所有事件监听器在不再需要时移除
- 使用静态属性标记监听器状态

### 3. 优化路由导航
- 异步操作不阻塞导航
- 添加超时机制
- 避免在路由守卫中进行耗时操作

### 4. 条件加载
- 只在需要的页面启动监控
- 延迟加载非关键数据
- 避免在登录页面进行不必要的检查

### 5. 错误处理
- 全局错误捕获
- 网络请求超时处理
- 避免错误导致的无限重试

## 测试建议

1. **测试登录流程** - 确保登录后不会卡死
2. **测试页面切换** - 快速切换页面不会导致问题
3. **测试token过期** - Token过期后正确处理
4. **测试页面刷新** - 刷新页面后状态正确恢复
5. **测试长时间运行** - 运行几分钟后检查内存使用

## 监控指标

- 页面加载时间
- 内存使用情况
- 网络请求数量
- 控制台错误数量
- 用户操作响应时间

## 后续优化方向

1. **组件懒加载** - 使用动态import减少初始加载时间
2. **图片优化** - 压缩图片，使用懒加载
3. **缓存策略** - 合理使用localStorage和sessionStorage
4. **Web Worker** - 将耗时操作移到后台线程
5. **虚拟滚动** - 大列表使用虚拟滚动