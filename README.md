# YC-Factory 🔥

---

## 中文版

### 这是什么？

YC-Factory 是一个**多 Agent 协作的创业操作系统**。

它把 YC（Y Combinator）的创业方法论——选方向、跑 MVP、验证市场、快速迭代——变成了一套可以让 AI Agent 战队执行的 protocol、task flow 和 agent 角色定义。

**核心问题：** 一个人创业太慢？一个 Agent 不够用？

**答案：** 组建一支 AI Agent 战队，YC 方法论自动运转。

### 谁在用？

- **OpenClaw** — 本地 Agent 运行环境，直接跑 YC-Factory 的所有 agents
- **Claude Code (CC)** — agent teams 模式，多 subagent 并行调度
- **其他多 Agent 框架** — protocol 层框架无关，任何框架都可接入

### 核心架构

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

### Agent 战队

| Agent | 职责 |
|-------|------|
| CEO Agent | 最终决策、批量选择 |
| Partner Agent | 方向判断、机会评估 |
| Founder Agent | Startup CEO，带队执行 |
| Research Agent | 市场/用户调研 |
| Product Agent | 产品设计 |
| Engineering Agent | 开发实现 |
| Growth Agent | 增长黑客 |

### Startup 生命周期

```
idea → approval → mvp → launch → metrics → pivot / scale / kill
```

### 快速开始

```bash
# 初始化
cd yc-factory
node scripts/init-factory.js

# 评估创业想法
node scripts/evaluate-idea.js "AI-powered personal finance"

# 创建 Startup
node scripts/create-startup.js --batch 01 --idea "..."
```

### 目录结构

```
yc-factory/
├── protocol/                    # Agent 通信协议
│   ├── message-format.js       # 消息格式
│   ├── state-sync.js           # 状态同步
│   └── task-flow.js            # 任务流转
├── agents/                      # Agent 定义
│   ├── strategic/              # 战略层
│   ├── program/                # 孵化层
│   └── execution/              # 执行层
├── startups/                    # Startup 实例
└── scripts/                     # 脚本
```

### 设计哲学

YC 用 20 年证明了：

> **The best way to have a good idea is to have lots of ideas and throw away the bad ones.**

YC-Factory 把这个过程自动化了——让 AI Agent 战队来做这件事。

**Build fast. Fail fast. Learn faster.** 🚀

---

## English Version

---

### What is YC-Factory?

YC-Factory is an **AI Multi-Agent Startup Operating System**.

It takes Y Combinator's methodology — picking directions, running MVPs, validating markets, iterating fast — and turns it into a set of protocols, task flows, and agent role definitions that an AI agent team can execute.

**Core question:** Solo entrepreneurship too slow? One agent not enough?

**Answer:** Build an AI agent team. YC methodology runs on autopilot.

### Who's using it?

- **OpenClaw** — Local agent runtime, runs all YC-Factory agents natively
- **Claude Code (CC)** — agent teams mode, parallel subagent调度
- **Any multi-agent framework** — framework-agnostic protocol layer

### Architecture

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

### Agent Team

| Agent | Role |
|-------|------|
| CEO Agent | Final decisions, batch selection |
| Partner Agent | Direction judgment, opportunity assessment |
| Founder Agent | Startup CEO, leads execution |
| Research Agent | Market & user research |
| Product Agent | Product design |
| Engineering Agent | Development |
| Growth Agent | Growth hacking |

### Startup Lifecycle

```
idea → approval → mvp → launch → metrics → pivot / scale / kill
```

### Quick Start

```bash
# Initialize
cd yc-factory
node scripts/init-factory.js

# Evaluate an idea
node scripts/evaluate-idea.js "AI-powered personal finance"

# Create a Startup
node scripts/create-startup.js --batch 01 --idea "..."
```

### Directory Structure

```
yc-factory/
├── protocol/                    # Agent communication protocols
│   ├── message-format.js       # Message format
│   ├── state-sync.js           # State sync
│   └── task-flow.js            # Task flow
├── agents/                      # Agent definitions
│   ├── strategic/              # Strategic layer
│   ├── program/                # Program layer
│   └── execution/              # Execution layer
├── startups/                    # Startup instances
└── scripts/                     # Scripts
```

### Philosophy

YC spent 20 years proving:

> **The best way to have a good idea is to have lots of ideas and throw away the bad ones.**

YC-Factory automates this — letting an AI agent team do the work.

**Build fast. Fail fast. Learn faster.** 🚀
