# Zeabur 部署指南 (PostgreSQL 版)

本项目已针对 Zeabur 的 PostgreSQL 数据库进行了优化配置。

## 部署步骤

### 1. 创建 PostgreSQL 服务

1. 登录 Zeabur 控制台。
2. 在你的项目中，点击 **Create Service** -> **Prebuilt**。
3. 搜索并选择 **PostgreSQL**。
4. 创建成功后，PostgreSQL 服务会自动启动。

### 2. 获取数据库连接串

1. 点击刚刚创建的 PostgreSQL 服务。
2. 进入 **Connection** 选项卡。
3. 复制 **PostgreSQL Connection String** (通常以 `postgres://` 或 `postgresql://` 开头)。

### 3. 配置 Next.js 服务环境变量

1. 进入你的 Next.js 服务 (financialnews) -> **Variables**。
2. 添加或修改环境变量：
   - **Key**: `DATABASE_URL`
   - **Value**: 粘贴刚才复制的连接串
   
   *注意：如果你的 Next.js 服务和 PostgreSQL 服务在同一个 Zeabur 项目中，你也可以使用内部网络别名连接，但直接使用 Connection String 是最简单的方式。*

### 4. 重新部署

配置好环境变量后，Zeabur 通常会自动重启服务。如果没有，请手动点击 **Redeploy**。

## 启动流程说明

为了简化部署流程，我们修改了启动脚本：

```json
"start": "npx prisma db push && next start -H 0.0.0.0"
```

每次服务启动时，会自动执行 `npx prisma db push`。这个命令会检查数据库结构并自动同步 Schema（创建表、更新字段），无需手动执行迁移命令，非常适合快速迭代和部署。

## 本地开发注意事项

由于 Schema 已切换为 `postgresql`，本地开发如果想连接数据库，也需要一个 PostgreSQL 环境。

如果你本地没有安装 PostgreSQL，可以使用 Docker 启动一个：

```bash
docker run --name my-postgres -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres
```

然后将本地 `.env` 中的 `DATABASE_URL` 修改为：
`postgresql://postgres:mysecretpassword@localhost:5432/postgres`
