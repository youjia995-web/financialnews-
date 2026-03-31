# AI 财经情报官 - 开发文档

## 1. 功能概述

AI 财经情报官（AI Intelligence Analyst）是一个基于大模型的财经新闻分析系统，能够自动：

- **聚合** 多数据源财经快讯
- **去重** 智能剔除重复内容
- **分析** 提取核心事件和市场情绪
- **生成** 结构化的全天财经研报

---

## 2. 工作流程

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 查询新闻数据                                       │
│  - 时间范围: startTime ~ endTime                            │
│  - 数据源: News 表                                          │
│  - 排序: 按发布时间正序                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 去重处理 (Deduplication)                           │
│  - 算法: Levenshtein 距离                                    │
│  - 规则: 相似度 > 70% 视为重复                               │
│  - 策略: 按时间倒序，保留最新新闻                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Map 阶段 (分块提取)                                 │
│  - 分块: 每 20 条新闻为一组                                   │
│  - 并行: Promise.all 并发处理                                │
│  - 模型: Qwen-Max                                            │
│  - 输出: 核心事件、市场情绪、涉及板块                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Reduce 阶段 (汇总生成)                              │
│  - 输入: Map 阶段所有结果                                     │
│  - 模型: Qwen-Max                                            │
│  - 输出: Markdown 格式研报                                    │
│  - Token: max_tokens = 3000                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Step 5: 保存报告                                           │
│  - 存储: Report 表                                           │
│  - 字段: start_time, end_time, content, created_at           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 核心提示词

### 3.1 Map 阶段提示词

```markdown
请分析以下一组财经新闻，提取关键信息：
1. 核心事件（去重后的重要事实）
2. 市场情绪（利好/利空/中性）
3. 涉及板块

新闻列表：
[每条新闻格式: - [时间] 标题 (摘要:xxx)]

请输出简练的总结。
```

**设计意图**：
- 限制输出范围，避免信息过载
- 结构化提取：事件、情绪、板块
- 简练总结，为 Reduce 阶段提供素材

### 3.2 Reduce 阶段提示词

```markdown
你是一位资深的"AI财经情报官"。基于以下分段整理的财经新闻摘要，
请撰写一份结构清晰、深度洞察的全天财经情报研报。

输入素材：
[Map阶段提取的内容...]

请严格按照以下 Markdown 格式输出：

# 📊 AI 财经全天情报 (日期)

## 1. 宏观情绪温度计
[用一句话概括全天市场情绪]
- **情绪指数**：[0-100打分]
- **核心驱动**：[关键因子]

## 2. 全天脉络梳理
[3-5个关键转折点]
- ⏰ [时间] **[事件标题]**：[解读及影响]

## 3. 板块轮动推演
- 🔥 **强势板块**：[板块名] - [上涨逻辑]
- 🧊 **弱势板块**：[板块名] - [下跌原因]
- 🔄 **轮动预期**：[预测方向]

## 4. 💡 操盘策略建议
- **短线**：...
- **中长线**：...
- **风险提示**：...

(注：仅供参考，不构成投资建议)
```

**设计意图**：
- 固定格式输出，便于前端渲染
- 多维度分析：情绪、脉络、板块、策略
- 包含免责声明，合规性要求

---

## 4. 去重算法

### 4.1 Levenshtein 距离

编辑距离算法，计算将字符串 A 转换为字符串 B 所需的最少单字符编辑操作次数。

### 4.2 去重规则

```javascript
// 1. 标题完全相同 → 视为重复
if (item.title === unique.title) {
  isDuplicate = true
}

// 2. 标题相似度 > 70% → 视为重复
const dist = levenshtein(item.title, unique.title)
const maxLen = Math.max(item.title.length, unique.title.length)
if (maxLen > 5 && dist / maxLen < 0.3) {
  isDuplicate = true
}
```

### 4.3 去重策略

- **时间倒序处理**：优先保留最新发布的新闻
- **去重优先级**：新新闻 > 旧新闻

---

## 5. 配置参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `CHUNK_SIZE` | 20 | Map 阶段每组处理的新闻数量 |
| `max_tokens` | 3000 | Reduce 阶段输出最大 Token 数 |
| `timeout` | 8s | 单次 AI 调用超时时间（generator.js） |

---

## 6. 数据结构

### 6.1 Report 模型

```prisma
model Report {
  id          String   @id @default(uuid())
  start_time  BigInt   // 报告覆盖的时间范围起点
  end_time    BigInt   // 报告覆盖的时间范围终点
  content     String   // Markdown 格式的研报内容
  created_at  BigInt   // 创建时间戳

  @@index([created_at])
}
```

### 6.2 API 请求/响应

**请求**:
```json
POST /api/intelligence
{
  "start": 1742736000000,  // 开始时间戳 (ms)
  "end": 1742822399999     // 结束时间戳 (ms)
}
```

**响应**:
```json
{
  "ok": true,
  "report": {
    "id": "uuid",
    "start_time": "1742736000000",
    "end_time": "1742822399999",
    "content": "# 📊 AI 财经全天情报...",
    "created_at": "1742784000000"
  }
}
```

---

## 7. 文件结构

```
src/
├── intelligence/
│   └── processor.js    # 核心处理逻辑 (generateReport, mapReduceAnalyze, deduplicate)
│
app/
├── api/
│   └── intelligence/
│       └── route.js    # API 入口
│
└── components/
    └── AIEntries.js    # 前端交互组件
```

---

## 8. 扩展建议

### 8.1 支持多数据源分别分析

当前实现将所有新闻混合处理，可以扩展为：

```javascript
// 按来源分组分析
const bySource = {
  eastmoney: items.filter(i => i.source === 'eastmoney'),
  cls: items.filter(i => i.source === 'cls'),
  wallstreetcn: items.filter(i => i.source === 'wallstreetcn')
}
```

### 8.2 支持时段细分

当前是全天研报，可以支持早盘/午盘/收盘不同时段：

```javascript
const periods = {
  morning: { start: '09:00', end: '11:30' },
  afternoon: { start: '13:00', end: '15:00' },
  closing: { start: '15:00', end: '18:00' }
}
```

### 8.3 缓存优化

对于相同时间范围的研报，可以缓存结果避免重复生成：

```javascript
// 检查是否已有缓存
const existing = await prisma.report.findFirst({
  where: {
    start_time: BigInt(startTime),
    end_time: BigInt(endTime),
    created_at: { gte: BigInt(Date.now() - 3600000) } // 1小时内不重复生成
  }
})
```

### 8.4 支持流式输出

使用 SSE (Server-Sent Events) 实现流式输出，提升用户体验：

```javascript
// 分阶段发送进度
res.write(`data: ${JSON.stringify({ stage: 'dedup', progress: 30 })}\n\n`)
res.write(`data: ${JSON.stringify({ stage: 'map', progress: 50 })}\n\n`)
res.write(`data: ${JSON.stringify({ stage: 'reduce', progress: 80 })}\n\n`)
```

---

## 9. 注意事项

1. **Token 限制**: Qwen-Max 单次调用有 Token 限制，新闻数量过多时需要分批处理
2. **超时处理**: AI 调用可能较慢，需要设置合理的超时时间
3. **错误重试**: Map 阶段某个 chunk 失败时，不影响其他 chunk
4. **数据质量**: 研报质量依赖新闻数据的完整性和准确性

---

## 10. 相关文档

- [AI 个股分析官开发文档](./STOCK_ANALYST.md)
- [快讯点评功能说明](./BRIEF_NOTES.md)
