#!/usr/bin/env node
/**
 * YC Factory — Wave Terminal Dashboard
 * 
 * 终端风格波浪动画监控看板
 * 运行方式: node scripts/dashboard.js
 */

const { YCFactory } = require('./factory.js');
const { FactoryState } = require('../protocol/state-sync.js');
const readline = require('readline');

// ─────────────────────────────────────────────────────────────
// ANSI 颜色 & 样式
// ─────────────────────────────────────────────────────────────
const F = {
  // 颜色
  black:  '\x1b[30m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  magenta:'\x1b[35m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  
  // 亮色
  brightBlack:  '\x1b[90m',
  brightRed:    '\x1b[91m',
  brightGreen:  '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue:   '\x1b[94m',
  brightMagenta:'\x1b[95m',
  brightCyan:   '\x1b[96m',
  brightWhite:  '\x1b[97m',
  
  // 样式
  bold:      '\x1b[1m',
  dim:       '\x1b[2m',
  italic:    '\x1b[3m',
  underline: '\x1b[4m',
  reverse:   '\x1b[7m',
  reset:     '\x1b[0m',
  
  // 背景
  bgBlack:   '\x1b[40m',
  bgGreen:   '\x1b[42m',
  bgYellow:  '\x1b[43m',
  bgBlue:    '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan:    '\x1b[46m',
  bgWhite:   '\x1b[47m',
};

// ─────────────────────────────────────────────────────────────
// 波浪动画引擎
// ─────────────────────────────────────────────────────────────
class WaveEngine {
  constructor(width = 80, height = 20) {
    this.width = width;
    this.height = height;
    this.time = 0;
    this.frame = 0;
  }
  
  /**
   * 生成一行波浪字符
   */
  waveRow(y, time, char = '█', color = F.cyan) {
    const amplitude = 3;
    const frequency = 0.15;
    const phase = (Math.sin(y * frequency + time) * amplitude + amplitude);
    const filled = Math.floor(phase);
    
    return {
      chars: char.repeat(Math.max(0, filled)),
      color,
      position: filled,
    };
  }
  
  /**
   * 渲染多层波浪
   */
  render() {
    const lines = [];
    const waveChars = ['▀', '▄', '█', '▓', '░', '▒'];
    
    for (let y = 0; y < this.height; y++) {
      // 3层波浪，不同速度和颜色
      const w1 = this.waveRow(y, this.time * 2, '░', F.cyan);
      const w2 = this.waveRow(y, this.time * 1.5 + 1, '▒', F.blue);
      const w3 = this.waveRow(y, this.time * 1 + 2, '▓', F.magenta);
      
      let output = `${F.black}`;
      
      // 底部渐变
      if (y >= this.height - 2) {
        output = `${F.dim}${F.brightBlack}`;
      }
      
      // 波浪条
      const leftWave = w1.chars + w2.chars + w3.chars;
      output += leftWave.padEnd(Math.floor(this.width * 0.3), ' ');
      
      lines.push(output);
    }
    
    this.time += 0.08;
    return lines;
  }
}

// ─────────────────────────────────────────────────────────────
// Dashboard 渲染器
// ─────────────────────────────────────────────────────────────
class Dashboard {
  constructor() {
    this.factory = new YCFactory({ name: 'YC Factory' });
    this.wave = new WaveEngine(80, 24);
    this.rl = null;
    this.interval = null;
    this.activeAgents = [];
    this.subagentCount = 0;
  }
  
  /**
   * 初始化
   */
  async init() {
    await this.factory.initialize();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    // 每 100ms 更新一次
    this.interval = setInterval(() => this.tick(), 100);
    
    // 键盘监听
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', (str, key) => this.handleKey(key));
    
    console.clear();
    this.loop();
  }
  
  /**
   * 处理键盘
   */
  handleKey(key) {
    if (key.ctrl && key.name === 'c') {
      this.exit();
    }
    if (key.name === 'q' || key.name === 'escape') {
      this.exit();
    }
    if (key.name === 'r') {
      this.refresh();
    }
  }
  
  /**
   * 刷新状态
   */
  async refresh() {
    await this.factory.initialize();
  }
  
  /**
   * 退出
   */
  exit() {
    console.clear();
    console.log(`${F.cyan}${F.bold}👋 YC Factory Dashboard 退出${F.reset}`);
    if (this.interval) clearInterval(this.interval);
    process.exit(0);
  }
  
  /**
   * 主循环
   */
  loop() {
    const status = this.factory.snapshot();
    const agents = this.factory.agents;
    const waves = this.wave.render();
    
    console.clear();
    
    // ═══════════════════════════════════════════════════════
    // 顶部波浪背景
    // ═══════════════════════════════════════════════════════
    this.renderWave(waves);
    
    // ═══════════════════════════════════════════════════════
    // Header
    // ═══════════════════════════════════════════════════════
    this.renderHeader(status);
    
    // ═══════════════════════════════════════════════════════
    // 主面板
    // ═══════════════════════════════════════════════════════
    this.renderMainPanel(status);
    
    // ═══════════════════════════════════════════════════════
    // Agent 状态
    // ═══════════════════════════════════════════════════════
    this.renderAgentPanel(agents);
    
    // ═══════════════════════════════════════════════════════
    // 底部状态栏
    // ═══════════════════════════════════════════════════════
    this.renderFooter();
  }
  
  /**
   * 渲染波浪背景
   */
  renderWave(waves) {
    for (const line of waves.slice(0, 5)) {
      console.log(line);
    }
  }
  
  /**
   * 渲染 Header
   */
  renderHeader(status) {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    const left = `${F.brightCyan}${F.bold} YC FACTORY ${F.reset}`;
    const version = `${F.dim}v1.0${F.reset}`;
    const right = `${F.dim}${time}${F.reset}`;
    
    console.log(`${F.bgBlue}${F.white} ${left} ${version} ${' '.repeat(50)} ${right} ${' '.repeat(10)} ${F.reset}`);
    console.log(`${F.cyan}${'━'.repeat(80)}${F.reset}`);
  }
  
  /**
   * 渲染主面板
   */
  renderMainPanel(status) {
    // 左侧统计卡片
    const cardWidth = 18;
    
    const cards = [
      { label: 'BATCHES', value: status.batches, color: F.brightCyan },
      { label: 'STARTUPS', value: status.startups, color: F.brightGreen },
      { label: 'AGENTS', value: status.agents, color: F.brightYellow },
      { label: 'OPPORTUNITIES', value: status.opportunities, color: F.brightMagenta },
    ];
    
    let row = '';
    for (const card of cards) {
      const value = `${card.color}${F.bold}${String(card.value).padStart(3, ' ')}${F.reset}`;
      row += `${F.bgBlack}${F.white} ${card.label} ${value}  ${F.reset}`;
    }
    console.log(row);
    
    // Startup 列表
    console.log('');
    console.log(`${F.brightWhite}${F.bold}  📦 STARTUPS${F.reset}`);
    console.log(`${F.cyan}${'─'.repeat(80)}${F.reset}`);
    
    if (status.startups === 0) {
      console.log(`${F.dim}   暂无 startup，输入 idea 开始评估${F.reset}`);
    } else {
      // 显示 startup 列表
      for (const [id, startup] of this.factory.state.startups) {
        this.renderStartupRow(startup);
      }
    }
    
    // Opportunity 列表
    console.log('');
    console.log(`${F.brightWhite}${F.bold}  💡 OPPORTUNITIES${F.reset}`);
    console.log(`${F.cyan}${'─'.repeat(80)}${F.reset}`);
    
    if (this.factory.state.opportunities.length === 0) {
      console.log(`${F.dim}   暂无待评估机会${F.reset}`);
    } else {
      for (const opp of this.factory.state.opportunities) {
        const statusColor = opp.status === 'evaluating' ? F.brightYellow : F.green;
        console.log(`  ${statusColor}●${F.reset} ${opp.idea} ${F.dim}[${opp.status}]${F.reset}`);
      }
    }
  }
  
  /**
   * 渲染 Startup 行
   */
  renderStartupRow(startup) {
    const phase = startup.phase || 'idea';
    const score = startup.score !== null ? startup.score.toFixed(1) : '--';
    
    const phaseColors = {
      idea: F.brightBlack,
      approved: F.yellow,
      mvp: F.brightCyan,
      launched: F.green,
      growth: F.brightGreen,
      pivot: F.brightMagenta,
      scale: F.brightYellow,
      killed: F.red,
    };
    
    const phaseColor = phaseColors[phase] || F.white;
    const fate = startup.fate ? `[${startup.fate}]` : '';
    
    console.log(
      `  ${F.brightWhite}●${F.reset} ${startup.name.padEnd(20)} ` +
      `${phaseColor}${phase.padEnd(10)}${F.reset} ` +
      `${F.brightYellow}score: ${score}${F.reset} ` +
      `${F.dim}${fate}${F.reset}`
    );
  }
  
  /**
   * 渲染 Agent 面板
   */
  renderAgentPanel(agents) {
    console.log('');
    console.log(`${F.brightWhite}${F.bold}  🤖 AGENTS${F.reset}`);
    console.log(`${F.cyan}${'─'.repeat(80)}${F.reset}`);
    
    const agentArray = Array.from(agents.values());
    const cols = 4;
    const rows = Math.ceil(agentArray.length / cols);
    
    for (let r = 0; r < rows; r++) {
      let row = '  ';
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx < agentArray.length) {
          const agent = agentArray[idx];
          const statusColor = agent.status === 'idle' ? F.green : 
                            agent.status === 'running' ? F.brightYellow : F.dim;
          const name = agent.name || agent.id;
          row += `${statusColor}●${F.reset} ${name.substring(0, 12).padEnd(12)}  `;
        }
      }
      console.log(row);
    }
  }
  
  /**
   * 渲染底部状态栏
   */
  renderFooter() {
    console.log(`${F.cyan}${'━'.repeat(80)}${F.reset}`);
    
    const hints = [
      { key: 'R', desc: '刷新' },
      { key: 'Q/ESC', desc: '退出' },
      { key: 'CTRL+C', desc: '退出' },
    ];
    
    const left = hints.map(h => `${F.brightYellow}${h.key}${F.reset}:${F.dim}${h.desc}${F.reset}`).join('   ');
    const right = `${F.dim}YC Factory Dashboard${F.reset}`;
    
    console.log(`  ${left}${' '.repeat(30)}${right}`);
  }
  
  /**
   * 每帧更新
   */
  tick() {
    this.wave.time += 0.02;
    this.loop();
  }
}

// ─────────────────────────────────────────────────────────────
// 启动
// ─────────────────────────────────────────────────────────────
const dashboard = new Dashboard();
dashboard.init().catch(err => {
  console.error('Dashboard error:', err);
  process.exit(1);
});
