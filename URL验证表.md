# API URL 验证表

## 配置说明

**前端配置**:
- `baseURL`: `/api`
- `axios实例`: `request`

**Vite代理配置**:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:21180',
    changeOrigin: true
    // 无rewrite，保留 /api 前缀
  }
}
```

## URL 映射验证

### 认证相关
| 前端代码 | 前端请求URL | 代理转发到 | 后端API文档 | ✅正确 |
|----------|-------------|------------|-------------|--------|
| `request.post('/auth/login', data)` | `/api/auth/login` | `http://localhost:21180/api/auth/login` | `POST /api/auth/login` | ✅ |
| `request.post('/auth/logout')` | `/api/auth/logout` | `http://localhost:21180/api/auth/logout` | `POST /api/auth/logout` | ✅ |
| `request.get('/auth/verify')` | `/api/auth/verify` | `http://localhost:21180/api/auth/verify` | `GET /api/auth/verify` | ✅ |

### 用户管理
| 前端代码 | 前端请求URL | 代理转发到 | 后端API文档 | ✅正确 |
|----------|-------------|------------|-------------|--------|
| `request.get('/user/profile')` | `/api/user/profile` | `http://localhost:21180/api/user/profile` | `GET /api/user/profile` | ✅ |
| `request.put('/user/password', data)` | `/api/user/password` | `http://localhost:21180/api/user/password` | `PUT /api/user/password` | ✅ |
| `request.get('/user/logs', { params })` | `/api/user/logs` | `http://localhost:21180/api/user/logs` | `GET /api/user/logs` | ✅ |
| `request.get('/users', { params })` | `/api/users` | `http://localhost:21180/api/users` | `GET /api/users` | ✅ |
| `request.post('/users', data)` | `/api/users` | `http://localhost:21180/api/users` | `POST /api/users` | ✅ |
| `request.put('/users/${id}', data)` | `/api/users/${id}` | `http://localhost:21180/api/users/${id}` | `PUT /api/users/<id>` | ✅ |
| `request.delete('/users/${id}')` | `/api/users/${id}` | `http://localhost:21180/api/users/${id}` | `DELETE /api/users/<id>` | ✅ |
| `request.post('/users/batch', data)` | `/api/users/batch` | `http://localhost:21180/api/users/batch` | `POST /api/users/batch` | ✅ |
| `request.delete('/users/batch', { data })` | `/api/users/batch` | `http://localhost:21180/api/users/batch` | `DELETE /api/users/batch` | ✅ |
| `request.put('/users/${id}/reset-password', { newPassword })` | `/api/users/${id}/reset-password` | `http://localhost:21180/api/users/${id}/reset-password` | `PUT /api/users/<id>/reset-password` | ✅ |

### 学生管理
| 前端代码 | 前端请求URL | 代理转发到 | 后端API文档 | ✅正确 |
|----------|-------------|------------|-------------|--------|
| `request.get('/students', { params })` | `/api/students` | `http://localhost:21180/api/students` | `GET /api/students` | ✅ |
| `request.get(`/students/${id}`)` | `/api/students/${id}` | `http://localhost:21180/api/students/${id}` | `GET /api/students/<id>` | ✅ |
| `request.post('/students', data)` | `/api/students` | `http://localhost:21180/api/students` | `POST /api/students` | ✅ |
| `request.put(`/students/${id}`, data)` | `/api/students/${id}` | `http://localhost:21180/api/students/${id}` | `PUT /api/students/<id>` | ✅ |
| `request.delete(`/students/${id}`)` | `/api/students/${id}` | `http://localhost:21180/api/students/${id}` | `DELETE /api/students/<id>` | ✅ |
| `request.post('/students/batch', { students: data })` | `/api/students/batch` | `http://localhost:21180/api/students/batch` | `POST /api/students/batch` | ✅ |
| `request.get('/students/export')` | `/api/students/export` | `http://localhost:21180/api/students/export` | `GET /api/students/export` | ✅ |
| `request.get(`/students/${studentId}/grades`)` | `/api/students/${studentId}/grades` | `http://localhost:21180/api/students/${studentId}/grades` | `GET /api/students/<studentId>/grades` | ✅ |

### 课程管理
| 前端代码 | 前端请求URL | 代理转发到 | 后端API文档 | ✅正确 |
|----------|-------------|------------|-------------|--------|
| `request.get('/courses', { params })` | `/api/courses` | `http://localhost:21180/api/courses` | `GET /api/courses` | ✅ |
| `request.get(`/courses/${id}`)` | `/api/courses/${id}` | `http://localhost:21180/api/courses/${id}` | `GET /api/courses/<id>` | ✅ |
| `request.post('/courses', data)` | `/api/courses` | `http://localhost:21180/api/courses` | `POST /api/courses` | ✅ |
| `request.put(`/courses/${id}`, data)` | `/api/courses/${id}` | `http://localhost:21180/api/courses/${id}` | `PUT /api/courses/<id>` | ✅ |
| `request.delete(`/courses/${id}`)` | `/api/courses/${id}` | `http://localhost:21180/api/courses/${id}` | `DELETE /api/courses/<id>` | ✅ |
| `request.get(`/courses/${courseId}/students`)` | `/api/courses/${courseId}/students` | `http://localhost:21180/api/courses/${courseId}/students` | `GET /api/courses/<courseId>/students` | ✅ |

### 成绩管理
| 前端代码 | 前端请求URL | 代理转发到 | 后端API文档 | ✅正确 |
|----------|-------------|------------|-------------|--------|
| `request.get('/grades', { params })` | `/api/grades` | `http://localhost:21180/api/grades` | `GET /api/grades` | ✅ |
| `request.post('/grades', data)` | `/api/grades` | `http://localhost:21180/api/grades` | `POST /api/grades` | ✅ |
| `request.put(`/grades/${id}`, data)` | `/api/grades/${id}` | `http://localhost:21180/api/grades/${id}` | `PUT /api/grades/<id>` | ✅ |
| `request.delete(`/grades/${id}`)` | `/api/grades/${id}` | `http://localhost:21180/api/grades/${id}` | `DELETE /api/grades/<id>` | ✅ |
| `request.post('/grades/batch', { grades: data })` | `/api/grades/batch` | `http://localhost:21180/api/grades/batch` | `POST /api/grades/batch` | ✅ |
| `request.get('/grades/export', { params })` | `/api/grades/export` | `http://localhost:21180/api/grades/export` | `GET /api/grades/export` | ✅ |
| `request.get(`/grades/course/${courseId}`, { params: { semester } })` | `/api/grades/course/${courseId}` | `http://localhost:21180/api/grades/course/${courseId}` | `GET /api/grades/course/<courseId>` | ✅ |
| `request.post('/grades/batch-update', data)` | `/api/grades/batch-update` | `http://localhost:21180/api/grades/batch-update` | `POST /api/grades/batch-update` | ✅ |

### 统计分析
| 前端代码 | 前端请求URL | 代理转发到 | 后端API文档 | ✅正确 |
|----------|-------------|------------|-------------|--------|
| `request.get('/statistics/overview')` | `/api/statistics/overview` | `http://localhost:21180/api/statistics/overview` | `GET /api/statistics/overview` | ✅ |
| `request.get('/statistics/class', { params })` | `/api/statistics/class` | `http://localhost:21180/api/statistics/class` | `GET /api/statistics/class` | ✅ |
| `request.get('/statistics/course', { params })` | `/api/statistics/course` | `http://localhost:21180/api/statistics/course` | `GET /api/statistics/course` | ✅ |
| `request.get('/statistics/ranking', { params })` | `/api/statistics/ranking` | `http://localhost:21180/api/statistics/ranking` | `GET /api/statistics/ranking` | ✅ |
| `request.get('/statistics/distribution', { params })` | `/api/statistics/distribution` | `http://localhost:21180/api/statistics/distribution` | `GET /api/statistics/distribution` | ✅ |
| `request.get('/statistics/report', { params })` | `/api/statistics/report` | `http://localhost:21180/api/statistics/report` | `GET /api/statistics/report` | ✅ |

### 报表管理
| 前端代码 | 前端请求URL | 代理转发到 | 后端API文档 | ✅正确 |
|----------|-------------|------------|-------------|--------|
| `request.get('/reports/report-card', { params })` | `/api/reports/report-card` | `http://localhost:21180/api/reports/report-card` | `GET /api/reports/report-card` | ✅ |
| `request.get('/reports/statistics', { params })` | `/api/reports/statistics` | `http://localhost:21180/api/reports/statistics` | `GET /api/reports/statistics` | ✅ |
| `request.post('/reports/print', data)` | `/api/reports/print` | `http://localhost:21180/api/reports/print` | `POST /api/reports/print` | ✅ |
| `request.post('/reports/batch-print', data)` | `/api/reports/batch-print` | `http://localhost:21180/api/reports/batch-print` | `POST /api/reports/batch-print` | ✅ |

### 系统管理
| 前端代码 | 前端请求URL | 代理转发到 | 后端API文档 | ✅正确 |
|----------|-------------|------------|-------------|--------|
| `request.post('/system/backup')` | `/api/system/backup` | `http://localhost:21180/api/system/backup` | `POST /api/system/backup` | ✅ |
| `request.get('/system/backups')` | `/api/system/backups` | `http://localhost:21180/api/system/backups` | `GET /api/system/backups` | ✅ |
| `request.post('/system/restore', { backupId })` | `/api/system/restore` | `http://localhost:21180/api/system/restore` | `POST /api/system/restore` | ✅ |
| `request.delete(`/system/backups/${backupId}`)` | `/api/system/backups/${backupId}` | `http://localhost:21180/api/system/backups/${backupId}` | `DELETE /api/system/backups/<backupId>` | ✅ |
| `request.get('/system/logs', { params })` | `/api/system/logs` | `http://localhost:21180/api/system/logs` | `GET /api/system/logs` | ✅ |
| `request.get('/system/settings')` | `/api/system/settings` | `http://localhost:21180/api/system/settings` | `GET /api/system/settings` | ✅ |
| `request.put('/system/settings', settings)` | `/api/system/settings` | `http://localhost:21180/api/system/settings` | `PUT /api/system/settings` | ✅ |
| `request.post('/system/clean-logs')` | `/api/system/clean-logs` | `http://localhost:21180/api/system/clean-logs` | `POST /api/system/clean-logs` | ✅ |
| `request.get('/system/export-logs', { params })` | `/api/system/export-logs` | `http://localhost:21180/api/system/export-logs` | `GET /api/system/export-logs` | ✅ |

## 总结

✅ **所有API调用URL都是正确的！**

**关键配置**:
1. `request.ts` 中 `baseURL: '/api'`
2. `vite.config.ts` 中代理配置保留 `/api` 前缀（无rewrite）
3. 所有API调用使用相对路径（如 `/auth/login`）

**最终URL格式**:
- 前端请求: `/api/auth/login`
- 代理转发: `http://localhost:21180/api/auth/login`
- 后端接收: `http://localhost:21180/api/auth/login` ✅

**登录请求流程**:
```
前端代码: request.post('/auth/login', data)
    ↓
axios实例: baseURL='/api' + endpoint='/auth/login'
    ↓
实际请求: POST /api/auth/login
    ↓
Vite代理: 转发到 http://localhost:21180/api/auth/login
    ↓
后端服务: 接收 POST /api/auth/login ✅
```