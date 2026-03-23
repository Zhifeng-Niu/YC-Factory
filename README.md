# YC-Factory 🔥

> **AI Startup Factory Operating System** — Build startups with an AI agent team

YC-Factory 是一个**多 Agent 协作的创业操作系统**。它把 YC 的创业方法论变成了一组可以让 AI Agent 团队执行的 protocol、task flow 和 agent 角色定义。

**谁在用：** OpenClaw、Claude Code (CC)、Multi-Agent 开发团队

---

## 核心问题

> 一个人创业太慢？一个 Agent 不够用？

YC-Factory 的答案是：**组建一支 AI Agent 战队**。

```
CEO Agent      → 决策方向
Partner Agent → 评估机会
Founder Agent → 带队执行
Engineer      → 写代码
Growth Agent  → 做增长
```

每个 Agent 各司其职，通过标准协议通信，YC 方法论自动运转。

---

## 支持的框架 / Supported Frameworks

### OpenClaw 🤖

OpenClaw 是你的**本地 Agent 运行环境**，YC-Factory 的所有 agents 都可以直接跑在上面。

```bash
# 在 OpenClaw workspace 里
cd yc-factory
node scripts/init-factory.js
```

OpenClaw 的 runtime-orchestrator 会自动编排多 Agent 协作，YC-Factory 提供 protocol 层和 agent 定义。

---

### Claude Code (CC) 🔥

Claude Code 的 **agent teams** 模式天然适合 YC-Factory。

```bash
# 在 Claude Code 里
cd yc-factory
node scripts/create-startup.js --batch 01 --idea "你的创业想法"
```

CC 的 subagent 协作模式让你可以同时调度多个 agent：
- CEO agent 做决策
- Engineer agent 写代码
- Growth agent 做增长

**参考：** `agents/index.js` 里的 `createTeam()` 函数

---

### 其他 Multi-Agent 框架

YC-Factory 的 protocol 是**框架无关的**：

| Protocol 文件 | 作用 |
|--------------|------|
| `protocol/message-format.js` | Agent 间消息格式 |
| `protocol/state-sync.js` | 共享状态同步 |
| `protocol/task-flow.js` | 任务流转定义 |
| `protocol/CEO_COMMAND.md` | CEO 命令协议 |

只要实现这些接口，任何多 Agent 框架都可以接入 YC-Factory。

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
└─────────────────────────────────────────────────────────────┘
```

---

## 快速开始

```bash
# 初始化 Factory
cd yc-factory
node scripts/init-factory.js

# 评估一个创业想法
node scripts/evaluate-idea.js "AI-powered personal finance"

# 创建 Startup
node scripts/create-startup.js --batch 01 --idea "..."
```

---

## Agent 角色

| Layer | Agent | 职责 |
|-------|-------|------|
| Strategic | CEO Agent | 最终决策、批量选择 |
| Strategic | Partner Agent | 方向判断、机会评估 |
| Strategic | Strategy Agent | 战略规划 |
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

> 低分 → shutdown | 高分 → scale

---

## 目录结构

```
yc-factory/
├── README.md                    # 本文件
├── protocol/                    # Agent 通信协议
│   ├── message-format.js       # 消息格式
│   ├── state-sync.js           # 状态同步
│   ├── task-flow.js            # 任务流转
│   └── CEO_COMMAND.md          # CEO 命令协议
├── agents/                      # Agent 定义
│   ├── strategic/              # 战略层
│   ├── program/                # 孵化层
│   └── execution/              # 执行层
├── startups/                    # Startup 实例
└── scripts/                     # 运行脚本
```

---

## Philosophy

YC 用 20 年证明了：
> **The best way to have a good idea is to have lots of ideas and throw away the bad ones.**

YC-Factory 把这个过程自动化了——让 AI Agent 战队来做这件事。

---

**Build fast. Fail fast. Learn faster.** 🚀
