#!/bin/bash

# create-daily-tasks 云函数部署脚本

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 云函数名称
FUNCTION_NAME="create-daily-tasks"

# 云函数目录
FUNCTION_DIR="cloudfunctions/${FUNCTION_NAME}"

echo -e "${YELLOW}开始部署 ${FUNCTION_NAME} 云函数...${NC}"

# 检查云函数目录是否存在
if [ ! -d "$FUNCTION_DIR" ]; then
    echo -e "${RED}错误: 云函数目录 ${FUNCTION_DIR} 不存在${NC}"
    exit 1
fi

# 进入云函数目录
cd "$FUNCTION_DIR"

echo -e "${YELLOW}1. 检查依赖...${NC}"

# 检查 package.json 是否存在
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: package.json 文件不存在${NC}"
    exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}安装依赖...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}错误: 依赖安装失败${NC}"
        exit 1
    fi
fi

echo -e "${YELLOW}2. 检查云函数代码...${NC}"

# 检查 index.js 是否存在
if [ ! -f "index.js" ]; then
    echo -e "${RED}错误: index.js 文件不存在${NC}"
    exit 1
fi

# 语法检查
echo -e "${YELLOW}语法检查...${NC}"
node -c index.js
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 云函数语法错误${NC}"
    exit 1
fi

echo -e "${YELLOW}3. 部署云函数...${NC}"

# 使用微信开发者工具命令行部署
# 注意：需要先配置好微信开发者工具的环境
wx cloud functions deploy "$FUNCTION_NAME" --env production

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ${FUNCTION_NAME} 云函数部署成功！${NC}"
else
    echo -e "${RED}❌ ${FUNCTION_NAME} 云函数部署失败！${NC}"
    echo -e "${YELLOW}请检查：${NC}"
    echo -e "  1. 微信开发者工具是否已安装并配置"
    echo -e "  2. 云开发环境是否正确配置"
    echo -e "  3. 网络连接是否正常"
    exit 1
fi

echo -e "${GREEN}部署完成！${NC}"
