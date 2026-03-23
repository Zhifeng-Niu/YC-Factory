# YC-Factory 🔥

> **AI Startup Factory Operating System** — Powered by Y Combinator's methodology

把 YC 的创业流水线变成一支 AI Agent 战队。让创业从"孤独的煎熬"变成"可复制的流水线"。

---

## 为什么做这个？

创业本质上是一个**信息处理系统**：
吸收噪声 → 找到信号 → 快速验证 → 迭代/放弃

YC 用 20 年把这一套方法论沉淀成了一套 ritual，我们想把它**自动化**。

---

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Strategic Layer                          │
│              CEO / Partner / Strategy Agents               │
├─────────────────────────────────────────────────────────────┤
│                     Program Layer                           │
│              Startup Batches & Founder Agents              │
├─────────────────────────────────────────────────────────────┤
│                    Execution Layer                          │
│         Research / Product / Engineering / Growth          │
├─────────────────────────────────────────────────────────────┤
│                  Infrastructure Layer                       │
│              Protocol / Memory / Orchestration              │
├─────────────────────────────────────────────────────────────┤
│                    Environment Layer                        │
│                   Internet / APIs / Tools                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 核心理念

> **Build → Measure → Learn** — 快速循环，永不停歇

```
Opportunity → MVP → Launch → Metrics → Pivot / Scale / Kill
```

**没有永恒的 plan，只有永恒的 feedback。**

---

## 快速开始

```bash
# 初始化
cd yc-factory
node scripts/init-factory.js

# 评估一个想法
node scripts/evaluate-idea.js "AI-powered personal finance"

# 创建 Startup
node scripts/create-startup.js --batch 01 --idea "..."
```

---

## 目录结构

```
yc-factory/
├── protocol/                    # Agent 通信协议
│   ├── message-format.js       # 消息格式
│   ├── state-sync.js           # 状态同步
│   └── task-flow.js            # 任务流转
├── agents/                     # Agent 定义
│   ├── strategic/              # 战略层
│   ├── program/                # 孵化层
│   └── execution/              # 执行层
├── startups/                   # Startup 实例
├── scripts/                    # 脚本
└── config/                     # 配置
```

---

## Agent 角色

| Layer | Agent | 职责 |
|-------|-------|------|
| Strategic | CEO Agent | 最终决策、批量选择 |
| Strategic | Partner Agent | 方向判断、机会评估 |
| Strategic | Strategy Agent | 战略规划 |
| Program | Batch Agent | 管理 batch |
| Program | Founder Agent | Startup CEO |
| Execution | Research Agent | 市场/用户调研 |
| Execution | Product Agent | 产品设计 |
| Execution | Engineering Agent | 开发实现 |
| Execution | Growth Agent | 增长黑客 |

---

## Startup 生命周期

```
idea → approval → mvp → launch → metrics → pivot / scale / kill
```

**Selection Engine 评分维度：**
- Market Size（市场规模）
- Growth Rate（增长率）
- Retention（留存）
- Revenue（收入）
- User Feedback（用户反馈）

> 低分 → shutdown \| 高分 → scale

---

## Philosophy

YC 用 20 年时间证明了：
> **The best way to have a good idea is to have lots of ideas and throw away the bad ones.**

YC-Factory 把这个过程自动化了。

---

**Build fast. Fail fast. Learn faster.** 🚀
