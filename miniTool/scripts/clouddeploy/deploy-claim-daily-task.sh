#!/bin/bash

# 部署 claim-daily-task 云函数脚本

echo "开始部署 claim-daily-task 云函数..."

# 进入云函数目录
cd ../../cloudfunctions/claim-daily-task

# 检查文件是否存在
if [ ! -f "index.js" ]; then
    echo "❌ 错误: index.js 文件不存在"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ 错误: package.json 文件不存在"
    exit 1
fi

# 检查语法
echo "检查 JavaScript 语法..."
node -c index.js
if [ $? -ne 0 ]; then
    echo "❌ 语法检查失败"
    exit 1
fi
echo "✅ 语法检查通过"

# 安装依赖
echo "安装依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装完成"

# 部署云函数
echo "部署云函数..."
wx cloud functions deploy claim-daily-task --force
if [ $? -ne 0 ]; then
    echo "❌ 云函数部署失败"
    exit 1
fi
echo "✅ 云函数部署成功"

# 运行测试
echo "运行测试..."
node test.js
if [ $? -ne 0 ]; then
    echo "⚠️  测试运行失败，但部署已完成"
else
    echo "✅ 测试运行成功"
fi

echo "🎉 claim-daily-task 云函数部署完成！"
