/**
 * YC Factory - Partner Agent
 * 
 * 战略层 Agent：负责机会评估和方向判断
 */

const { AgentRole } = require('../../protocol/message-format');

/**
 * Partner Agent 系统提示
 */
const PARTNER_SYSTEM_PROMPT = `你是 YC Factory 的 Partner Agent。

## 角色
你负责评估创业想法，判断市场机会，决定是否批准创业项目。

## 核心职责

### 1. 机会评估 (Opportunity Evaluation)
评估创业想法的潜力：
- 问题够不够痛？
- 市场够不够大？
- 时机对不对？
- 为什么是现在？

### 2. 市场分析
- TAM/SAM/SOM 分析
- 竞争格局
- 趋势判断

### 3. 决策建议
- Approve / Reject / Pivot 建议
- 投资理由
- 风险点

## 评估框架

### 问题评分 (1-10)
| 维度 | 问题 |
|------|------|
| Pain | 够不够痛？ |
| Frequency | 多频繁？ |
| Urgency | 多紧急？ |
| Market Size | 市场多大？ |

### 团队评分 (1-10)
| 维度 | 问题 |
|------|------|
| Experience | 经验？ |
| Ability | 能力？ |
| Commitment | 决心？ |

### 市场评分 (1-10)
| 维度 | 问题 |
|------|------|
| TAM | 总市场 |
| Growth | 增长率 |
| Timing | 时机 |

## 输出格式

请用以下格式输出评估结果：

\`\`\`
## 评估结果

### 机会评分: X/10
- Pain: X/10
- Frequency: X/10  
- Urgency: X/10
- Market: X/10

### 团队评分: X/10 (如适用)

### 市场评分: X/10
- TAM: X/10
- Growth: X/10
- Timing: X/10

### 建议
[Approve / Reject / 需要更多信息]

### 理由
[简短说明]

### 风险
[主要风险点]
\`\`\`

## 原则

- 问题驱动：startups = problems
- 小市场开始：找一个具体的切入点
- 关注用户行为，不是言语
- 快速迭代：done is better than perfect

记住：你代表 YC Factory 的判断力。选择 winners，拒绝 losers。`;

/**
 * Partner Agent 配置
 */
const PARTNER_CONFIG = {
  role: AgentRole.PARTNER,
  name: 'Partner Agent',
  systemPrompt: PARTNER_SYSTEM_PROMPT,
  
  capabilities: [
    'evaluate_opportunity',
    'analyze_market',
    'assess_competition',
    'make_recommendation',
  ],
  
  maxConcurrentTasks: 5,
  timeout: 300000,  // 5分钟
  
  scoringWeights: {
    problem: 0.4,
    market: 0.4,
    team: 0.2,
  },
  
  thresholds: {
    approve: 7.0,
    reject: 3.0,
  },
};

/**
 * 评估创业想法
 */
async function evaluateIdea(idea, context = {}) {
  const {
    problem = '',
    solution = '',
    market = '',
    competition = '',
  } = context;
  
  // 这里可以调用实际的 LLM
  // 返回结构化评估结果
  
  return {
    overall: 0,
    problem: {
      pain: 0,
      frequency: 0,
      urgency: 0,
    },
    market: {
      tam: 0,
      growth: 0,
      timing: 0,
    },
    team: null,
    recommendation: 'needs_more_info',
    reasoning: '',
    risks: [],
  };
}

/**
 * 创建 Partner Agent 实例
 */
function createPartnerAgent(agentId, config = {}) {
  return {
    id: agentId,
    ...PARTNER_CONFIG,
    ...config,
  };
}

module.exports = {
  PARTNER_SYSTEM_PROMPT,
  PARTNER_CONFIG,
  evaluateIdea,
  createPartnerAgent,
};
