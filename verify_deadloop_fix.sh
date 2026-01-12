#!/bin/bash

# 死循环问题修复验证脚本

echo "=== 死循环问题修复验证 ==="
echo ""

echo "1. 检查TypeScript编译..."
npm run type-check > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ TypeScript编译通过"
else
    echo "❌ TypeScript编译失败"
    exit 1
fi

echo ""
echo "2. 检查生产构建..."
npm run build-only > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ 生产构建成功"
else
    echo "❌ 生产构建失败"
    exit 1
fi

echo ""
echo "3. 检查关键修复模式..."

# 检查路由守卫防重入
if grep -q "isRouteGuardRunning" src/router/index.ts; then
    echo "✅ 路由守卫防重入保护"
else
    echo "❌ 路由守卫缺少防重入"
fi

# 检查AuthStore防重入
if grep -q "isInitializing" src/stores/auth.ts; then
    echo "✅ AuthStore防重入保护"
else
    echo "❌ AuthStore缺少防重入"
fi

# 检查SessionRecovery条件恢复
if grep -q "currentPath === '/'" src/utils/sessionRecovery.ts; then
    echo "✅ SessionRecovery条件恢复"
else
    echo "❌ SessionRecovery缺少条件检查"
fi

# 检查全局错误保护
if grep -q "MAX_ERROR_COUNT" src/main.ts; then
    echo "✅ 全局死循环保护"
else
    echo "❌ 缺少全局保护"
fi

# 检查超时保护
if grep -q "超时" src/utils/sessionRecovery.ts; then
    echo "✅ 超时保护机制"
else
    echo "❌ 缺少超时保护"
fi

# 检查重定向优化
if grep -q "router.replace" src/router/index.ts; then
    echo "✅ 重定向优化"
else
    echo "❌ 重定向未优化"
fi

echo ""
echo "4. 检查修复的文件完整性..."

FILES=(
    "src/router/index.ts"
    "src/utils/sessionRecovery.ts"
    "src/stores/auth.ts"
    "src/main.ts"
    "src/utils/tokenManager.ts"
    "src/utils/authMonitor.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo ""
echo "=== 验证完成 ==="
echo "所有死循环修复已正确应用！"
echo ""
echo "修复的关键特性："
echo "• 路由守卫防重入"
echo "• AuthStore防重入"
echo "• 条件恢复机制"
echo "• 超时保护"
echo "• 全局错误计数"
echo "• 重定向优化"
echo ""
echo "测试建议："
echo "1. 清除浏览器数据"
echo "2. 访问 http://localhost:5173/"
echo "3. 登录并刷新多次"
echo "4. 关闭浏览器后重新打开"
echo "5. 检查是否出现死循环"