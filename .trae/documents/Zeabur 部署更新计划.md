# 个股诊断模式切换计划：从数据库转向实时 API

根据您的需求，我们将修改个股诊断的数据获取逻辑，从“依赖本地全量数据库”改为“**按需调用 Tushare API 获取历史数据**”。这样可以避免维护庞大的本地数据库，并确保数据永远是最新的。

## 1. 核心变更逻辑

### 修改前 (Current)
1.  用户输入代码。
2.  `analyzeStock` 查询本地 `StockDaily` 表。
3.  如果本地没数据 -> 报错（或依赖每日定时任务更新）。
4.  计算指标 -> 分析。

### 修改后 (New Plan)
1.  用户输入代码。
2.  `analyzeStock` **直接调用 Tushare API (`daily`)**。
    *   参数：`ts_code` (股票代码), `start_date` (120天前), `end_date` (今天)。
3.  获取返回的 JSON 数据（约 80-120 条日线）。
4.  **实时计算指标**：将 API 返回的数据喂给现有的 `calculateIndicators` 函数。
5.  分析流程保持不变（Tavily 归因 + Qwen 决策）。

## 2. 实施步骤

### 2.1 更新 Tushare Fetcher
*   **文件**: `src/fetchers/tushare.js`
*   **新增函数**: `fetchHistory(symbol, days = 120)`
    *   计算 `start_date` 和 `end_date`。
    *   调用 Tushare `daily` 接口。
    *   **关键处理**: Tushare 返回的数据通常是**倒序**的（最新日期在前），而指标计算通常需要**正序**（旧->新）。需要在函数中进行反转。
    *   格式化数据：将 API 返回的数组转换为对象数组 `{ trade_date, close, open, ... }`，适配 `calculateIndicators` 的输入格式。

### 2.2 重构 Analyst 逻辑
*   **文件**: `src/ai/analyst.js`
*   **修改**: `analyzeStock` 函数。
    *   **移除**: `prisma.stockDaily.findMany` 查询。
    *   **新增**: 调用 `tushare.fetchHistory(tsCode, 150)`（多取一点缓冲，确保 MA60 等指标计算准确）。
    *   **回退机制**: 如果 API 失败（如频控或网络问题），可以尝试查本地数据库作为备选（可选，或者直接报错提示）。

### 2.3 清理冗余代码 (可选)
*   如果不再需要维护本地 `StockDaily` 数据库，可以：
    *   停止 `scripts/fetcher.js` 中的每日全量同步任务（节省服务器资源）。
    *   保留 `StockDaily` 表结构作为缓存，或者完全移除。
    *   *建议保留表结构但不强制同步，未来可以做缓存优化。*

## 3. 优势
*   **轻量化**：无需维护 10GB+ 的历史数据表。
*   **实时性**：总是获取最新行情（Tushare 收盘后更新）。
*   **灵活性**：支持任意股票，不受限于本地库是否收录。

## 4. 潜在风险与对策
*   **Tushare 频控**：Tushare 免费接口有每分钟调用限制。
    *   *对策*：个股诊断是用户触发的，频率通常不高。如果并发高，可以加简单的内存缓存（如 10 分钟内查过就不再查）。

## 5. 执行计划
1.  修改 `src/fetchers/tushare.js` 添加 `fetchHistory` 方法。
2.  修改 `src/ai/analyst.js` 接入新方法。
3.  测试个股诊断功能。
