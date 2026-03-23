# CEO Command Protocol

## 核心思路

```
我 (CEO/主Agent)
    │
    ├── sessions_spawn() → 创建子Agent团队
    ├── message() → 分配任务
    ├── workspace共享 → 状态同步
    └── 做最终决策
```

## 具体用法

### 1. 初始化团队

```javascript
// Spawn 所有子Agent
const marketResearch = await sessions_spawn({
  runtime: 'acp',
  task: marketResearchPrompt,
  label: 'market-research',
  thread: true,
});

const productDesigner = await sessions_spawn({
  runtime: 'acp', 
  task: productDesignerPrompt,
  label: 'product-designer',
  thread: true,
});

// ... 其他角色
```

### 2. 分配任务

```javascript
// 直接发消息给特定Agent
await message({
  action: 'send',
  target: 'market-research',
  message: `
📋 任务：调研 AI 个人理财市场

输出：
- 市场规模 (TAM/SAM/SOM)
- 核心问题
- 竞争格局
- 机会点
  `
});
```

### 3. 收集结果

```javascript
// Agent 通过回复汇报结果
// 我(CEO)汇总各方信息做决策
```

### 4. 做决策

```javascript
// 评估所有输入，决定方向
const decision = await makeDecision({
  options: ['approve', 'reject', 'pivot'],
  inputs: [marketData, productData, techData]
});
```

## 指挥流程示例

```
我(CEO) 
  │
  ├─→ "Market Research, 调研 X 市场"
  │      │
  │      └─→ 汇报市场规模、竞争、机会
  │
  ├─→ "Product Designer, 设计 Y 产品"
  │      │
  │      └─→ 汇报 PRD、路线图
  │
  ├─→ "Engineering, 构建 MVP"
  │      │
  │      └─→ 汇报代码、架构
  │
  └─→ 我做最终决定：Approve/Reject/Pivot/Scale
```

## Workspace 共享

```
workspace/yc-factory/
├── portfolio.yaml      # 所有 startup 状态
├── tasks/             # 任务队列
│   ├── pending.json
│   ├── in-progress.json
│   └── completed.json
├── startups/
│   ├── startup-001/
│   │   ├── idea.md
│   │   ├── metrics.json
│   │   └── decisions/
│   └── startup-002/
└── agents/
    └── status.yaml    # 各Agent状态
```

## 关键命令

| 命令 | 作用 |
|------|------|
| `spawnTeam()` | 初始化所有子Agent |
| `assign(agentId, task)` | 分配任务 |
| `broadcast(task)` | 广播任务 |
| `collect()` | 收集响应 |
| `decide()` | CEO做决策 |
| `evaluate(startup)` | 评估 startup |
| `kill/startup)` | 关闭失败项目 |
| `scale(startup)` | 扩张成功项目 |

## 作为CEO，我可以直接说

```
"Market Research Agent，去调研 AI 代码助手市场"

"Product Designer，基于这个调研设计 MVP"

"Engineering Team，开始写代码"

"Marketing，准备 launch 计划"

（我）"这个项目评分 7.5，Scale！"
```

**本质：我作为中枢大脑，通过消息驱动子Agent工作，共享workspace同步状态。**
