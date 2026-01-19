# 使用官方 Node.js 镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 全局安装 PM2
RUN npm install -g pm2

# 复制项目所有文件
COPY . .

# 构建 Next.js 应用
RUN npm run build

# 暴露端口 (Zeabur 会自动处理，这里声明仅供参考)
EXPOSE 3000

# 使用 PM2 启动 ecosystem.config.js 中定义的所有应用
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
