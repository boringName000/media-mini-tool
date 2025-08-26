#!/bin/bash

# 新增文章信息云函数部署脚本

echo "开始部署 add-article-info 云函数..."

# 进入云函数目录
cd cloudfunctions/add-article-info

# 安装依赖
echo "安装依赖..."
npm install

# 部署云函数
echo "部署云函数..."
npx tcb fn deploy add-article-info

echo "add-article-info 云函数部署完成！"
