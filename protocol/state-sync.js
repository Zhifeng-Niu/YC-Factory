/**
 * YC Factory - State Synchronization
 * 
 * 分布式 Agent 状态同步
 */

const { EventEmitter } = require('events');

/**
 * 状态类型
 */
const StateType = {
  FACTORY: 'factory',
  BATCH: 'batch',
  STARTUP: 'startup',
  AGENT: 'agent',
  TASK: 'task',
};

/**
 * 状态变更类型
 */
const ChangeType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

/**
 * Factory 全局状态
 */
class FactoryState {
  constructor() {
    this.batches = new Map();      // batchId -> BatchState
    this.startups = new Map();     // startupId -> StartupState
    this.agents = new Map();       // agentId -> AgentState
    this.opportunities = [];       // 待评估的机会
    this.version = 0;
  }
  
  /**
   * 创建 Batch
   */
  createBatch(batch) {
    this.batches.set(batch.id, {
      ...batch,
      startups: [],
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    this.version++;
  }
  
  /**
   * 创建 Startup
   */
  createStartup(startup) {
    const state = {
      ...startup,
      status: 'incubating',
      score: null,
      metrics: {
        mvp_score: null,
        launch_score: null,
        growth_rate: null,
        retention: null,
        revenue: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.startups.set(startup.id, state);
    
    // 关联到 batch
    const batch = this.batches.get(startup.batchId);
    if (batch) {
      batch.startups.push(startup.id);
    }
    
    this.version++;
    return state;
  }
  
  /**
   * 更新 Startup 状态
   */
  updateStartup(startupId, updates) {
    const startup = this.startups.get(startupId);
    if (!startup) throw new Error(`Startup not found: ${startupId}`);
    
    Object.assign(startup, updates, {
      updatedAt: new Date().toISOString(),
    });
    
    this.version++;
    return startup;
  }
  
  /**
   * 评估 Startup
   */
  scoreStartup(startupId, scores) {
    const startup = this.startups.get(startupId);
    if (!startup) throw new Error(`Startup not found: ${startupId}`);
    
    startup.metrics = { ...startup.metrics, ...scores };
    
    // 计算总分 (加权平均)
    const weights = {
      market_size: 0.2,
      growth_rate: 0.25,
      retention: 0.2,
      revenue: 0.15,
      user_feedback: 0.2,
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (scores[key] !== undefined) {
        totalScore += scores[key] * weight;
        totalWeight += weight;
      }
    }
    
    startup.score = totalWeight > 0 ? totalScore / totalWeight : null;
    startup.updatedAt = new Date().toISOString();
    
    // 决定命运
    if (startup.score !== null) {
      if (startup.score < 3) {
        startup.status = 'killed';
        startup.fate = 'kill';
      } else if (startup.score >= 7) {
        startup.status = 'scaling';
        startup.fate = 'scale';
      } else {
        startup.status = 'pivoting';
        startup.fate = 'pivot';
      }
    }
    
    this.version++;
    return startup;
  }
  
  /**
   * 注册 Agent
   */
  registerAgent(agent) {
    this.agents.set(agent.id, {
      ...agent,
      status: 'idle',
      currentTask: null,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });
  }
  
  /**
   * 更新 Agent 状态
   */
  updateAgent(agentId, updates) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    
    Object.assign(agent, updates, {
      lastActiveAt: new Date().toISOString(),
    });
    
    return agent;
  }
  
  /**
   * 获取 Factory 快照
   */
  snapshot() {
    return {
      version: this.version,
      batches: Array.from(this.batches.values()),
      startups: Array.from(this.startups.values()),
      agents: Array.from(this.agents.values()),
      opportunities: this.opportunities,
      createdAt: new Date().toISOString(),
    };
  }
  
  /**
   * 导出 JSON
   */
  toJSON() {
    return this.snapshot();
  }
}

/**
 * 状态变更事件
 */
class StateSync extends EventEmitter {
  constructor(state) {
    super();
    this.state = state;
    this.listeners = new Map();
  }
  
  /**
   * 监听状态变更
   */
  watch(entityType, entityId, callback) {
    const key = `${entityType}:${entityId}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key).push(callback);
    
    // 返回取消监听函数
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    };
  }
  
  /**
   * 发布变更
   */
  publish(changeType, entityType, entityId, data) {
    const key = `${entityType}:${entityId}`;
    
    this.emit('change', { changeType, entityType, entityId, data });
    
    const callbacks = this.listeners.get(key) || [];
    for (const callback of callbacks) {
      callback({ changeType, entityType, entityId, data });
    }
  }
  
  /**
   * 同步到文件 (可选)
   */
  async persist(filepath) {
    const fs = require('fs').promises;
    await fs.writeFile(filepath, JSON.stringify(this.state.toJSON(), null, 2));
  }
  
  /**
   * 从文件恢复
   */
  async restore(filepath) {
    const fs = require('fs').promises;
    const data = JSON.parse(await fs.readFile(filepath, 'utf-8'));
    // 恢复状态...
  }
}

module.exports = {
  StateType,
  ChangeType,
  FactoryState,
  StateSync,
};
