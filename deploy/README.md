# 云服务器部署指南

本文档介绍如何将财经新闻汇总平台部署到云服务器（虚拟机）。

## 目录

- [服务器要求](#服务器要求)
- [部署步骤](#部署步骤)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

## 服务器要求

### 推荐配置

| 配置项 | 最低要求 | 推荐配置 |
|--------|----------|----------|
| CPU | 1核 | 2核+ |
| 内存 | 2GB | 4GB+ |
| 硬盘 | 20GB | 50GB+ SSD |
| 带宽 | 1Mbps | 5Mbps+ |
| 系统 | Ubuntu 20.04 | Ubuntu 22.04 |

### 云服务商推荐

- **阿里云** - 国内访问快，性价比高
- **腾讯云** - 稳定可靠，价格适中
- **华为云** - 企业级服务
- **AWS/Azure** - 海外用户首选

## 部署步骤

### 第一步：购买服务器

1. 选择云服务商，购买云服务器
2. 选择 Ubuntu 22.04 操作系统
3. 开放安全组端口：22(SSH)、80(HTTP)、443(HTTPS)

### 第二步：连接服务器

```bash
# 使用 SSH 连接服务器
ssh root@your-server-ip
```

### 第三步：运行初始化脚本

```bash
# 上传并运行初始化脚本
chmod +x server-setup.sh
./server-setup.sh
```

### 第四步：上传代码

在本地电脑执行：

```bash
# 方式1: 使用 scp
scp -r ./* root@your-server-ip:/var/www/finance-news/

# 方式2: 使用 rsync (推荐)
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.env' \
  ./ root@your-server-ip:/var/www/finance-news/

# 方式3: 使用 Git
ssh root@your-server-ip
cd /var/www
git clone https://github.com/youjia995-web/news.git finance-news
```

### 第五步：配置环境变量

```bash
# 在服务器上创建 .env 文件
cd /var/www/finance-news
cp deploy/.env.production.example .env
nano .env
```

修改以下配置：

```env
# 数据库连接 (本地 PostgreSQL)
DATABASE_URL="postgresql://finance_user:your_password@localhost:5432/finance_news"

# AI API Keys
DEEPSEEK_API_KEY="sk-xxx"
QWEN_API_KEY="sk-xxx"
TAVILY_API_KEY="tvly-dev-xxx"

# 股票数据
TUSHARE_TOKEN="your_token"

# NextAuth
NEXTAUTH_SECRET="生成一个32位随机字符串"
NEXTAUTH_URL="https://your-domain.com"
```

### 第六步：运行部署脚本

```bash
chmod +x deploy/deploy-after.sh
./deploy/deploy-after.sh
```

### 第七步：配置 Nginx

```bash
# 复制 Nginx 配置
cp deploy/nginx.conf /etc/nginx/sites-available/finance-news
ln -s /etc/nginx/sites-available/finance-news /etc/nginx/sites-enabled/

# 修改域名
nano /etc/nginx/sites-available/finance-news
# 将 your-domain.com 替换为你的域名

# 测试配置
nginx -t

# 重载 Nginx
systemctl reload nginx
```

### 第八步：配置 SSL (可选但推荐)

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx

# 获取 SSL 证书
certbot --nginx -d your-domain.com

# 自动续期
certbot renew --dry-run
```

### 第九步：配置定时任务

```bash
# 复制订时任务配置
cp deploy/cron.example /etc/cron.d/finance-news

# 创建日志目录
mkdir -p /var/log/finance-news
chown www-data:www-data /var/log/finance-news
```

## 配置说明

### PM2 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs finance-news

# 重启应用
pm2 restart finance-news

# 停止应用
pm2 stop finance-news

# 监控
pm2 monit
```

### 数据库管理

```bash
# 连接数据库
sudo -u postgres psql -d finance_news

# 备份数据库
pg_dump -U finance_user finance_news > backup.sql

# 恢复数据库
psql -U finance_user finance_news < backup.sql
```

### 更新部署

```bash
cd /var/www/finance-news

# 拉取最新代码
git pull

# 安装依赖
npm install

# 同步数据库
npx prisma db push

# 重新构建
npm run build

# 重启应用
pm2 restart finance-news
```

## 常见问题

### 1. 数据库连接失败

```bash
# 检查 PostgreSQL 状态
systemctl status postgresql

# 检查连接
psql -U finance_user -d finance_news -h localhost
```

### 2. 端口被占用

```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### 3. 内存不足

```bash
# 添加 Swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 永久生效
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 4. Nginx 502 错误

```bash
# 检查应用是否运行
pm2 status

# 检查端口
netstat -tlnp | grep 3000

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

## 费用估算

### 国内云服务器 (月费)

| 配置 | 阿里云 | 腾讯云 |
|------|--------|--------|
| 1核2G | ¥50-80 | ¥50-80 |
| 2核4G | ¥100-150 | ¥100-150 |
| 4核8G | ¥200-300 | ¥200-300 |

### 额外费用

- 域名：¥50-100/年
- SSL 证书：免费 (Let's Encrypt)
- 数据库：免费 (本地 PostgreSQL)

**总费用：约 ¥50-300/月**，远低于 Vercel Pro 订阅 ($20/月 ≈ ¥145/月)

## 联系支持

如有问题，请提交 GitHub Issue。
