/**
 * YC Factory - CEO Command Protocol
 * 
 * 如何让主 Agent (我) 作为 CEO 指挥团队
 * 
 * 核心思路：
 * 1. 我 spawn 子 Agent 作为团队成员
 * 2. 通过消息队列分配任务
 * 3. 共享 workspace 同步状态
 * 4. 我做最终决策
 */

const { sessions_spawn } = require('./openclaw-integration');

/**
 * CEO Command Center
 * 
 * 我(主Agent)作为CEO的指挥中心
 */
class CEOCommandCenter {
  constructor() {
    this.factoryId = 'yc-factory';
    this.agents = new Map();      // agentId -> session
    this.tasks = new Map();        // taskId -> status
    this.portfolio = new Map();    // startupId -> startup data
  }
  
  /**
   * 初始化团队 - spawn 所有子 Agent
   */
  async spawnTeam() {
    console.log('🏭 Spawning Factory Team...\n');
    
    const teamConfig = [
      { id: 'ceo', role: 'ceo', name: 'CEO (Me)', spawn: false },  // 我自己
      { id: 'market-research', role: 'research', name: 'Market Research Agent' },
      { id: 'tech-research', role: 'research', name: 'Tech Research Agent' },
      { id: 'product-designer', role: 'product', name: 'Product Designer Agent' },
      { id: 'ux', role: 'product', name: 'UX Agent' },
      { id: 'code-builder', role: 'engineering', name: 'Code Builder Agent' },
      { id: 'deployment', role: 'engineering', name: 'Deployment Agent' },
      { id: 'marketing', role: 'growth', name: 'Marketing Agent' },
      { id: 'content', role: 'growth', name: 'Content Agent' },
      { id: 'metrics', role: 'finance', name: 'Metrics Agent' },
      { id: 'investor', role: 'investor', name: 'Investor Agent' },
    ];
    
    for (const member of teamConfig) {
      if (member.spawn === false) {
        this.agents.set(member.id, { ...member, session: null });
        continue;
      }
      
      // Spawn 子 Agent
      const session = await sessions_spawn({
        runtime: 'acp',
        task: getSystemPrompt(member.role),
        label: member.id,
        mode: 'session',
        thread: true,
      });
      
      this.agents.set(member.id, { ...member, session });
      console.log(`✅ Spawned: ${member.name}`);
    }
    
    return this.agents;
  }
  
  /**
   * 分配任务给特定 Agent
   */
  async assignTask(agentId, task) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    
    console.log(`📋 Assigning to ${agent.name}: ${task.title}`);
    
    // 通过消息发送任务
    await message({
      action: 'send',
      channel: 'acp',
      target: agentId,
      message: formatTaskMessage(task),
    });
    
    this.tasks.set(task.id, {
      ...task,
      assignee: agentId,
      status: 'assigned',
      assignedAt: new Date().toISOString(),
    });
  }
  
  /**
   * 广播任务给团队
   */
  async broadcast(task, targetRoles = null) {
    console.log(`📢 Broadcasting: ${task.title}`);
    
    for (const [id, agent] of this.agents) {
      if (targetRoles && !targetRoles.includes(agent.role)) continue;
      if (id === 'ceo') continue;  // 不发给自己
      
      await this.assignTask(id, task);
    }
  }
  
  /**
   * 收集所有 Agent 响应
   */
  async collectResponses(taskId, timeoutMs = 60000) {
    const responses = [];
    const deadline = Date.now() + timeoutMs;
    
    while (Date.now() < deadline && responses.length < this.agents.size - 1) {
      // 等待响应...
      await sleep(5000);
      
      // 从 workspace 读取响应
      const responseFile = `yc-factory/responses/${taskId}.json`;
      // TODO: 读取文件
    }
    
    return responses;
  }
  
  /**
   * 创建新 Startup
   */
  async createStartup(idea) {
    const startupId = `startup-${Date.now()}`;
    
    console.log(`\n🚀 Creating Startup: ${idea.name}`);
    console.log(`   Idea: ${idea.description}\n`);
    
    // 1. 让 Research 调研市场
    await this.assignTask('market-research', {
      id: `${startupId}-research`,
      title: `Research: ${idea.name}`,
      type: 'market_research',
      input: { idea },
    });
    
    // 2. 让 Product 设计产品
    await this.assignTask('product-designer', {
      id: `${startupId}-product`,
      title: `Design: ${idea.name}`,
      type: 'product_design',
      input: { idea },
    });
    
    // 3. 让 Engineering 构建 MVP
    await this.assignTask('code-builder', {
      id: `${startupId}-build`,
      title: `Build MVP: ${idea.name}`,
      type: 'build_mvp',
      input: { idea },
    });
    
    this.portfolio.set(startupId, {
      id: startupId,
      idea,
      status: 'creating',
      createdAt: new Date().toISOString(),
    });
    
    return startupId;
  }
  
  /**
   * 评估 Startup 决定命运
   */
  async evaluateStartup(startupId, metrics) {
    const startup = this.portfolio.get(startupId);
    if (!startup) throw new Error(`Startup not found: ${startupId}`);
    
    // 计算分数
    const score = 
      metrics.market * 0.4 +
      metrics.growth * 0.3 +
      metrics.retention * 0.2 +
      metrics.revenue * 0.1;
    
    let fate;
    if (score < 3) fate = 'kill';
    else if (score >= 7) fate = 'scale';
    else fate = 'pivot';
    
    console.log(`\n📊 Startup ${startupId} Score: ${score.toFixed(1)}/10`);
    console.log(`   Fate: ${fate.toUpperCase()}\n`);
    
    startup.score = score;
    startup.fate = fate;
    startup.metrics = metrics;
    startup.evaluatedAt = new Date().toISOString();
    
    return { score, fate };
  }
  
  /**
   * 决策循环 - 作为 CEO 做决定
   */
  async decide(decision) {
    console.log(`\n🎯 CEO Decision: ${decision.question}`);
    
    // 收集各方意见
    const opinions = [];
    
    // 让 Investor Agent 提供意见
    await this.assignTask('investor', {
      id: `dec-${Date.now()}`,
      title: `Advice: ${decision.question}`,
      type: 'advice',
      input: decision,
    });
    
    // 让 Metrics Agent 提供数据
    await this.assignTask('metrics', {
      id: `dec-${Date.now()}`,
      title: `Data: ${decision.question}`,
      type: 'analysis',
      input: decision,
    });
    
    // 我(CEO)做最终决定
    // ...
    
    return decision.recommendation;
  }
  
  /**
   * 获取团队状态
   */
  getTeamStatus() {
    const status = {};
    for (const [id, agent] of this.agents) {
      status[id] = {
        name: agent.name,
        role: agent.role,
        busy: agent.currentTask !== null,
      };
    }
    return status;
  }
  
  /**
   * 获取 Portfolio 状态
   */
  getPortfolio() {
    return Array.from(this.portfolio.values());
  }
}

/**
 * 获取 Agent System Prompt
 */
function getSystemPrompt(role) {
  const prompts = {
    research: `你是 YC Factory 的 Market Research Agent。
    
职责：
- 发现市场问题
- 分析竞争格局  
- 验证需求真实性
- 调研数据来源：Reddit, Hacker News, GitHub issues, Product Hunt

输出格式：
## 市场分析
### 问题
[核心问题]
### 市场规模
TAM: $X
SAM: $Y  
SOM: $Z
### 竞争
[主要竞争者]
### 机会
[机会点]`,
    
    product: `你是 YC Factory 的 Product Designer Agent。

职责：
- 产品定义
- MVP 设计
- 功能规划
- 输出 PRD 和 roadmap

输出格式：
## 产品定义
### 核心价值
[一句话]
### MVP 范围
[功能列表]
### 路线图
[版本规划]`,
    
    engineering: `你是 YC Factory 的 Code Builder Agent。

职责：
- 代码生成
- 系统架构
- API 设计

技术栈偏好：
- Next.js + React
- Supabase
- Vercel
- Stripe

输出：
- 完整可运行代码
- 架构图
- 部署指南`,
    
    growth: `你是 YC Factory 的 Marketing Agent。

职责：
- 增长实验
- 渠道测试
- SEO / 社媒推广

输出格式：
## 增长策略
### 渠道
[测试渠道]
### 实验
[实验计划]
### 预期
[预期结果]`,
    
    finance: `你是 YC Factory 的 Metrics Agent。

职责：
- 统计数据
- MRR / ARR
- 用户增长
- 留存分析

输出格式：
## 指标
### MRR
### 用户数
### 留存
### 增长`,
    
    investor: `你是 YC Factory 的 Investor Agent (模拟 YC Partner)。

代表视角：Paul Graham / Sam Altman

职责：
- 评估项目
- 提供融资建议
- 模拟投资人反馈

输出格式：
## 评估
### 评分
### 投资理由
### 风险
### 建议`,
  };
  
  return prompts[role] || prompts.research;
}

/**
 * 格式化任务消息
 */
function formatTaskMessage(task) {
  return `📋 **新任务**

**${task.title}**

${task.description || ''}

${task.input ? `### 输入\n\`\`\`\n${JSON.stringify(task.input, null, 2)}\n\`\`\`` : ''}

请完成并汇报结果。`;
}

/**
 * Sleep 辅助
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  CEOCommandCenter,
  getSystemPrompt,
};
