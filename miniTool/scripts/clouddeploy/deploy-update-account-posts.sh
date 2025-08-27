#!/bin/bash

# 部署 update-account-posts 云函数

echo "🚀 开始部署 update-account-posts 云函数..."

# 切换到云函数目录
cd ../../cloudfunctions/update-account-posts

# 检查目录是否存在
if [ ! -d "." ]; then
    echo "❌ 错误: update-account-posts 目录不存在"
    exit 1
fi

# 检查必要文件是否存在
if [ ! -f "index.js" ]; then
    echo "❌ 错误: index.js 文件不存在"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ 错误: package.json 文件不存在"
    exit 1
fi

# 部署云函数
echo "📦 正在部署 update-account-posts 云函数..."
wx cloud functions deploy update-account-posts

# 检查部署结果
if [ $? -eq 0 ]; then
    echo "✅ update-account-posts 云函数部署成功！"
else
    echo "❌ update-account-posts 云函数部署失败！"
    exit 1
fi

echo "🎉 部署完成！"
