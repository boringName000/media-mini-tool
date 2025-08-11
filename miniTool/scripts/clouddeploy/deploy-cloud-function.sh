#!/bin/bash

# 云函数部署脚本
echo "开始部署云函数..."

# 进入云函数目录
cd cloudfunctions/test

# 安装依赖
echo "安装依赖..."
npm install

# 返回项目根目录
cd ../..

# 部署云函数
echo "部署云函数 test..."
wx cloud functions deploy test

echo "云函数部署完成！"
echo ""
echo "使用说明："
echo "1. 确保已在微信开发者工具中登录"
echo "2. 确保已开通云开发服务"
echo "3. 确保已创建 'user-info' 数据库集合"
echo "4. 在小程序中点击 '数据库测试' 按钮进行测试" 