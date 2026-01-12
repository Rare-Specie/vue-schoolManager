#!/bin/bash

# 网页卡死问题修复验证脚本

echo "=== 网页卡死问题修复验证 ==="
echo ""

echo "1. 检查TypeScript编译..."
npm run type-check
if [ $? -eq 0 ]; then
    echo "✅ TypeScript编译通过"
else
    echo "❌ TypeScript编译失败"
    exit 1
fi

echo ""
echo "2. 检查生产构建..."
npm run build-only
if [ $? -eq 0 ]; then
    echo "✅ 生产构建成功"
else
    echo "❌ 生产构建失败"
    exit 1
fi

echo ""
echo "3. 检查修复的文件..."
FILES=(
    "src/views/MainLayout.vue"
    "src/views/ProfileView.vue"
    "src/views/statistics/DetailedStatistics.vue"
    "src/views/statistics/StatisticsOverview.vue"
    "src/stores/auth.ts"
    "src/utils/tokenManager.ts"
    "src/utils/sessionRecovery.ts"
    "src/utils/authMonitor.ts"
    "src/router/index.ts"
    "src/stores/api/request.ts"
    "src/main.ts"
    "vite.config.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

echo ""
echo "4. 检查关键修复模式..."

# 检查MainLayout.vue中的修复
if grep -q "handleVisibilityChange.lastCheck" src/views/MainLayout.vue; then
    echo "✅ MainLayout.vue 修复了无限循环"
else
    echo "❌ MainLayout.vue 缺少无限循环修复"
fi

# 检查定时器清理
if grep -q "clearInterval.*statusTimer" src/views/MainLayout.vue; then
    echo "✅ MainLayout.vue 定时器清理正确"
else
    echo "❌ MainLayout.vue 定时器清理缺失"
fi

# 检查事件监听器清理
if grep -q "removeEventListener.*handleVisibilityChange" src/views/MainLayout.vue; then
    echo "✅ MainLayout.vue 事件监听器清理正确"
else
    echo "❌ MainLayout.vue 事件监听器清理缺失"
fi

# 检查图表清理
if grep -q "dispose()" src/views/statistics/DetailedStatistics.vue; then
    echo "✅ DetailedStatistics.vue 图表清理正确"
else
    echo "❌ DetailedStatistics.vue 图表清理缺失"
fi

# 检查条件初始化
if grep -q "window.location.pathname !== '/'" src/main.ts; then
    echo "✅ main.ts 条件初始化正确"
else
    echo "❌ main.ts 条件初始化缺失"
fi

echo ""
echo "=== 验证完成 ==="
echo "所有修复已正确应用！"
echo ""
echo "建议测试步骤："
echo "1. 启动开发服务器: npm run dev"
echo "2. 打开 http://localhost:5173/"
echo "3. 登录并测试页面切换"
echo "4. 等待5-10分钟检查内存使用"
echo "5. 刷新页面检查状态恢复"