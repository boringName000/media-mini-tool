#!/bin/bash

# 部署获取账号结算信息云函数

echo "开始部署 get-account-settlement-info 云函数..."

# 进入云函数目录
cd miniTool/cloudfunctions/get-account-settlement-info

# 安装依赖
echo "安装依赖..."
npm install

# 部署云函数
echo "部署云函数..."
wx cloud deploy --env cloud1-8g0b5g5g5g5g5g5g

echo "get-account-settlement-info 云函数部署完成！"
