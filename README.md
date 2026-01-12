# vue-project

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

## 🔒 密码安全特性

本项目已实现 **SHA256 密码哈希** 安全机制：

### ✅ 已实现功能
- **登录密码哈希**: 用户登录时，前端自动对密码进行SHA256哈希
- **修改密码哈希**: 修改密码时，原密码和新密码都会被哈希处理
- **安全传输**: 原始密码永远不会离开前端，只传输哈希值
- **工具函数**: 提供完整的加密工具模块 (`src/utils/crypto.ts`)

### 🔧 使用说明
```typescript
// 登录流程（自动处理）
await authStore.handleLogin({
  username: 'admin',
  password: 'admin123', // 自动哈希
  role: 'admin'
})

// 修改密码流程（自动处理）
await authStore.handleChangePassword({
  oldPassword: 'oldPass', // 自动哈希
  newPassword: 'newPass'  // 自动哈希
})
```

### 📋 安全建议
1. **后端适配**: 确保后端存储和验证SHA256哈希值
2. **HTTPS部署**: 生产环境使用HTTPS加密传输
3. **盐值增强**: 建议后端为每个用户生成唯一盐值
4. **密码强度**: 保持前端密码强度验证

详细说明请查看 `SHA256密码安全说明.md`
