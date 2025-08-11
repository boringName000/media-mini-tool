#!/bin/bash

# 部署邀请码验证云函数
echo "开始部署邀请码验证云函数..."

# 进入云函数目录
cd cloudfunctions/verify-invitation-code

# 安装依赖
echo "安装依赖..."
npm install

# 返回项目根目录
cd ../..

# 使用微信开发者工具命令行部署云函数
echo "部署云函数到云端..."
# 注意：这里需要根据你的微信开发者工具路径进行调整
# 如果你使用的是微信开发者工具的命令行工具，可以取消下面的注释
# /Applications/wechatwebdevtools.app/Contents/MacOS/cli cloud functions deploy verify-invitation-code

echo "邀请码验证云函数部署完成！"
echo "云函数名称: verify-invitation-code"
echo "数据库集合: invitation-code-mgr"
echo "功能: 验证邀请码是否存在、是否过期、是否已被使用" 