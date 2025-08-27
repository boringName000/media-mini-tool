#!/bin/bash

# 获取文章信息云函数部署脚本

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}开始部署 get-article-info 云函数...${NC}"

# 进入云函数目录
cd ../cloudfunctions/get-article-info

# 检查目录是否存在
if [ ! -d "." ]; then
    echo -e "${RED}错误: 云函数目录不存在${NC}"
    exit 1
fi

echo -e "${YELLOW}检查 package.json...${NC}"
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

# 检查 index.js 语法
echo -e "${YELLOW}检查语法...${NC}"
node -c index.js
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: index.js 语法检查失败${NC}"
    exit 1
fi

# 部署云函数
echo -e "${YELLOW}部署云函数...${NC}"
wx cloud functions deploy get-article-info --force

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ get-article-info 云函数部署成功！${NC}"
else
    echo -e "${RED}❌ get-article-info 云函数部署失败！${NC}"
    exit 1
fi

echo -e "${GREEN}部署完成！${NC}"
