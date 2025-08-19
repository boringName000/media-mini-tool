#!/bin/bash

# 部署 update-user-account 云函数
echo "开始部署 update-user-account 云函数..."

# 进入云函数目录
cd miniTool/cloudfunctions/update-user-account

# 安装依赖
echo "安装依赖..."
npm install

# 部署云函数
echo "部署云函数..."
wx cloud functions deploy update-user-account --env cloud1-8g0g5g5g5g5g5g

echo "update-user-account 云函数部署完成！"
