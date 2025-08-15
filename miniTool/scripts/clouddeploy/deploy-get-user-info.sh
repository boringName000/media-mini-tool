#!/bin/bash

# 部署 get-user-info 云函数
echo "开始部署 get-user-info 云函数..."

# 进入云函数目录
cd cloudfunctions/get-user-info

# 安装依赖
echo "安装依赖..."
npm install

# 部署云函数
echo "部署云函数..."
wx cloud functions deploy get-user-info --env $(wx cloud env list | grep "当前环境" | awk '{print $2}')

echo "get-user-info 云函数部署完成！" 