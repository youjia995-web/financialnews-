#!/bin/bash

# 部署后脚本 - 在服务器上运行
# 用法: ./deploy-after.sh

set -e

APP_NAME="finance-news"
APP_DIR="/var/www/$APP_NAME"

echo "=========================================="
echo "  应用部署配置"
echo "=========================================="

# 检查目录
if [ ! -d "$APP_DIR" ]; then
  echo "错误: 应用目录不存在: $APP_DIR"
  exit 1
fi

cd $APP_DIR

# 1. 安装依赖
echo "[1/6] 安装依赖..."
npm install

# 2. 生成 Prisma Client
echo "[2/6] 生成 Prisma Client..."
npx prisma generate

# 3. 同步数据库
echo "[3/6] 同步数据库..."
npx prisma db push

# 4. 创建管理员账号
echo "[4/6] 创建管理员账号..."
node scripts/set-admin.js admin admin123

# 5. 构建应用
echo "[5/6] 构建应用..."
npm run build

# 6. 启动应用
echo "[6/6] 启动应用..."
pm2 start npm --name "$APP_NAME" -- start
pm2 save
pm2 startup

echo ""
echo "=========================================="
echo "  部署完成！"
echo "=========================================="
echo ""
echo "应用已启动在: http://localhost:3000"
echo "管理员账号: admin / admin123"
echo ""
echo "常用命令:"
echo "  查看日志: pm2 logs $APP_NAME"
echo "  重启应用: pm2 restart $APP_NAME"
echo "  停止应用: pm2 stop $APP_NAME"
echo ""
