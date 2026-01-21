# HuokingNews.AI - 智能财经决策平台

**HuokingNews.AI** 是一个集成了实时财经快讯、宏观情报分析与深度个股诊断的下一代智能财经平台。它利用 AI 技术将海量碎片化的市场信息转化为可执行的投资决策辅助。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14.0-black)
![Prisma](https://img.shields.io/badge/Prisma-5.0-green)

## ✨ 核心功能

### 1. ⚡️ 实时财经快讯聚合
- **全网监控**：24小时不间断聚合东方财富、华尔街见闻等主流财经媒体快讯。
- **智能去重**：利用 AI 语义分析自动剔除重复内容。
- **一句话点评**：DeepSeek 模型为每条快讯生成客观、犀利的 40 字短评。
- **情感分析**：自动标注利好/利空情绪，辅助快速判断市场风向。

### 2. 🤖 AI 财经情报官 (Macro Analyst)
- **宏观脉络梳理**：一键生成全天市场情报研报。
- **去重与归纳**：从海量新闻中提取核心叙事，分析板块轮动逻辑。
- **情绪推演**：结合宏观政策与市场舆情，推演次日可能的市场走势。

### 3. 📈 AI 个股分析官 (Stock Doctor)
**"三引擎驱动" 的深度诊断架构：**
- **📊 数据引擎 (Data Engine)**：
  - 基于 Tushare 获取全量历史行情（近10年）。
  - 实时计算 MA, MACD, RSI, KDJ, Bollinger Bands, ATR, 历史波动率等技术指标。
  - 自动筛选“关键异常日”（暴涨暴跌、巨量突破）。
- **📰 信息引擎 (Information Engine)**：
  - 集成 **Tavily Search API**，对每个“异常日期”进行历史归因搜索（寻找暴涨暴跌背后的真实原因）。
  - 实时搜索今日个股舆情与政策利好。
- **🧠 决策引擎 (Decision Engine)**：
  - **Qwen-Max** 大模型结合技术面数据与历史归因信息，进行深度逻辑推理。
  - 生成包含“股性分析”、“困境反转/趋势跟随策略”及“今日操作建议”的专业研报。

### 4. 🛡️ 用户与权限系统
- **安全认证**：基于 NextAuth.js 的用户认证（用户名+密码）。
- **角色管理**：支持普通用户与管理员角色。
- **后台管理**：管理员可管理所有用户账号与权限。

---

## 🛠 技术栈

- **框架**: Next.js 14 (App Router)
- **数据库**: PostgreSQL (Prisma ORM)
- **AI 模型**:
  - **Qwen-Max (通义千问)**: 用于深度逻辑推理与策略生成。
  - **DeepSeek V3**: 用于快讯点评与短文本分析。
- **数据源**:
  - **Tushare Pro**: A股历史与实时行情。
  - **Tavily**: AI 优化的实时互联网搜索引擎。
- **工具库**:
  - `technicalindicators`: 纯 JS 实现的金融技术指标计算。
  - `cheerio` / `puppeteer`: 爬虫与数据抓取。

---

## 🚀 快速开始

### 1. 环境准备
确保已安装 Node.js 18+ 和 PostgreSQL。

### 2. 克隆项目
```bash
git clone https://github.com/your-repo/financialnews-.git
cd financialnews
npm install
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env` 并填入以下信息：

```env
# 数据库连接
DATABASE_URL="postgresql://user:password@localhost:5432/financial_news"

# AI 模型密钥
DASHSCOPE_API_KEY="sk-..."      # Qwen
DEEPSEEK_API_KEY="sk-..."       # DeepSeek
TAVILY_API_KEY="tvly-..."       # Tavily Search

# 股票数据源
TUSHARE_TOKEN="your_token"

# 认证安全
NEXTAUTH_SECRET="your_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. 数据库初始化
```bash
npx prisma db push
```

### 5. 初始化管理员账号
```bash
node scripts/set-admin.js admin 123456
```

### 6. 启动服务
```bash
# 启动开发服务器
npm run dev

# 启动数据采集脚本（建议配合 pm2 运行）
node scripts/fetcher.js
```

访问 `http://localhost:3000` 即可使用。

---

## 📂 项目结构

```
├── app/                  # Next.js 页面与 API
│   ├── api/              # 后端接口 (Auth, Analyst, Intelligence)
│   ├── analyst/          # 个股分析官页面
│   ├── admin/            # 后台管理页面
│   └── components/       # UI 组件
├── lib/                  # 公共库 (Prisma, Utils)
├── prisma/               # 数据库模型 (Schema)
├── scripts/              # 独立脚本
│   ├── fetcher.js        # 新闻抓取定时任务
│   ├── migrate-stocks.js # 股票数据迁移
│   └── set-admin.js      # 管理员设置
├── src/                  # 核心逻辑
│   ├── ai/               # AI 模型封装 (Analyst, Generator)
│   ├── fetchers/         # 数据源适配器 (Eastmoney, Tushare)
│   └── tools/            # 工具库 (Tavily)
└── public/               # 静态资源
```

## 📝 License

MIT License.
