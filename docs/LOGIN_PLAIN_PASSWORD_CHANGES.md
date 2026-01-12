# 登录密码明文传输修改说明

## 修改概述
根据后端登录逻辑要求，前端已修改为密码明文传输，不再进行SHA256加密。

## 修改的文件

### 1. `/src/stores/auth.ts`
**修改内容：**
- 移除了 `import { hashPassword } from '@/utils/crypto'` 导入
- 修改 `handleLogin` 函数：移除密码SHA256加密逻辑，直接发送明文密码
- 修改 `handleChangePassword` 函数：移除密码SHA256加密逻辑，直接发送明文密码

**修改前：**
```typescript
// 登录
const handleLogin = async (data: LoginRequest) => {
  loading.value = true
  try {
    // 对密码进行SHA256哈希
    const hashedData = {
      ...data,
      password: hashPassword(data.password)
    }
    const response = await login(hashedData)
    // ...
  }
}

// 修改密码
const handleChangePassword = async (data: UpdatePasswordRequest) => {
  try {
    // 对原密码和新密码都进行SHA256哈希
    const hashedData = {
      oldPassword: hashPassword(data.oldPassword),
      newPassword: hashPassword(data.newPassword)
    }
    await updatePassword(hashedData)
    // ...
  }
}
```

**修改后：**
```typescript
// 登录
const handleLogin = async (data: LoginRequest) => {
  loading.value = true
  try {
    // 密码明文传输，无需加密
    const response = await login(data)
    // ...
  }
}

// 修改密码
const handleChangePassword = async (data: UpdatePasswordRequest) => {
  try {
    // 密码明文传输，无需加密
    await updatePassword(data)
    // ...
  }
}
```

## 后端接口对应关系

### 登录接口
- **前端调用：** `POST /api/auth/login`
- **请求体：** `{ username: string, password: string, role: 'admin' | 'teacher' | 'student' }`
- **密码格式：** 明文字符串

### 修改密码接口
- **前端调用：** `PUT /user/password`
- **请求体：** `{ oldPassword: string, newPassword: string }`
- **密码格式：** 明文字符串

### Token验证接口
- **前端调用：** `GET /api/auth/verify`
- **Header：** `Authorization: Bearer <token>`

### 登出接口
- **前端调用：** `POST /api/auth/logout`
- **Header：** `Authorization: Bearer <token>`

## Token处理逻辑

### 存储
- 登录成功后，token存储在 `localStorage` 中
- Key: `token`

### 使用
- 所有需要认证的请求都会在Header中自动添加：`Authorization: Bearer <token>`
- 通过axios拦截器自动处理

### 过期处理
- 当收到401响应时，自动清除token并跳转到登录页
- 在 `request.ts` 的响应拦截器中处理

## 测试验证

### 构建测试
```bash
npm run build
```
✅ 构建成功，无语法错误

### 密码明文验证
创建测试文件 `test-login-plain.ts` 验证密码明文传输：
- 原始密码：`test123456`
- 发送格式：明文 `test123456`
- 对比SHA256：`85777f270ad7cf2a790981bbae3c4e484a1dc55e24a77390d692fbf1cffa12fa`

## 安全说明

### 前端安全
- 密码在传输过程中通过HTTPS加密（如果后端配置了SSL/TLS）
- Token存储在localStorage中，需要注意XSS防护

### 后端安全责任
- 密码存储：后端应该对密码进行哈希存储（如bcrypt）
- 密码验证：后端负责验证明文密码与存储的哈希密码匹配
- 会话管理：后端负责Token的生成、验证和过期管理

## 兼容性说明

### 不变的部分
- 登录流程不变
- Token存储和使用方式不变
- 请求头格式不变
- 错误处理逻辑不变

### 变化的部分
- 密码传输格式：从SHA256哈希变为明文
- 后端需要相应调整密码验证逻辑

## 后续建议

1. **确保后端已调整**：后端需要能够接收明文密码并进行验证
2. **HTTPS部署**：生产环境务必使用HTTPS加密传输
3. **安全审计**：定期检查安全配置和日志
4. **密码策略**：后端应实施强密码策略和安全存储