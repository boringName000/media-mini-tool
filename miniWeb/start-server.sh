#!/bin/bash

# 轻量级Web应用模板 - 启动脚本
echo "🚀 启动轻量级Web应用模板..."

# 检查Python是否可用
if command -v python3 &> /dev/null; then
    echo "✅ 使用Python3启动服务器..."
    echo "🌐 服务器地址: http://localhost:8000"
    echo "📱 在浏览器中打开上述地址查看应用"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "✅ 使用Python启动服务器..."
    echo "🌐 服务器地址: http://localhost:8000"
    echo "📱 在浏览器中打开上述地址查看应用"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    python -m http.server 8000
else
    echo "❌ 未找到Python，请手动启动服务器："
    echo ""
    echo "方法1: 使用Python"
    echo "  python -m http.server 8000"
    echo ""
    echo "方法2: 使用Node.js"
    echo "  npx http-server"
    echo ""
    echo "方法3: 使用PHP"
    echo "  php -S localhost:8000"
    echo ""
    echo "或者直接在浏览器中打开 index.html 文件"
fi
