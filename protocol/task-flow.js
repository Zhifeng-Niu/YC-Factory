/**
 * YC Factory - Task Flow
 * 
 * 任务流转和生命周期管理
 */

const { v4: uuidv4 } = require('uuid');

/**
 * 任务状态
 */
const TaskStatus = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

/**
 * 任务类型
 */
const TaskType = {
  // Strategic
  EVALUATE_OPPORTUNITY: 'evaluate_opportunity',
  APPROVE_STARTUP: 'approve_startup',
  DECIDE_PIVOT: 'decide_pivot',
  DECIDE_SCALE: 'decide_scale',
  DECIDE_KILL: 'decide_kill',
  
  // Program
  CREATE_STARTUP: 'create_startup',
  ASSIGN_TEAM: 'assign_team',
  
  // Execution
  RESEARCH_MARKET: 'research_market',
  RESEARCH_USERS: 'research_users',
  COMPETITIVE_ANALYSIS: 'competitive_analysis',
  
  DESIGN_PRODUCT: 'design_product',
  CREATE_PRD: 'create_prd',
  DESIGN_FEATURES: 'design_features',
  
  BUILD_MVP: 'build_mvp',
  WRITE_CODE: 'write_code',
  DEPLOY: 'deploy',
  
  GROWTH_EXPERIMENT: 'growth_experiment',
  ACQUIRE_USERS: 'acquire_users',
  OPTIMIZE_FUNNEL: 'optimize_funnel',
  
  ANALYZE_METRICS: 'Analyze_metrics',
  GENERATE_REPORT: 'generate_report',
};

/**
 * Startup 生命周期阶段
 */
const StartupPhase = {
  IDEA: 'idea',
  APPROVED: 'approved',
  MVP: 'mvp',
  LAUNCHED: 'launched',
  GROWTH: 'growth',
  PIVOT: 'pivot',
  SCALE: 'scale',
  KILLED: 'killed',
};

/**
 * 任务定义
 */
class Task {
  constructor(config) {
    this.id = config.id || uuidv4();
    this.type = config.type;
    this.title = config.title;
    this.description = config.description;
    
    // 分配
    this.assignee = config.assignee || null;  // agentId
    this.owner = config.owner;  // 创建者 agentId
    
    // 状态
    this.status = TaskStatus.PENDING;
    this.priority = config.priority || 2;
    
    // 上下文
    this.startupId = config.startupId || null;
    this.batchId = config.batchId || null;
    
    // 输入/输出
    this.input = config.input || {};
    this.output = config.output || null;
    
    // 依赖
    this.dependsOn = config.dependsOn || [];  // taskId[]
    this.blockedBy = [];  // 自动计算
    
    // 时间
    this.createdAt = config.createdAt || new Date().toISOString();
    this.startedAt = null;
    this.completedAt = null;
    this.deadline = config.deadline || null;
    
    // 进度
    this.progress = 0;  // 0-100
    this.logs = [];
  }
  
  /**
   * 分配任务
   */
  assign(agentId) {
    this.assignee = agentId;
    this.status = TaskStatus.ASSIGNED;
    this.logs.push({
      at: new Date().toISOString(),
      action: 'assigned',
      by: agentId,
    });
  }
  
  /**
   * 开始执行
   */
  start() {
    this.status = TaskStatus.IN_PROGRESS;
    this.startedAt = new Date().toISOString();
    this.logs.push({
      at: new Date().toISOString(),
      action: 'started',
    });
  }
  
  /**
   * 更新进度
   */
  updateProgress(progress, note = '') {
    this.progress = Math.min(100, Math.max(0, progress));
    if (note) {
      this.logs.push({
        at: new Date().toISOString(),
        action: 'progress',
        progress: this.progress,
        note,
      });
    }
  }
  
  /**
   * 完成
   */
  complete(output) {
    this.status = TaskStatus.COMPLETED;
    this.output = output;
    this.progress = 100;
    this.completedAt = new Date().toISOString();
    this.logs.push({
      at: new Date().toISOString(),
      action: 'completed',
      output,
    });
  }
  
  /**
   * 失败
   */
  fail(error) {
    this.status = TaskStatus.FAILED;
    this.completedAt = new Date().toISOString();
    this.logs.push({
      at: new Date().toISOString(),
      action: 'failed',
      error,
    });
  }
  
  /**
   * 阻塞
   */
  block(reason) {
    this.status = TaskStatus.BLOCKED;
    this.logs.push({
      at: new Date().toISOString(),
      action: 'blocked',
      reason,
    });
  }
  
  /**
   * 取消
   */
  cancel() {
    this.status = TaskStatus.CANCELLED;
    this.completedAt = new Date().toISOString();
    this.logs.push({
      at: new Date().toISOString(),
      action: 'cancelled',
    });
  }
  
  /**
   * 序列化
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      description: this.description,
      assignee: this.assignee,
      owner: this.owner,
      status: this.status,
      priority: this.priority,
      startupId: this.startupId,
      batchId: this.batchId,
      input: this.input,
      output: this.output,
      dependsOn: this.dependsOn,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      deadline: this.deadline,
      progress: this.progress,
      logs: this.logs,
    };
  }
}

/**
 * 任务流管理器
 */
class TaskFlow {
  constructor() {
    this.tasks = new Map();
    this.taskGraph = new Map();  // taskId -> dependsOn
  }
  
  /**
   * 创建任务
   */
  create(config) {
    const task = new Task(config);
    this.tasks.set(task.id, task);
    
    // 更新依赖图
    for (const depId of task.dependsOn) {
      if (!this.taskGraph.has(depId)) {
        this.taskGraph.set(depId, []);
      }
      this.taskGraph.get(depId).push(task.id);
    }
    
    return task;
  }
  
  /**
   * 获取任务
   */
  get(taskId) {
    return this.tasks.get(taskId);
  }
  
  /**
   * 获取可执行的任务 (依赖已满足)
   */
  getRunnableTasks(agentId = null) {
    const runnable = [];
    
    for (const [id, task] of this.tasks) {
      if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.ASSIGNED) {
        continue;
      }
      
      // 检查依赖是否完成
      const deps = task.dependsOn || [];
      const depsComplete = deps.every(depId => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === TaskStatus.COMPLETED;
      });
      
      if (!depsComplete) continue;
      
      // 检查是否指定了特定 agent
      if (agentId && task.assignee && task.assignee !== agentId) {
        continue;
      }
      
      runnable.push(task);
    }
    
    // 按优先级排序
    runnable.sort((a, b) => a.priority - b.priority);
    
    return runnable;
  }
  
  /**
   * 获取 Startup 的所有任务
   */
  getTasksForStartup(startupId) {
    return Array.from(this.tasks.values())
      .filter(t => t.startupId === startupId);
  }
  
  /**
   * 获取 Agent 的任务
   */
  getTasksForAgent(agentId) {
    return Array.from(this.tasks.values())
      .filter(t => t.assignee === agentId);
  }
  
  /**
   * 检查阻塞并更新
   */
  checkBlocking() {
    for (const [id, task] of this.tasks) {
      if (task.status !== TaskStatus.PENDING) continue;
      
      const blocked = task.dependsOn.some(depId => {
        const dep = this.tasks.get(depId);
        return dep && dep.status === TaskStatus.FAILED;
      });
      
      if (blocked) {
        task.block('Dependency failed');
      }
    }
  }
  
  /**
   * 创建标准 Startup 任务流
   */
  createStartupWorkflow(startupId, batchId) {
    const tasks = [];
    
    // Phase 1: Research
    tasks.push(this.create({
      type: TaskType.RESEARCH_MARKET,
      title: '市场调研',
      startupId, batchId,
      priority: 1,
    }));
    
    tasks.push(this.create({
      type: TaskType.RESEARCH_USERS,
      title: '用户调研',
      startupId, batchId,
      priority: 1,
      dependsOn: [tasks[0].id],
    }));
    
    tasks.push(this.create({
      type: TaskType.COMPETITIVE_ANALYSIS,
      title: '竞争分析',
      startupId, batchId,
      priority: 2,
      dependsOn: [tasks[0].id],
    }));
    
    // Phase 2: Product
    tasks.push(this.create({
      type: TaskType.CREATE_PRD,
      title: '创建 PRD',
      startupId, batchId,
      priority: 1,
      dependsOn: [tasks[1].id, tasks[2].id],
    }));
    
    tasks.push(this.create({
      type: TaskType.DESIGN_FEATURES,
      title: '功能设计',
      startupId, batchId,
      priority: 2,
      dependsOn: [tasks[3].id],
    }));
    
    // Phase 3: Build
    tasks.push(this.create({
      type: TaskType.BUILD_MVP,
      title: '构建 MVP',
      startupId, batchId,
      priority: 1,
      dependsOn: [tasks[4].id],
    }));
    
    // Phase 4: Launch & Growth
    tasks.push(this.create({
      type: TaskType.ACQUIRE_USERS,
      title: '获取用户',
      startupId, batchId,
      priority: 1,
      dependsOn: [tasks[5].id],
    }));
    
    tasks.push(this.create({
      type: TaskType.ANALYZE_METRICS,
      title: '分析指标',
      startupId, batchId,
      priority: 2,
      dependsOn: [tasks[6].id],
    }));
    
    return tasks;
  }
}

module.exports = {
  TaskStatus,
  TaskType,
  StartupPhase,
  Task,
  TaskFlow,
};
