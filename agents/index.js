/**
 * YC Factory - Agents Index
 * 
 * 导出所有 Agent
 */

// Strategic Layer
const {
  PARTNER_SYSTEM_PROMPT,
  PARTNER_CONFIG,
  evaluateIdea,
  createPartnerAgent,
} = require('./strategic/partner-agent');

// Program Layer
const {
  FOUNDER_SYSTEM_PROMPT,
  FOUNDER_CONFIG,
  createFounderAgent,
} = require('./program/founder-agent');

// Execution Layer
const {
  ENGINEERING_SYSTEM_PROMPT,
  ENGINEERING_CONFIG,
  createEngineeringAgent,
} = require('./execution/engineering-agent');

const {
  GROWTH_SYSTEM_PROMPT,
  GROWTH_CONFIG,
  createGrowthAgent,
} = require('./execution/growth-agent');

module.exports = {
  // Strategic
  createPartnerAgent,
  createFounderAgent,
  
  // Execution
  createEngineeringAgent,
  createGrowthAgent,
  
  // Presets
  agents: {
    partner: createPartnerAgent,
    founder: createFounderAgent,
    engineering: createEngineeringAgent,
    growth: createGrowthAgent,
  },
};
