# V2 升级方案：股票资讯与 AI 分析官

## 1. 数据库架构升级
- **新增模型 `StockDaily`** (Prisma/PostgreSQL)：
  - 用于存储 Tushare 股票日线数据。
  - 字段包括：`ts_code` (股票代码), `trade_date` (交易日期), `open`, `high`, `low`, `close`, `vol`, `amount` 等。
  - 复合主键：`[ts_code, trade_date]`。

## 2. 历史数据迁移 (stocks.db -> Postgres)
- **迁移策略**：
  1. 使用 `sqlite3` 命令行工具将 `stocks.db` 中的 `daily_kline` 表导出为 CSV。
  2. 编写迁移脚本 `scripts/migrate-stocks.js` 读取 CSV。
  3. **数据清洗**：
     - 日期格式转换：`YYYY-MM-DD` -> `YYYYMMDD`。
     - 代码格式转换：`sh600000` -> `600000.SH`, `sz000001` -> `000001.SZ`。
  4. 批量写入 PostgreSQL 数据库。

## 3. Tushare 股票数据接入
- **API 客户端** (`src/fetchers/tushare.js`)：
  - 对接 Tushare HTTP API (`http://api.tushare.pro`)。
  - 实现 `daily` 接口调用。
  - **频控机制**：实现令牌桶或简单的延时队列，确保不超过 500次/分钟。
- **定时任务**：
  - 更新 `scripts/fetcher.js`，增加每天 **17:00** 触发 Tushare 数据同步任务。

## 4. Tavily 搜索集成
- **工具封装** (`src/tools/tavily.js`)：
  - 封装 Tavily Search API，用于获取实时互联网信息。
  - 支持 `search` 和 `extract` 功能，优化上下文给 LLM。

## 5. AI 个股分析官模块
- **核心逻辑** (`src/ai/analyst.js`)：
  - **功能 1：个股深度诊断 (Qwen-Max)**
    - 输入：股票代码。
    - 流程：Tavily 搜索最新资讯 + 查询 DB 历史行情 -> 构建专业 Prompt -> 调用 Qwen-Max。
    - 输出：结构化 Markdown 报告（核心结论、基本面、风险、利好、关键价位、操作建议）。
  - **功能 2：智能财经问答 (DeepSeek)**
    - 输入：自然语言问题（如“特斯拉最近信息”）。
    - 流程：Tavily 搜索 + 本地财经新闻聚合 -> 构建 Context -> 调用 DeepSeek。
    - 输出：深度综合回答。

## 6. 前端界面开发
- **新增页面 `/analyst`**：
  - **个股诊断 Tab**：输入代码，展示专业研报。
  - **智能问答 Tab**：对话式交互，展示 AI 回答。
- **API 路由**：
  - `POST /api/analyst/stock`
  - `POST /api/analyst/query`

## 7. 实施步骤
1. **配置环境**：更新 `.env` 添加 API Keys。
2. **数据库变更**：更新 Prisma Schema 并推送。
3. **数据迁移**：执行迁移脚本导入历史数据。
4. **后端开发**：实现 Tushare Fetcher, Tavily Tool, AI Analyst Logic。
5. **接口开发**：创建 Next.js API Routes。
6. **前端开发**：构建分析师页面。
7. **测试与验证**。
