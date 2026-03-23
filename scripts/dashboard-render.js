#!/usr/bin/env node
/**
 * YC Factory — Status Renderer
 * 
 * 非交互式状态渲染，用于 Cline / API / 脚本调用
 * 输出纯文本+ANSI，可以在终端显示波浪效果
 * 
 * 用法:
 *   node scripts/dashboard-render.js              # 渲染当前状态
 *   node scripts/dashboard-render.js --watch     # 实时监控模式 (5fps)
 *   node scripts/dashboard-render.js --json      # JSON 格式输出
 */

const { YCFactory } = require('./factory.js');
const { FactoryState } = require('../protocol/state-sync.js');

// ─────────────────────────────────────────────────────────────
// ANSI 颜色 & 样式
// ─────────────────────────────────────────────────────────────
const F = {
  reset:        '\x1b[0m',
  bold:         '\x1b[1m',
  dim:          '\x1b[2m',
  black:        '\x1b[30m',
  red:          '\x1b[31m',
  green:        '\x1b[32m',
  yellow:       '\x1b[33m',
  blue:         '\x1b[34m',
  magenta:      '\x1b[35m',
  cyan:         '\x1b[36m',
  white:        '\x1b[37m',
  brightBlack:  '\x1b[90m',
  brightRed:    '\x1b[91m',
  brightGreen:  '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue:   '\x1b[94m',
  brightMagenta:'\x1b[95m',
  brightCyan:   '\x1b[96m',
  brightWhite:  '\x1b[97m',
  // 背景色
  bgBlack:   '\x1b[40m',
  bgRed:     '\x1b[41m',
  bgGreen:   '\x1b[42m',
  bgYellow:  '\x1b[43m',
  bgBlue:    '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan:    '\x1b[46m',
  bgWhite:   '\x1b[47m',
};

// ─────────────────────────────────────────────────────────────
// Wave 渲染器
// ─────────────────────────────────────────────────────────────
class WaveRenderer {
  constructor(width = 50, height = 6) {
    this.width = width;
    this.height = height;
    this.t = 0;
  }
  
  next() {
    const lines = [];
    for (let y = 0; y < this.height; y++) {
      const amp = 2.5;
      const freq = 0.2;
      const phase = Math.sin(y * freq + this.t) * amp + amp;
      const filled = Math.floor(phase);
      
      // 三层波浪
      const w1 = '░'.repeat(Math.max(0, filled - 2));
      const w2 = '▒'.repeat(Math.max(0, Math.min(filled, 2)));
      const w3 = '▓'.repeat(Math.max(0, filled - 4 > 0 ? Math.min(filled - 4, 2) : 0));
      
      lines.push(`${F.cyan}${w1}${F.blue}${w2}${F.magenta}${w3}${F.reset}`);
    }
    this.t += 0.15;
    return lines;
  }
}

// ─────────────────────────────────────────────────────────────
// Dashboard 渲染器
// ─────────────────────────────────────────────────────────────
class StatusRenderer {
  constructor() {
    this.factory = new YCFactory({ name: 'YC Factory' });
    this.wave = new WaveRenderer();
  }
  
  async init() {
    await this.factory.initialize();
  }
  
  /**
   * 获取快照
   */
  snapshot() {
    const status = this.factory.snapshot();
    const agents = Array.from(this.factory.agents.values()).map(a => ({
      id: a.id,
      name: a.name || a.id,
      role: a.role,
      status: a.status,
    }));
    
    const startups = Array.from(this.factory.state.startups.values()).map(s => ({
      id: s.id,
      name: s.name,
      phase: s.phase,
      score: s.score,
      fate: s.fate,
    }));
    
    return {
      status,
      agents,
      startups,
      opportunities: this.factory.state.opportunities,
    };
  }
  
  /**
   * 渲染为 ANSI 文本
   */
  render(waveLines = null) {
    const data = this.snapshot();
    const s = data.status;
    const t = this.wave.next();
    
    let out = '';
    
    // 波浪背景
    if (waveLines !== false) {
      out += `${F.dim}${t.join('\n')}${F.reset}\n`;
    }
    
    // Header
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    out += `${F.bgBlue}${F.white} ${F.bold}YC FACTORY${F.reset} ${F.bgBlue}${F.dim}v1.0${F.reset} ${F.bgBlue}${' '.repeat(38)}${F.bgBlue}${F.dim}${time}${F.reset}\n`;
    out += `${F.cyan}${'━'.repeat(60)}${F.reset}\n`;
    
    // 统计卡片
    out += F.black + ' ' + F.bgGreen + F.white + ' BATCHES  ' + F.green + F.bold + String(s.batches).padStart(3) + F.reset + ' ';
    out += F.black + F.bgCyan + F.white + ' STARTUPS ' + F.green + F.bold + String(s.startups).padStart(3) + F.reset + ' ';
    out += F.black + F.bgYellow + F.white + ' AGENTS   ' + F.green + F.bold + String(s.agents).padStart(3) + F.reset + ' ';
    out += F.black + F.bgMagenta + F.white + ' OPP      ' + F.green + F.bold + String(s.opportunities).padStart(3) + F.reset + '\n';
    
    // 分隔
    out += `${F.cyan}${'─'.repeat(60)}${F.reset}\n`;
    
    // STARTUPS
    out += `${F.brightWhite}${F.bold}  📦 STARTUPS${F.reset}\n`;
    if (data.startups.length === 0) {
      out += `${F.dim}  暂无 startup${F.reset}\n`;
    } else {
      for (const startup of data.startups) {
        const phaseColors = {
          idea: F.brightBlack, approved: F.yellow, mvp: F.brightCyan,
          launched: F.green, growth: F.brightGreen, pivot: F.brightMagenta,
          scale: F.brightYellow, killed: F.red,
        };
        const pc = phaseColors[startup.phase] || F.white;
        const score = startup.score !== null ? startup.score.toFixed(1) : '--';
        out += `  ${F.brightWhite}●${F.reset} ${startup.name.padEnd(18)} ${pc}${startup.phase.padEnd(10)}${F.reset} ${F.brightYellow}score: ${score}${F.reset}\n`;
      }
    }
    
    // OPPORTUNITIES
    out += `${F.brightWhite}${F.bold}  💡 OPPORTUNITIES${F.reset}\n`;
    if (data.opportunities.length === 0) {
      out += `${F.dim}  暂无待评估机会${F.reset}\n`;
    } else {
      for (const opp of data.opportunities) {
        const sc = opp.status === 'evaluating' ? F.brightYellow : F.green;
        out += `  ${sc}●${F.reset} ${opp.idea} ${F.dim}[${opp.status}]${F.reset}\n`;
      }
    }
    
    // AGENTS
    out += `${F.brightWhite}${F.bold}  🤖 AGENTS${F.reset}\n`;
    const cols = 3;
    for (let i = 0; i < data.agents.length; i += cols) {
      let row = '  ';
      for (let j = 0; j < cols; j++) {
        const idx = i + j;
        if (idx < data.agents.length) {
          const agent = data.agents[idx];
          const sc = agent.status === 'idle' ? F.green : agent.status === 'running' ? F.brightYellow : F.dim;
          row += `${sc}●${F.reset} ${agent.name.substring(0, 14).padEnd(14)}  `;
        }
      }
      out += row + '\n';
    }
    
    // Footer
    out += `${F.cyan}${'━'.repeat(60)}${F.reset}\n`;
    out += `${F.dim}  R: 刷新  Q/ESC: 退出  Ctrl+C: 退出${F.reset}\n`;
    
    return out;
  }
  
  /**
   * 渲染为 JSON
   */
  renderJSON() {
    return JSON.stringify(this.snapshot(), null, 2);
  }
}

// ─────────────────────────────────────────────────────────────
// 主程序
// ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const isWatch = args.includes('--watch');
  const isJSON = args.includes('--json');
  
  const renderer = new StatusRenderer();
  await renderer.init();
  
  if (isJSON) {
    console.log(renderer.renderJSON());
    process.exit(0);
  }
  
  if (isWatch) {
    // 实时监控模式 5fps
    const { hide, cursorTo, clearLine } = require('readline');
    let first = true;
    const loop = () => {
      if (first) {
        console.clear();
        first = false;
      } else {
        cursorTo(process.stdout, 0, 0);
        clearLine(process.stdout, 0);
      }
      process.stdout.write(renderer.render() + '\n');
    };
    loop();
    setInterval(loop, 200); // 5fps
    return;
  }
  
  // 单次渲染
  console.log(renderer.render());
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

module.exports = { StatusRenderer, WaveRenderer };
