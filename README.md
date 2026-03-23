# YC Factory - AI Startup Factory Operating System

> 把 Y Combinator 的创业流水线变成 AI Agent Team

## 架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                   Strategic Layer                          │
│         (CEO / Partner / Strategy Agents)                  │
├─────────────────────────────────────────────────────────────┤
│                   Program Layer                             │
│              (Startup Batches & Teams)                      │
├─────────────────────────────────────────────────────────────┤
│                   Execution Layer                            │
│        (Research / Product / Engineering / Growth)         │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│         (Protocol / Memory / Orchestration)                │
├─────────────────────────────────────────────────────────────┤
│                   Environment Layer                         │
│           (Internet / APIs / Tools)                         │
└─────────────────────────────────────────────────────────────┘
```

## 核心循环

```
Opportunity Discovery → Startup Creation → MVP Build → Launch
                                                        ↓
                                              Metrics / Feedback
                                                        ↓
                                            Pivot / Scale / Kill
```

## 快速开始

```bash
# 初始化 Factory
cd yc-factory
node scripts/init-factory.js

# 启动一个创业想法评估
node scripts/evaluate-idea.js "AI-powered personal finance"

# 创建一个 Startup
node scripts/create-startup.js --batch 01 --idea "..."
```

## 目录结构

```
yc-factory/
├── README.md                    # 本文件
├── protocol/                    # Agent 通信协议
│   ├── message-format.js       # 消息格式定义
│   ├── state-sync.js           # 状态同步
│   └── task-flow.js            # 任务流转
├── agents/                      # Agent 定义
│   ├── strategic/              # 战略层 Agent
│   ├── program/                # 孵化层 Agent
│   ├── execution/              # 执行层 Agent
│   └── infrastructure/         # 基础设施 Agent
├── startups/                    # Startup 实例
├── scripts/                     # 运行脚本
└── config/                      # 配置文件
```

## 核心概念

### Agent Roles

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
| Execution | Analyst Agent | 数据分析 |

### Startup Lifecycle

```
idea → approval → mvp → launch → metrics → (pivot|scale|kill)
```

### Selection Engine

评分维度：
- market_size (市场规模)
- growth_rate (增长率)  
- retention (留存)
- revenue (收入)
- user_feedback (用户反馈)

低分项目 → shutdown
高分项目 → scale
