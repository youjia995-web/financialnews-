#!/bin/bash

# 财经新闻汇总平台 - 云服务器部署脚本
# 适用于 Ubuntu 20.04/22.04

set -e

echo "=========================================="
echo "  财经新闻汇总平台 - 云服务器部署"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置变量
APP_NAME="finance-news"
APP_PORT=3000
DOMAIN=""  # 请填写你的域名，如：news.example.com

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}请使用 root 用户或 sudo 运行此脚本${NC}"
  exit 1
fi

# 1. 更新系统
echo -e "${YELLOW}[1/8] 更新系统...${NC}"
apt update && apt upgrade -y

# 2. 安装 Node.js 18
echo -e "${YELLOW}[2/8] 安装 Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. 安装 PostgreSQL
echo -e "${YELLOW}[3/8] 安装 PostgreSQL...${NC}"
apt install -y postgresql postgresql-contrib

# 启动 PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# 4. 创建数据库和用户
echo -e "${YELLOW}[4/8] 配置数据库...${NC}"
sudo -u postgres psql << EOF
CREATE USER finance_user WITH PASSWORD 'your_secure_password_here';
CREATE DATABASE finance_news OWNER finance_user;
GRANT ALL PRIVILEGES ON DATABASE finance_news TO finance_user;
EOF

# 5. 安装 PM2
echo -e "${YELLOW}[5/8] 安装 PM2...${NC}"
npm install -g pm2

# 6. 安装 Nginx
echo -e "${YELLOW}[6/8] 安装 Nginx...${NC}"
apt install -y nginx

# 7. 配置防火墙
echo -e "${YELLOW}[7/8] 配置防火墙...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 8. 创建应用目录
echo -e "${YELLOW}[8/8] 创建应用目录...${NC}"
mkdir -p /var/www/$APP_NAME
chown -R $SUDO_USER:$SUDO_USER /var/www/$APP_NAME

echo ""
echo -e "${GREEN}=========================================="
echo "  基础环境安装完成！"
echo "==========================================${NC}"
echo ""
echo "后续步骤："
echo "1. 上传代码到 /var/www/$APP_NAME"
echo "2. 配置 .env 文件"
echo "3. 运行部署后脚本: ./deploy-after.sh"
echo ""
