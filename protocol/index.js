/**
 * YC Factory - Protocol Index
 * 
 * 导出所有协议组件
 */

const {
  MessageType,
  Priority,
  AgentRole,
  createMessage,
  createTaskMessage,
  createDecisionMessage,
  parseMessage,
  MessageQueue,
} = require('./message-format');

const {
  StateType,
  ChangeType,
  FactoryState,
  StateSync,
} = require('./state-sync');

const {
  TaskStatus,
  TaskType,
  StartupPhase,
  Task,
  TaskFlow,
} = require('./task-flow');

module.exports = {
  // Message Protocol
  MessageType,
  Priority,
  AgentRole,
  createMessage,
  createTaskMessage,
  createDecisionMessage,
  parseMessage,
  MessageQueue,
  
  // State Sync
  StateType,
  ChangeType,
  FactoryState,
  StateSync,
  
  // Task Flow
  TaskStatus,
  TaskType,
  StartupPhase,
  Task,
  TaskFlow,
};
