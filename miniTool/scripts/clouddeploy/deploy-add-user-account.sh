#!/bin/bash

# 部署 add-user-account 云函数
echo "开始部署 add-user-account 云函数..."

# 进入云函数目录
cd cloudfunctions/add-user-account

# 安装依赖
echo "安装依赖..."
npm install

# 部署云函数
echo "部署云函数..."
wx cloud functions deploy add-user-account --env $(wx cloud env list | grep "当前环境" | awk '{print $2}')

echo "add-user-account 云函数部署完成！" 