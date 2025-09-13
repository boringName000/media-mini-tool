#!/bin/bash

# 部署 admin-login 云函数脚本
# 使用方法: ./deploy-admin-login.sh

echo "开始部署 admin-login 云函数..."

# 检查是否在正确的目录
if [ ! -d "cloudfunctions/admin-login" ]; then
    echo "错误: 请在 miniTool 目录下运行此脚本"
    exit 1
fi

# 进入云函数目录
cd cloudfunctions/admin-login

echo "安装依赖..."
npm install

echo "部署云函数到微信云开发..."
# 这里需要使用微信开发者工具的命令行工具
# 或者提示用户手动部署

echo "部署完成！"
echo ""
echo "请在微信开发者工具中："
echo "1. 打开云开发控制台"
echo "2. 点击'云函数'"
echo "3. 找到 admin-login 函数"
echo "4. 点击'部署并上传'"
echo ""
echo "或者使用微信开发者工具的命令行工具："
echo "miniprogram-cli cloudfunctions:deploy admin-login"