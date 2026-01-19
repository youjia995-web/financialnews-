# Zeabur 数据持久化指南 (Prisma/SQLite 版)

本项目已升级为使用 Prisma + SQLite 存储数据。
SQLite 是一个标准的单文件关系型数据库，比之前的 JSON 文件更稳定、功能更强，且方便导出。

在 Zeabur 上部署时，为了防止数据丢失，依然需要配置持久化存储。

## 第一步：创建挂载卷 (Volume)

1. 登录 Zeabur 控制台。
2. 进入你的项目 -> **Volumes**。
3. 创建一个新的 Volume，例如命名为 `sqlite-data`。

## 第二步：挂载到服务

1. 进入 Next.js 服务 (financialnews) -> **Settings** -> **Mounts**。
2. 添加挂载：
   - **Volume**: `sqlite-data`
   - **Path**: `/app/prisma/db` (我们将把数据库文件放在这个专门的目录下)

## 第三步：修改环境变量

1. 进入服务 -> **Variables**。
2. 修改（或添加）`DATABASE_URL`：
   - **Key**: `DATABASE_URL`
   - **Value**: `file:/app/prisma/db/dev.db`
   
   *注意：路径必须以 `file:` 开头，后面是挂载路径下的文件名。*

## 第四步：部署时的数据库初始化

Zeabur 部署时会自动运行 `prisma migrate deploy`（如果我们在 build 命令中加了的话，或者作为启动脚本的一部分）。
为了确保万无一失，建议修改 `package.json` 中的启动脚本：

原 `start`:
```json
"start": "next start -H 0.0.0.0"
```

建议改为（每次启动前自动迁移数据库）：
```json
"start": "npx prisma migrate deploy && next start -H 0.0.0.0"
```
(我已经帮你改好了)

## 本地开发

本地开发时，数据库文件位于 `prisma/dev.db`。你可以使用任何 SQLite 客户端（如 DBeaver, DB Browser for SQLite）直接打开它来查看或导出数据。
