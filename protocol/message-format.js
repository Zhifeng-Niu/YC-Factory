/**
 * YC Factory - Agent Message Protocol
 * 
 * Agent 间通信的标准格式
 */

const { v4: uuidv4 } = require('uuid');

/**
 * 消息类型
 */
const MessageType = {
  // 任务相关
  TASK_REQUEST: 'task_request',        // 请求执行任务
  TASK_RESPONSE: 'task_response',       // 任务响应
  TASK_UPDATE: 'task_update',          // 任务进度更新
  TASK_COMPLETE: 'task_complete',       // 任务完成
  
  // 协作相关
  COLLABORATE_REQUEST: 'collab_request',   // 协作请求
  COLLABORATE_RESPONSE: 'collab_response', // 协作响应
  Handoff: 'handoff',                       // 任务交接
  
  // 决策相关
  DECISION_REQUEST: 'decision_request',  // 决策请求
  DECISION_VOTE: 'decision_vote',        // 投票
  DECISION_RESULT: 'decision_result',    // 决策结果
  
  // 同步相关
  STATE_SYNC: 'state_sync',             // 状态同步
  HEARTBEAT: 'heartbeat',               // 心跳
  SYNC_REQUEST: 'sync_request',         // 同步请求
  
  // 事件
  EVENT_PUBLISH: 'event_publish',       // 发布事件
  EVENT_SUBSCRIBE: 'event_subscribe',   // 订阅事件
};

/**
 * 优先级
 */
const Priority = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/**
 * Agent 角色类型
 */
const AgentRole = {
  // Strategic Layer
  CEO: 'ceo',
  PARTNER: 'partner',
  STRATEGY: 'strategy',
  
  // Program Layer
  BATCH: 'batch',
  FOUNDER: 'founder',
  
  // Execution Layer
  RESEARCH: 'research',
  PRODUCT: 'product',
  ENGINEERING: 'engineering',
  GROWTH: 'growth',
  ANALYST: 'analyst',
  
  // Infrastructure
  ORCHESTRATOR: 'orchestrator',
  MEMORY: 'memory',
};

/**
 * 创建标准消息
 */
function createMessage({
  type,
  sender,
  receiver = null,  // null 表示广播
  taskId = null,
  sessionId = null,
  startupId = null,
  priority = Priority.MEDIUM,
  payload = {},
  context = {},
}) {
  return {
    id: uuidv4(),
    type,
    sender,
    receiver,
    taskId,
    sessionId,
    startupId,
    priority,
    payload,
    context,
    timestamp: new Date().toISOString(),
    expiresAt: null,  // 可设置过期时间
  };
}

/**
 * 创建任务消息
 */
function createTaskMessage(sender, receiver, task, priority = Priority.MEDIUM) {
  return createMessage({
    type: MessageType.TASK_REQUEST,
    sender,
    receiver,
    taskId: task.id,
    startupId: task.startupId,
    priority,
    payload: {
      action: task.action,
      input: task.input,
      constraints: task.constraints,
      expectedOutput: task.expectedOutput,
    },
    context: {
      taskType: task.type,
      deadline: task.deadline,
      dependencies: task.dependencies,
    },
  });
}

/**
 * 创建决策消息
 */
function createDecisionMessage(sender, receivers, decision) {
  return createMessage({
    type: MessageType.DECISION_REQUEST,
    sender,
    receiver: receivers,  // 数组，多个接收者
    priority: Priority.HIGH,
    payload: {
      decisionId: decision.id,
      question: decision.question,
      options: decision.options,
      criteria: decision.criteria,
      deadline: decision.deadline,
    },
  });
}

/**
 * 解析消息
 */
function parseMessage(raw) {
  // 验证必需字段
  if (!raw.id || !raw.type || !raw.sender) {
    throw new Error('Invalid message: missing required fields');
  }
  return raw;
}

/**
 * 消息队列管理
 */
class MessageQueue {
  constructor() {
    this.messages = [];
    this.handlers = new Map();
  }
  
  /**
   * 添加消息到队列
   */
  enqueue(message) {
    this.messages.push({
      ...message,
      enqueuedAt: new Date().toISOString(),
    });
    this.messages.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * 获取下一条消息
   */
  dequeue() {
    return this.messages.shift();
  }
  
   /**
   * 获取特定接收者的消息
   */
  getMessagesFor(receiver) {
    return this.messages.filter(
      m => m.receiver === receiver || m.receiver === null
    );
  }
  
  /**
   * 注册消息处理器
   */
  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }
  
  /**
   * 处理消息
   */
  async process(message) {
    const handlers = this.handlers.get(message.type) || [];
    for (const handler of handlers) {
      await handler(message);
    }
  }
}

module.exports = {
  MessageType,
  Priority,
  AgentRole,
  createMessage,
  createTaskMessage,
  createDecisionMessage,
  parseMessage,
  MessageQueue,
};
