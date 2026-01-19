# Zeabur 部署指南

本项目包含 Next.js 前端和后台数据采集脚本，为了同时运行这两个服务，我们采用了 **Docker + PM2** 的部署方案。

## 部署步骤

### 1. 准备工作（已完成）

我已经为你创建了以下必要的部署文件：

*   **Dockerfile**: 定义了如何构建镜像，安装依赖，构建 Next.js 应用，并使用 PM2 启动。
*   **ecosystem.config.js**: PM2 的配置文件，用于同时管理 Web 服务和 Fetcher 脚本。

### 2. 推送代码到 GitHub

确保你将最新的代码（包括新创建的 `Dockerfile` 和 `ecosystem.config.js`）提交并推送到你的 GitHub 仓库。

```bash
git add .
git commit -m "chore: add deployment config for Zeabur"
git push
```

### 3. 在 Zeabur 上创建项目

1.  登录 [Zeabur Dashboard](https://dash.zeabur.com/)。
2.  点击 **Create Project** (创建项目)。
3.  选择 **New Service** (新建服务) -> **GitHub**。
4.  搜索并选择你的 `财经新闻汇总` 仓库。
5.  Zeabur 会自动检测到 `Dockerfile` 并开始构建。

### 4. 配置环境变量

在 Zeabur 的服务设置页面，找到 **Variables** (环境变量) 选项卡，添加以下变量：

*   `DEEPSEEK_API_KEY`: 你的 DeepSeek API Key (如果需要在云端运行 AI 分析)。
*   `PORT`: `6081` (可选，虽然 Dockerfile 暴露了 6081，但 Zeabur 会自动处理端口映射，最好显式声明一下)。

### 5. 等待部署完成

Zeabur 会自动执行 `docker build`。构建完成后，你可以通过 Zeabur 提供的域名访问你的应用。

## 验证部署

部署成功后：

1.  **Web 访问**: 打开 Zeabur 提供的 URL，应该能看到新闻列表页。
2.  **后台任务**: 你可以在 Zeabur 的 **Logs** (日志) 选项卡中查看到 `[fetcher]` 开头的日志，说明后台采集任务正在正常运行。

## 注意事项

*   **数据持久化**: 目前使用的是 LokiJS (本地文件数据库)。在 Docker 容器重启或重新部署时，**数据会丢失**。
    *   *Zeabur 解决方案*: 如果需要持久化数据，你需要在 Zeabur 上挂载一个 Volume (存储卷)，并将 LokiJS 的数据库文件路径指向该挂载目录。
    *   或者，你可以考虑接入 MongoDB 或 PostgreSQL 等外部数据库（Zeabur 市场里可以直接一键部署）。
