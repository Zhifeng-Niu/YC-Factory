/**
 * YC Factory - Factory Orchestrator
 * 
 * 核心协调器：管理整个 Factory 运行
 */

const { v4: uuidv4 } = require('uuid');
const { FactoryState, StateSync } = require('../protocol/state-sync');
const { TaskFlow, TaskType, StartupPhase } = require('../protocol/task-flow');
const { MessageQueue, AgentRole } = require('../protocol/message-format');

/**
 * Factory 状态
 */
const FactoryStatus = {
  INITIALIZING: 'initializing',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPED: 'stopped',
};

/**
 * YC Factory 主类
 */
class YCFactory {
  constructor(config = {}) {
    this.id = config.id || uuidv4();
    this.name = config.name || 'YC Factory';
    this.status = FactoryStatus.INITIALIZING;
    
    // 核心组件
    this.state = new FactoryState();
    this.stateSync = new StateSync(this.state);
    this.taskFlow = new TaskFlow();
    this.messageQueue = new MessageQueue();
    
    // Agent 注册表
    this.agents = new Map();
    
    // 配置
    this.config = {
      maxBatches: config.maxBatches || 10,
      maxStartupsPerBatch: config.maxStartupsPerBatch || 10,
      autoKillThreshold: config.autoKillThreshold || 3.0,
      autoScaleThreshold: config.autoScaleThreshold || 8.0,
      ...config,
    };
    
    // 回调
    this.callbacks = {
      onTaskComplete: [],
      onStartupUpdate: [],
      onDecisionNeeded: [],
    };
  }
  
  /**
   * 初始化 Factory
   */
  async initialize() {
    console.log(`🏭 Initializing ${this.name}...`);
    
    // 注册系统 Agent
    await this.registerSystemAgents();
    
    // 创建第一个 Batch
    await this.createBatch('01');
    
    this.status = FactoryStatus.RUNNING;
    console.log(`✅ ${this.name} is running!`);
    
    return this;
  }
  
  /**
   * 注册系统 Agent
   */
  async registerSystemAgents() {
    const systemAgents = [
      { id: 'ceo', role: AgentRole.CEO, name: 'CEO Agent', level: 'strategic' },
      { id: 'partner-1', role: AgentRole.PARTNER, name: 'Partner Agent 1', level: 'strategic' },
      { id: 'partner-2', role: AgentRole.PARTNER, name: 'Partner Agent 2', level: 'strategic' },
      { id: 'strategy', role: AgentRole.STRATEGY, name: 'Strategy Agent', level: 'strategic' },
      { id: 'orchestrator', role: AgentRole.ORCHESTRATOR, name: 'Orchestrator', level: 'infrastructure' },
    ];
    
    for (const agent of systemAgents) {
      this.registerAgent(agent);
    }
    
    console.log(`✅ Registered ${systemAgents.length} system agents`);
  }
  
  /**
   * 注册 Agent
   */
  registerAgent(agent) {
    this.agents.set(agent.id, {
      ...agent,
      status: 'idle',
      currentTask: null,
      registeredAt: new Date().toISOString(),
    });
    
    this.state.registerAgent(agent);
    return agent;
  }
  
  /**
   * 创建 Batch
   */
  async createBatch(batchId) {
    const batch = {
      id: `batch-${batchId}`,
      name: `Batch ${batchId}`,
      status: 'active',
      startups: [],
    };
    
    this.state.createBatch(batch);
    console.log(`📦 Created ${batch.name}`);
    
    return batch;
  }
  
  /**
   * 评估创业想法
   */
  async evaluateIdea(idea) {
    const opportunity = {
      id: uuidv4(),
      idea,
      status: 'evaluating',
      submittedAt: new Date().toISOString(),
    };
    
    this.state.opportunities.push(opportunity);
    
    // TODO: 调用 Partner Agent 评估
    
    return opportunity;
  }
  
  /**
   * 创建 Startup
   */
  async createStartup(config) {
    const {
      idea,
      batchId = 'batch-01',
      team = [],
    } = config;
    
    const startupId = `startup-${uuidv4().slice(0, 8)}`;
    
    const startup = {
      id: startupId,
      name: idea.name || startupId,
      idea: idea.description,
      batchId,
      phase: StartupPhase.IDEA,
      team: [],
      createdAt: new Date().toISOString(),
    };
    
    // 创建 Startup 状态
    this.state.createStartup(startup);
    
    // 注册团队 Agent
    for (const role of team) {
      const agentId = `${startupId}-${role}`;
      this.registerAgent({
        id: agentId,
        role,
        name: `${role} Agent`,
        startupId,
        level: 'execution',
      });
    }
    
    // 创建任务流
    this.taskFlow.createStartupWorkflow(startupId, batchId);
    
    console.log(`🚀 Created startup ${startupId}: ${startup.name}`);
    
    return startup;
  }
  
  /**
   * 评估 Startup
   */
  async scoreStartup(startupId, scores) {
    const startup = this.state.scoreStartup(startupId, scores);
    
    console.log(`📊 Startup ${startupId} scored: ${startup.score?.toFixed(1)}/10 (${startup.fate})`);
    
    return startup;
  }
  
  /**
   * 运行任务
   */
  async runTask(taskId) {
    const task = this.taskFlow.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    
    // 分配给 Agent
    const agentId = task.assignee || this.findBestAgent(task.type);
    task.assign(agentId);
    task.start();
    
    console.log(`▶️ Task ${taskId} assigned to ${agentId}`);
    
    // TODO: 实际执行任务
    
    return task;
  }
  
  /**
   * 找到最佳 Agent
   */
  findBestAgent(taskType) {
    // 简单的任务类型到 Agent 角色映射
    const mapping = {
      [TaskType.RESEARCH_MARKET]: AgentRole.RESEARCH,
      [TaskType.RESEARCH_USERS]: AgentRole.RESEARCH,
      [TaskType.COMPETITIVE_ANALYSIS]: AgentRole.RESEARCH,
      [TaskType.CREATE_PRD]: AgentRole.PRODUCT,
      [TaskType.DESIGN_FEATURES]: AgentRole.PRODUCT,
      [TaskType.BUILD_MVP]: AgentRole.ENGINEERING,
      [TaskType.WRITE_CODE]: AgentRole.ENGINEERING,
      [TaskType.ACQUIRE_USERS]: AgentRole.GROWTH,
      [TaskType.ANALYZE_METRICS]: AgentRole.ANALYST,
    };
    
    const role = mapping[taskType];
    if (!role) return 'orchestrator';
    
    // 找到空闲的对应角色 Agent
    for (const [id, agent] of this.agents) {
      if (agent.role === role && agent.status === 'idle') {
        return id;
      }
    }
    
    return 'orchestrator';
  }
  
  /**
   * 获取状态快照
   */
  snapshot() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      batches: this.state.batches.size,
      startups: this.state.startups.size,
      agents: this.agents.size,
      opportunities: this.state.opportunities.length,
      version: this.state.version,
    };
  }
  
  /**
   * 导出完整状态
   */
  toJSON() {
    return {
      factory: this.snapshot(),
      state: this.state.toJSON(),
      tasks: Array.from(this.taskFlow.tasks.values()).map(t => t.toJSON()),
    };
  }
}

module.exports = {
  FactoryStatus,
  YCFactory,
};
