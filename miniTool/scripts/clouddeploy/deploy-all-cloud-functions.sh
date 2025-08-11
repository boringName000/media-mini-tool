#!/bin/bash

# 统一部署所有云函数脚本
echo "开始部署所有云函数..."

# 定义云函数列表
cloud_functions=("test" "create-invitation-code" "verify-invitation-code" "delete-invitation-code" "user-register")

# 部署每个云函数
for func in "${cloud_functions[@]}"; do
  echo ""
  echo "正在部署云函数: $func"
  
  # 进入云函数目录
  cd "../../cloudfunctions/$func"
  
  # 安装依赖
  echo "安装依赖..."
  npm install
  
  # 返回脚本目录
  cd ../../scripts/clouddeploy
  
  echo "云函数 $func 部署完成！"
done

echo ""
echo "所有云函数部署完成！"
echo ""
echo "已部署的云函数："
echo "1. test - 用户数据测试"
echo "2. create-invitation-code - 邀请码创建"
echo "3. verify-invitation-code - 邀请码验证"
echo "4. delete-invitation-code - 邀请码删除"
echo "5. user-register - 用户注册"
echo ""
echo "使用说明："
echo "1. 确保已在微信开发者工具中登录"
echo "2. 确保已开通云开发服务"
echo "3. 确保已创建相关数据库集合"
echo "4. 在小程序中测试各个功能" 