# 多 Agent 效率评测基础设施 — Technical Roadmap

> **文档版本：** v1.0
> **创建日期：** 2026-03-22
> **负责人：** Engineering Architect Agent (YC Factory)
> **目标：** 订阅制 SaaS 服务，8 周 MVP 上线

---

## 目录

1. [总体技术架构图](#1-总体技术架构图)
2. [MVP 分阶段开发计划](#2-mvp-分阶段开发计划)
3. [技术栈选型](#3-技术栈选型)
4. [DevOps / 部署架构](#4-devops--部署架构)
5. [开放 API 设计](#5-开放-api-设计)
6. [里程碑总览](#6-里程碑总览)

---

## 1. 总体技术架构图

### 1.1 系统分层架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Web App   │  │  Dashboard  │  │   Admin     │  │   SDK /     │    │
│  │   (Next.js) │  │   (React)   │  │   Portal    │  │   CLI       │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          EDGE GATEWAY LAYER                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     Cloudflare Edge / AWS CloudFront             │    │
│  │              (WAF • Rate Limiting • Auth • Routing)              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  REST API    │  │  WebSocket   │  │  gRPC API    │                  │
│  │  (Express)   │  │  (Socket.io) │  │  (gRPC-web)  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    API Gateway (Kong / AWS API Gateway)          │   │
│  │              Authentication • Authorization • Throttling           │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│     CORE SERVICES     │ │     CORE SERVICES     │ │     CORE SERVICES     │
│                       │ │                       │ │                       │
│  ┌─────────────────┐  │ │  ┌─────────────────┐  │ │  ┌─────────────────┐  │
│  │  LLM Gateway   │  │ │  │  Translation    │  │ │  │  Prompt        │  │
│  │  (代理层/拦截)  │  │ │  │  Gap Engine     │  │ │  │  Analyzer      │  │
│  └─────────────────┘  │ │  └─────────────────┘  │ │  └─────────────────┘  │
│  ┌─────────────────┐  │ │  ┌─────────────────┐  │ │  ┌─────────────────┐  │
│  │  Budget         │  │ │  │  Benchmark     │  │ │  │  Cost          │  │
│  │  Guardrails     │  │ │  │  Aggregator     │  │ │  │  Attribution   │  │
│  └─────────────────┘  │ │  └─────────────────┘  │ │  └─────────────────┘  │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
            │                       │                       │
            └───────────────────────┼───────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA & STORAGE LAYER                              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                │
│  │  PostgreSQL   │  │  TimescaleDB  │  │  Redis        │                │
│  │  (主数据)      │  │  (时序数据)    │  │  (缓存/队列)   │                │
│  └───────────────┘  └───────────────┘  └───────────────┘                │
│  ┌───────────────┐  ┌───────────────┐                                    │
│  │  S3 / R2      │  │  ClickHouse   │                                    │
│  │  (原始日志)    │  │  (OLAP查询)    │                                    │
│  └───────────────┘  └───────────────┘                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        ML / ANALYTICS LAYER                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Anomaly        │  │  Benchmark      │  │  Prompt         │          │
│  │  Detection      │  │  Scoring        │  │  Optimization   │          │
│  │  (Python/ML)    │  │  (Aggregation)   │  │  (LLM-powered)  │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 LLM Gateway 代理架构（核心拦截层）

```
┌─────────────────────────────────────────────────────────────────┐
│                      Client Application                          │
│         (Any LLM SDK: OpenAI SDK, Anthropic SDK, etc.)          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LLM Gateway (本地代理)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Request Intercept                       │  │
│  │  • 拦截所有 LLM API 请求                                    │  │
│  │  • 自动注入 user_id / session_id / trace_id                │  │
│  │  • 支持 OpenAI / Anthropic / Google / Ollama 等             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                │                                 │
│                    ┌───────────┴───────────┐                    │
│                    ▼                       ▼                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐       │
│  │    Forward to Provider  │  │    Record to Buffer    │       │
│  │    (原样转发)             │  │    (异步写入)           │       │
│  └─────────────────────────┘  └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │  OpenAI     │      │  Anthropic  │      │  Google    │
    │  API        │      │  API        │      │  API       │
    └─────────────┘      └─────────────┘      └─────────────┘
```

### 1.3 数据流向架构

```
┌──────────────────────────────────────────────────────────────────┐
│                         数据流向图                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   LLM Request ──┐                                                │
│                 ▼                                                │
│   ┌────────────────────────────┐                                 │
│   │   Gateway (Node.js)        │◄── 拦截请求                      │
│   │   • base_url = 本地代理     │                                 │
│   │   • 零侵入 SDK              │                                 │
│   └────────────┬────────────────┘                                 │
│                │                                                  │
│                ▼ 异步写入                                          │
│   ┌────────────────────────────┐                                 │
│   │   Redis (Event Buffer)     │──► Kafka / SQS                   │
│   │   • 请求/响应对             │                                 │
│   │   • < 10ms 延迟             │                                 │
│   └────────────┬────────────────┘                                 │
│                │                                                  │
│                ▼                                                  │
│   ┌────────────────────────────┐                                 │
│   │   TimescaleDB              │◄── 时序聚合                      │
│   │   • 原始 trace 数据         │                                 │
│   │   • 自动压缩                │                                 │
│   └────────────┬────────────────┘                                 │
│                │                                                  │
│                ▼                                                  │
│   ┌────────────────────────────┐                                 │
│   │   Translation Gap Engine   │◄── 核心计算                      │
│   │   • 有效 token 计算          │                                 │
│   │   • Prompt 来源分类          │                                 │
│   │   • Budget 检查             │                                 │
│   └────────────┬────────────────┘                                 │
│                │                                                  │
│        ┌───────┴───────┐                                          │
│        ▼               ▼                                          │
│   ┌─────────┐    ┌─────────┐                                      │
│   │Dashboard│    │  API   │                                      │
│   │(实时)   │    │(查询)  │                                      │
│   └─────────┘    └─────────┘                                      │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 1.4 核心实体关系图（ERD）

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   User      │       │  Workspace  │       │   Agent     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │──┐    │ id          │    ┌──│ id          │
│ email       │  │    │ name        │    │  │ name        │
│ plan        │  │    │ user_id     │◄──┘  │ workspace_id│◄─┐
│ created_at  │  │    │ plan        │       │ config      │  │
└─────────────┘  │    │ created_at  │       └─────────────┘  │
                 │    └─────────────┘              │         │
                 │           │                      │         │
                 │           ▼                      │         │
                 │    ┌─────────────┐               │         │
                 │    │  Session   │               │         │
                 │    ├─────────────┤               │         │
                 │    │ id          │               │         │
                 └────│ user_id     │               │         │
                      │ workspace_id│               │         │
                      └─────────────┘               │         │
                             │                      │         │
                             ▼                      │         │
┌─────────────┐       ┌─────────────┐               │         │
│  LLMCall    │◄──────│  Trace      │◄──────────────┘         │
├─────────────┤       ├─────────────┤               │         │
│ id          │       │ id          │               │         │
│ trace_id    │◄──┐   │ session_id  │               │         │
│ provider    │   │   │ agent_id    │               │         │
│ model       │   │   │ started_at  │               │         │
│ input_tokens│   │   └─────────────┘               │         │
│ output_tokens│  │          │                       │         │
│ effective   │   │          ▼                       │         │
│   _tokens   │   │   ┌─────────────┐                 │         │
│ prompt_type │   │   │ PromptMeta │                 │         │
│ cost_usd    │   │   ├─────────────┤                 │         │
│ latency_ms  │   │   │ id          │                 │         │
│ guardrail   │   │   │ trace_id    │◄────────────────┘         │
│   _triggered│   │   │ type        │  (human_first /            │
└─────────────┘   │   │ content     │   human_edit /             │
                  │   │ tokens      │   framework_auto)           │
                  │   └─────────────┘                            │
                  │                                               │
                  │   ┌─────────────┐                            │
                  └───│ BudgetAlert │                            │
                      ├─────────────┤                            │
                      │ id          │                            │
                      │ user_id     │                            │
                      │ threshold   │                            │
                      │ triggered_at│                            │
                      │ action      │                            │
                      └─────────────┘                            │
                                                              │
                      ┌─────────────┐                           │
                      │ Benchmark   │                           │
                      ├─────────────┤                           │
                      │ id          │                           │
                      │ industry    │                           │
                      │ task_type   │                           │
                      │ avg_tg      │                           │
                      │ p50_tg      │                           │
                      │ p95_tg      │                           │
                      │ sample_size │                           │
                      │ anonymized  │                           │
                      └─────────────┘                           │
```

---

## 2. MVP 分阶段开发计划

### 2.1 总览：8 周冲刺

```
Week 1-2  ████████░░░░░░░░░░░░░░░  Foundation (核心基础设施)
Week 3-4  ░░░░░░░░████████░░░░░░  Core Engine (TG引擎 + Gateway)
Week 5-6  ░░░░░░░░░░░░░░████████  Dashboard + API
Week 7    ░░░░░░░░░░░░░░░░░░████  Integration + Testing
Week 8    ░░░░░░░░░░░░░░░░░░░░██  Launch Prep + Beta
```

### 2.2 详细每周计划

#### **Week 1：项目骨架 + 数据库设计**

| 日期 | 任务 | 交付物 |
|------|------|--------|
| Day 1-2 | 项目初始化（Monorepo + TypeScript + Docker） | `docker-compose.yml`, `package.json`, `tsconfig.json` |
| Day 1-2 | 数据库 Schema 设计 | `migrations/001_initial_schema.sql` |
| Day 3-4 | PostgreSQL + TimescaleDB + Redis 搭建 | 运行的本地 DB 实例 |
| Day 5 | 核心数据模型实现 | User, Workspace, Agent, Trace 实体 |
| Weekend | **DHP-01**: 本地跑通完整数据流 | 代码 + 文档 |

**DHP（Done-Highlight-Post）：** Week 1 结束时有本地跑通的骨架，DB 读写正常。

---

#### **Week 2：LLM Gateway 代理（核心拦截）**

| 日期 | 任务 | 交付物 |
|------|------|--------|
| Day 1-2 | Gateway HTTP 代理实现（Express） | 支持 OpenAI compatible API |
| Day 3-4 | Provider 转发（OpenAI / Anthropic / Ollama） | 多 Provider 支持 |
| Day 5 | Request/Response 拦截 + metadata 注入 | trace_id, session_id 注入 |
| Weekend | **DHP-02**: Gateway 跑通真实 LLM 调用 | 请求记录写入 DB |

**关键技术决策：**
- Gateway base_url = `http://localhost:8080/llm-gateway`（或用户配置的远程地址）
- 使用 `http-proxy-middleware` 进行请求转发
- Request/Response 通过 `async-hooks` 或手动 context 追踪

**DHP：** Week 2 结束时代理正常工作，调用 OpenAI 的请求被记录。

---

#### **Week 3：Translation Gap 引擎**

| 日期 | 任务 | 交付物 |
|------|------|--------|
| Day 1-2 | TG 计算算法设计 | `tg_calculator.ts` |
| Day 3-4 | 有效 Token 判定逻辑（采纳 vs 忽略） | 基于 message role + usage 的启发式算法 |
| Day 5 | Benchmark 聚合基础实现 | 匿名化聚合逻辑 |
| Weekend | **DHP-03**: TG 报告生成 | 单次调用的 TG 分数 + 可视化 |

**TG 算法核心逻辑：**
```
TG = effective_output_tokens / total_input_tokens

effective_output_tokens 判定：
1. 统计 assistant role 的 output_tokens
2. 减去被 human 明确拒绝/修正的部分
3. 减去重试循环中的重复输出
4. 基础版：output_tokens / input_tokens（忽略 message）
```

**DHP：** 能对任意 LLM 调用输出 TG 分数报告。

---

#### **Week 4：Budget Guardrails + Prompt 分析**

| 日期 | 任务 | 交付物 |
|------|------|--------|
| Day 1-2 | 预算熔断实现（硬性阈值） | `budget_guardrails.ts` |
| Day 3-4 | 重试循环检测 | 检测 3 次以上相同错误 |
| Day 5 | Prompt 来源分类（human_first / human_edit / framework_auto） | `prompt_classifier.ts` |
| Weekend | **DHP-04**: Guardrails 测试 | 模拟超预算场景，验证熔断 |

**Prompt 分类算法：**
```
Prompt Type 判定：
1. framework_auto：system prompt 含特定 keyword（"You are a..."）
2. human_edit：检测 message 历史中的修改标记
3. human_first：其余所有
```

**DHP：** Budget Guardrail 在超限时正确熔断，Prompt 分类准确率 > 80%。

---

#### **Week 5：Dashboard 前端**

| 日期 | 任务 | 交付物 |
|------|------|--------|
| Day 1-2 | Next.js 14 App Router 初始化 | `dashboard/` |
| Day 3-4 | TG 仪表盘（折线图 + 分布直方图） | Recharts / Tremor 组件 |
| Day 5 | Agent 效率排名 + Prompt 分析视图 | 多维度分析 UI |
| Weekend | **DHP-05**: Beta Dashboard | 可分享的内部链接 |

**前端技术栈：**
- Next.js 14（App Router）
- Tailwind CSS + shadcn/ui
- Recharts（数据可视化）
- TanStack Query（数据获取）

**DHP：** 用户可看到 TG 趋势、Top Agents、Prompt 分类饼图。

---

#### **Week 6：认证 + 订阅 + 计费**

| 日期 | 任务 | 交付物 |
|------|------|--------|
| Day 1-2 | NextAuth.js + Magic Link 登录 | 邮箱登录（无密码） |
| Day 3-4 | Stripe 订阅集成（Free / Pro / Enterprise） | 订阅管理页面 |
| Day 5 | 使用量追踪（Agent 数量 + Token 数量） | `usage_tracker.ts` |
| Weekend | **DHP-06**: 完整支付流程 | Stripe webhook 处理 |

**订阅方案：**

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 3 Agents / 月 10 万 tokens / 7 天数据 |
| Pro | $99/mo | 无限 Agents / Prompt 分析 / Benchmark |
| Enterprise | $500/mo+ | 私有部署 / 定制 SLA / API 优先 |

**DHP：** 用户可注册、订阅、查看账单。

---

#### **Week 7：集成 + E2E 测试**

| 日期 | 任务 | 交付物 |
|------|------|--------|
| Day 1-2 | Python SDK (`pip install agentoscope`) | PyPI 包 |
| Day 1-2 | JS/TS SDK (`npm install agentoscope`) | npm 包 |
| Day 3-4 | Docker 一键部署 | `docker-compose.prod.yml` |
| Day 5 | Playwright E2E 测试 | 核心路径覆盖 |
| Weekend | **DHP-07**: 内部 Beta 测试 | 3 个真实多 Agent 项目接入 |

**SDK 设计（用户接入示例）：**
```python
# Python SDK - 用户代码改动最小化
from agentoscope import Agentoscope

client = Agentoscope(api_key="...")
client.configure(base_url="http://localhost:8080/llm-gateway")  # 仅改这一行

# 或者使用环境变量
# OPENAI_BASE_URL=http://localhost:8080/llm-gateway
```

**DHP：** 外部用户 10 分钟内完成接入。

---

#### **Week 8：Launch 准备**

| 日期 | 任务 | 交付物 |
|------|------|--------|
| Day 1-2 | Landing Page | 产品页 + 定价页 |
| Day 3-4 | 文档站点 (Vercel) | docs.agentoscope.dev |
| Day 5 | 性能优化（DB 索引 + 查询优化） | P95 < 200ms |
| Day 6-7 | **LAUNCH** | Public Beta |

**Launch 清单：**
- [ ] Landing Page 上线
- [ ] Free Plan 开放注册
- [ ] 文档站上线
- [ ] Twitter/社区 announcement
- [ ] 监控告警配置（PagerDuty / Slack）
- [ ] 数据备份策略验证

---

## 3. 技术栈选型

### 3.1 每层详细选型

#### **前端层**

| 组件 | 技术选型 | 选型理由 |
|------|----------|----------|
| Framework | Next.js 14 (App Router) | SSR + API routes 同构，Vercel 一键部署 |
| UI Library | shadcn/ui + Tailwind CSS | Radix Primitives + Tailwind，维护成本低，可定制 |
| 可视化 | Recharts | 轻量，React 原生，Tremor 备选 |
| 状态管理 | Zustand | 轻量，比 Redux 简单太多 |
| 数据获取 | TanStack Query (React Query) | 缓存 + 后台刷新 + 分页开箱即用 |
| 表单 | React Hook Form + Zod | 类型安全表单验证 |
| 地图/图 | @xyflow/react (原 React Flow) | Agent 协作可视化（如有需要） |

#### **后端层**

| 组件 | 技术选型 | 选型理由 |
|------|----------|----------|
| API Server | Node.js + Express 5 | 成熟，Middleware 生态，TypeScript 原生 |
| 备选 API | FastAPI (Python) | 如需 ML 推理优先，考虑 FastAPI |
| WebSocket | Socket.io | Room + Fallback，成熟库 |
| gRPC | @grpc/grpc-js | 微服务间通信，性能敏感场景 |
| 任务队列 | BullMQ (Redis-backed) | 重试 + 延迟队列，基于 Redis |
| 定时任务 | node-cron | 轻量，避免引入独立调度器 |

#### **Gateway 层（核心）**

| 组件 | 技术选型 | 选型理由 |
|------|----------|----------|
| HTTP Proxy | Express + http-proxy-middleware | 简单够用，Middleware 灵活 |
| LLM Provider SDK | OpenAI SDK (统一封装) | 支持多 Provider，Adapter Pattern |
| Session 追踪 | `continuation-local-storage` / AsyncLocalStorage | Node.js 18+ 内置，无第三方依赖 |
| 连接池 | axios 或 undici | 高并发时保持连接复用 |

#### **数据库层**

| 组件 | 技术选型 | 选型理由 |
|------|----------|----------|
| 主数据库 | PostgreSQL 16 | 关系数据，ACID，成熟生态 |
| 时序扩展 | TimescaleDB (PostgreSQL extension) | 自动分区 + 压缩，SQL 兼容 |
| 缓存 | Redis 7 | LLM 调用缓冲，Session 缓存 |
| 对象存储 | Cloudflare R2 / AWS S3 | 原始日志归档，便宜 |
| OLAP | ClickHouse | 大数据量 OLAP 查询，分析场景 |
| 搜索 | Meilisearch | 轻量全文搜索，< 100ms |

**为什么不选 NoSQL？**
- Translation Gap 需要精确的 Token 计数，关系模型更合适
- User/Workspace/Subscription 天然关系型
- TimescaleDB 让时序数据用 SQL 查询，零学习成本

#### **ML 层**

| 组件 | 技术选型 | 选型理由 |
|------|----------|----------|
| ML Runtime | Python 3.12 + uv | 性能优先，uv 替代 pip |
| 异常检测 | sklearn (Isolation Forest) | 轻量，无监督，够用 |
| LLM 分析 | GPT-4o mini | Prompt 优化建议，API 调用 |
| 向量搜索 | pgvector (PostgreSQL extension) | Prompt 相似度检索 |

#### **DevOps / 部署**

| 组件 | 技术选型 | 选型理由 |
|------|----------|----------|
| Container | Docker + Docker Compose | 开发/测试一致，Prod 用 Kubernetes |
| 容器编排 | AWS EKS / GCP GKE | 托管 K8s，减少运维 |
| CI/CD | GitHub Actions | GitHub 原生，免费额度够用 |
| 监控 | Prometheus + Grafana | 可观测性事实标准 |
| 日志 | Loki + Grafana | 与 Prometheus 同源，存储成本低 |
| 告警 | PagerDuty / Grafana Alerting | 按需选择 |
| CDN | Cloudflare | WAF + CDN + Workers（边缘计算） |
| 数据库托管 | AWS RDS / Neon | 托管 PostgreSQL，省运维 |
| 域名 | Cloudflare Registrar | DNS + CDN + 安全一站 |

---

## 4. DevOps / 部署架构

### 4.1 环境划分

```
┌─────────────────────────────────────────────────────────────┐
│                      LOCAL DEV                              │
│  Docker Compose (Postgres + Redis + Gateway + API)         │
│  用途：开发调试                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      STAGING                                 │
│  • 独立域名：staging.agentoscope.dev                        │
│  • 真实 Provider API（测试 Key）                            │
│  • 自动部署：main → staging (PR merge 后)                   │
│  • 数据：匿名测试数据                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PRODUCTION                              │
│  • 独立域名：app.agentoscope.dev / agentoscope.dev          │
│  • 多区域：us-east-1（主）+ eu-west-1                       │
│  • Manual promotion：staging → main                        │
│  • 真实用户数据                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Kubernetes 部署架构（Production）

```yaml
# k8s/ 目录结构
k8s/
├── base/
│   ├── namespace.yaml
│   ├── configmap.yaml
│   └── secrets.yaml (KMS 管理)
├── services/
│   ├── gateway/
│   │   ├── deployment.yaml
│   │   └── hpa.yaml (自动扩缩容)
│   ├── api/
│   │   ├── deployment.yaml
│   │   └── hpa.yaml
│   ├── worker/
│   │   ├── deployment.yaml
│   │   └── hpa.yaml
│   └── dashboard/
│       ├── deployment.yaml
│       └── service.yaml
├── ingress/
│   ├── cloudflare-ingress.yaml
│   └── api-ingress.yaml
└── monitoring/
    ├── prometheus.yaml
    └── grafana.yaml
```

### 4.3 自动扩缩容策略

```
Gateway / API 服务：
  ┌────────────────────────────────────────────────────┐
  │  HPA (Horizontal Pod Autoscaler)                   │
  │  • Min Replicas: 2                                 │
  │  • Max Replicas: 20                                │
  │  • 触发条件：CPU > 70% 或 Memory > 80%              │
  │  • 扩缩容速度：每 3 分钟最多 ±3 pods               │
  └────────────────────────────────────────────────────┘

Worker 服务（后台任务）：
  ┌────────────────────────────────────────────────────┐
  │  KEDA (Kubernetes Event-driven Autoscaling)        │
  │  • 基于 Redis Queue 长度                            │
  │  • Queue > 100 → 扩容                               │
  │  • Queue < 10 → 缩容                               │
  └────────────────────────────────────────────────────┘

Dashboard 前端：
  ┌────────────────────────────────────────────────────┐
  │  Vercel（静态 + SSR）                               │
  │  • 自动扩缩容，零配置                               │
  │  • Edge Network 全球分发                            │
  └────────────────────────────────────────────────────┘
```

### 4.4 监控与告警

```
┌──────────────────────────────────────────────────────────┐
│                    可观测性架构                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Metrics ──► Prometheus ──► Grafana Dashboard           │
│                                                           │
│  Logs ─────► Loki ─────────► Grafana Explore            │
│                                                           │
│  Traces ───► Tempo ─────────► Grafana (Jaeger 兼容)      │
│                                                           │
│  ─────────────────────────────────────────────────────  │
│                                                           │
│  关键告警：                                               │
│  1. API P99 延迟 > 500ms → Slack + PagerDuty             │
│  2. Error Rate > 1% → Slack                              │
│  3. Gateway CPU > 80% → 自动扩容                        │
│  4. Budget Guardrail 触发 > 10次/分钟 → Slack            │
│  5. DB 连接 > 80% → PagerDuty                            │
│  6. Stripe Webhook 失败 > 3次 → PagerDuty               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 4.5 灾备与数据策略

```
每日备份：
  • PostgreSQL → S3/R2 (pg_dump, 保留 30 天)
  • Redis → AOF 持久化

跨区域复制：
  • PostgreSQL → Read Replica (us-east-1 → eu-west-1)
  • R2 跨区域复制（CRR）

RTO / RPO：
  • RTO: 15 分钟（DNS 切换）
  • RPO: 1 小时（每日备份）

数据保留：
  • Free: 7 天（自动清理）
  • Pro: 90 天
  • Enterprise: 1 年+
```

### 4.6 安全策略

```
应用层：
  • HTTPS everywhere (Cloudflare SSL)
  • API Key 认证（256-bit random token）
  • CORS 白名单
  • Rate Limiting (每 IP/Key)

基础设施层：
  • VPC + Security Groups
  • Secrets Manager (AWS Secrets Manager / GCP Secret Manager)
  • IAM Roles 最小权限
  • 云防火墙 WAF (Cloudflare + AWS WAF)

数据库层：
  • 静态加密 (AES-256)
  • 传输加密 (TLS 1.3)
  • 列级别加密（敏感字段：email, api_key）

合规：
  • GDPR 数据删除（用户可申请删除）
  • SOC 2 Type II（Enterprise 计划）
```

---

## 5. 开放 API 设计

### 5.1 API 概览

```
Base URL: https://api.agentoscope.dev/v1

认证方式：
  • API Key: Authorization: Bearer <api_key>
  • Public Key 用于 Webhook 验签

内容类型：application/json

通用响应格式：
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2026-03-22T01:30:00Z"
  }
}

错误格式：
{
  "success": false,
  "error": {
    "code": "BUDGET_EXCEEDED",
    "message": "Monthly token budget exceeded",
    "details": { "limit": 100000, "used": 100231 }
  }
}
```

### 5.2 核心 API 端点

#### **认证**

```
POST /v1/auth/register
  Request:  { email, password? }
  Response: { user, token }
  说明：Magic Link 登录，无密码

POST /v1/auth/login
  Request:  { email }
  Response: { message: "Check your email" }

GET  /v1/auth/verify?token=xxx
  Response: { user, token }

POST /v1/auth/logout
  Auth: Bearer <token>
  Response: { success: true }
```

#### **工作区管理**

```
GET    /v1/workspaces
  Auth: Bearer <token>
  Response: { workspaces: [...] }

POST   /v1/workspaces
  Auth: Bearer <token>
  Request:  { name, plan? }
  Response: { workspace }

GET    /v1/workspaces/:id
  Auth: Bearer <token>
  Response: { workspace }

PATCH  /v1/workspaces/:id
  Auth: Bearer <token>
  Request:  { name }
  Response: { workspace }

DELETE /v1/workspaces/:id
  Auth: Bearer <token>
  Response: { success: true }
```

#### **Agent 管理**

```
GET    /v1/workspaces/:wid/agents
  Auth: Bearer <token>
  Response: { agents: [...] }

POST   /v1/workspaces/:wid/agents
  Auth: Bearer <token>
  Request:  { name, config? }
  Response: { agent }

GET    /v1/workspaces/:wid/agents/:id
  Auth: Bearer <token>
  Response: { agent }

DELETE /v1/workspaces/:wid/agents/:id
  Auth: Bearer <token>
  Response: { success: true }
```

#### **Trace / LLM 调用查询**

```
GET    /v1/traces
  Auth: Bearer <token>
  Query: ?workspace_id=&agent_id=&start=&end=&limit=100
  Response: { traces: [...], next_cursor: "xxx" }

GET    /v1/traces/:id
  Auth: Bearer <token>
  Response: { trace, llm_calls: [...] }

POST   /v1/traces/:id/annotate
  Auth: Bearer <token>
  Request:  { label, notes? }
  Response: { annotation }
```

#### **Translation Gap 分析**

```
GET    /v1/analytics/tg
  Auth: Bearer <token>
  Query: ?workspace_id=&agent_id=&start=&end=&group_by=day|agent|provider
  Response: {
    tg_score: 0.73,
    trend: [...],
    breakdown: {
      by_agent: [...],
      by_provider: [...],
      by_prompt_type: [...]
    }
  }

GET    /v1/analytics/tg/trend
  Auth: Bearer <token>
  Query: ?workspace_id=&period=7d|30d|90d
  Response: { data: [{ date, tg, sample_size }] }
```

#### **Budget 管理**

```
GET    /v1/budget
  Auth: Bearer <token>
  Response: {
    monthly_limit: 100000,
    current_usage: 45231,
    resets_at: "2026-04-01T00:00:00Z"
  }

PATCH  /v1/budget
  Auth: Bearer <token>
  Request:  { monthly_limit }
  Response: { budget }

GET    /v1/budget/alerts
  Auth: Bearer <token>
  Response: { alerts: [...] }

POST   /v1/budget/guardrails
  Auth: Bearer <token>
  Request:  { agent_id, threshold, action: "block"|"warn" }
  Response: { guardrail }
```

#### **Benchmark（匿名聚合）**

```
GET    /v1/benchmark
  Auth: Bearer <token>
  Query: ?industry=&task_type=&model=
  Response: {
    benchmarks: [{
      industry: "saas",
      task_type: "code_generation",
      model: "gpt-4o",
      avg_tg: 0.68,
      p50_tg: 0.65,
      p95_tg: 0.82,
      sample_size: 15420
    }]
  }

POST   /v1/benchmark/submit
  Auth: Bearer <token>
  Request:  { workspace_id, tg_score, industry?, task_type? }
  Response: { success: true, contribution_id }
  说明：提交 TG 数据到匿名 Benchmark，仅聚合数据，无原始数据
```

#### **使用量 / 计费**

```
GET    /v1/usage
  Auth: Bearer <token>
  Query: ?period=2026-03
  Response: {
    tokens: { input: 450000, output: 230000 },
    agents: 12,
    api_calls: 3421,
    cost_estimate: { openai: 12.50, anthropic: 8.20, google: 3.10 },
    billing_period: "2026-03"
  }

GET    /v1/usage/breakdown
  Auth: Bearer <token>
  Query: ?period=2026-03&group_by=day|agent|provider
  Response: { breakdown: [...] }
```

#### **Webhooks**

```
POST /v1/webhooks
  Auth: Bearer <token>
  Request:  { url, events: ["budget.exceeded", "guardrail.triggered"] }
  Response: { webhook_id, secret }
  说明：Webhook 验签 secret，用于接收异步事件

DELETE /v1/webhooks/:id
  Auth: Bearer <token>
  Response: { success: true }

Webhook Payload 示例：
{
  "event": "budget.exceeded",
  "timestamp": "2026-03-22T01:30:00Z",
  "workspace_id": "ws_xxx",
  "data": {
    "monthly_limit": 100000,
    "current_usage": 100231,
    "agent_id": "ag_yyy"
  }
}
```

### 5.3 SDK 设计

#### **Python SDK (`agentoscope`)**

```python
# 安装
# pip install agentoscope

from agentoscope import Agentoscope
from agentoscope.gateway import Gateway

# 初始化
client = Agentoscope(api_key="sk_xxx")

# Gateway 模式（零侵入）
gateway = Gateway(port=8080)
gateway.start()  # 启动本地代理

# 配置环境变量（最简方式）
import os
os.environ["OPENAI_BASE_URL"] = "http://localhost:8080/llm-gateway"

# 然后正常使用 OpenAI SDK，无需改动业务代码
from openai import OpenAI
client = OpenAI()  # 自动走 Gateway

# 查询分析
tg = client.analytics.tg.get(workspace_id="ws_xxx", period="7d")
print(f"TG Score: {tg.tg_score}")

# Budget 管理
budget = client.budget.get()
print(f"Used: {budget.current_usage} / {budget.monthly_limit}")
```

#### **JS/TS SDK (`@agentoscope/sdk`)**

```typescript
// 安装
// npm install @agentoscope/sdk

import { Agentoscope, Gateway } from '@agentoscope/sdk';

// Gateway 模式
const gateway = new Gateway({ port: 8080 });
gateway.start();

// 配置为 OpenAI SDK 的 base URL
// OPENAI_BASE_URL=http://localhost:8080/llm-gateway

// 或直接使用 SDK
const client = new Agentoscope({ apiKey: 'sk_xxx' });

// 查询 TG
const tg = await client.analytics.tg.get({
  workspaceId: 'ws_xxx',
  period: '7d'
});
console.log(`TG Score: ${tg.tg_score}`);

// Budget 告警
client.budget.onExceed(({ usage, limit }) => {
  console.warn(`Budget exceeded: ${usage}/${limit}`);
});
```

### 5.4 API 速率限制

| Plan | 速率限制 |
|------|----------|
| Free | 60 req/min |
| Pro | 600 req/min |
| Enterprise | 6000 req/min + 独立配额 |

响应头：
```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 542
X-RateLimit-Reset: 1711068600
```

---

## 6. 里程碑总览

### 6.1 关键里程碑

```
Week 1  ✅ 项目骨架 + DB Schema
Week 2  ✅ LLM Gateway 跑通
Week 3  ✅ Translation Gap 引擎
Week 4  ✅ Budget Guardrails + Prompt 分析
Week 5  ✅ Dashboard Beta
Week 6  ✅ 认证 + 订阅 + Stripe
Week 7  ✅ SDK + Docker + E2E 测试
Week 8  🎉 Public Launch
```

### 6.2 Launch 指标目标

| 指标 | Week 8 目标 |
|------|-------------|
| 注册用户 | 50 |
| 接入团队 | 10 |
| 追踪 Agent 数 | 100 |
| 月处理 Token | 10M |
| Dashboard DAU | 20 |

### 6.3 技术债务清单（Launch 后处理）

1. **DB 索引优化**：traces 表在 `workspace_id + started_at` 上加复合索引
2. **Gateway 连接池**：从 axios 切换到 undici，提升 2x 吞吐
3. **Benchmark 聚合**：实现 ClickHouse 物化视图
4. **E2E 测试**：Playwright 覆盖率 > 80%
5. **文档**：补全所有 API 端点的 OpenAPI 3.0 Schema

---

## 附录

### A. 项目目录结构

```
agentoscope/
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── tsconfig.json
├── turbo.json                  # Monorepo 编排
│
├── apps/
│   ├── gateway/               # LLM 网关代理
│   │   ├── src/
│   │   │   ├── proxy.ts
│   │   │   ├── interceptors/
│   │   │   └── providers/
│   │   └── package.json
│   │
│   ├── api/                  # REST API
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── services/
│   │   └── package.json
│   │
│   ├── dashboard/            # Next.js 前端
│   │   ├── src/app/
│   │   ├── src/components/
│   │   └── package.json
│   │
│   └── worker/               # 后台任务
│       ├── src/
│       │   ├── queues/
│       │   └── jobs/
│       └── package.json
│
├── packages/
│   ├── sdk-python/           # Python SDK
│   │   ├── agentoscope/
│   │   └── pyproject.toml
│   │
│   ├── sdk-js/               # JS/TS SDK
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── shared/               # 共享类型/Types
│   │   └── src/
│   │
│   └── db/                   # 数据库 migrations
│       └── migrations/
│
├── infra/
│   ├── k8s/                  # Kubernetes 配置
│   ├── terraform/            # 基础设施代码
│   └── monitoring/           # Grafana dashboards
│
├── docs/                     # 文档站点
│
└── scripts/
    ├── setup-dev.sh
    └── seed-test-data.ts
```

### B. 关键技术风险

| 风险 | 影响 | 缓解方案 |
|------|------|----------|
| Gateway 延迟过高 | 用户 LLM 响应变慢 | 本地代理只做转发，异步写 DB |
| TG 计算精度不足 | 数据无参考价值 | V1 用启发式，V2 加 LLM 辅助判断 |
| Stripe 集成复杂度 | 订阅逻辑出错 | 使用 Stripe Billing，抽象化 |
| 多 Provider SDK 兼容 | 部分 Provider 不支持 | Adapter Pattern + 接口抽象 |
| 数据隐私合规 | GDPR 投诉 | 用户数据隔离 + 匿名化聚合 |

### C. 参考资料

- [LangSmith](https://docs.smith.langchain.com/) — 现有竞品参考
- [Helicone](https://www.helicone.com/) — OpenAI 代理日志
- [Langfuse](https://langfuse.com/) — 开源 LLM 可观测性
- [SWE-bench](https://www.swebench.com/) — 评测基准参考
- [TimescaleDB](https://www.timescale.com/) — 时序数据库
- [pgvector](https://github.com/pgvector/pgvector) — 向量搜索

---

*本文档由 YC Factory Engineering Architect Agent 生成*
*最后更新：2026-03-22*
