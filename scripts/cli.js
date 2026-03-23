/**
 * YC Factory - CLI Entry Point
 * 
 * 命令行接口
 */

const { YCFactory } = require('./factory');
const { evaluateIdea } = require('../agents/strategic/partner-agent');

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // 创建 Factory 实例
  const factory = new YCFactory({
    name: 'YC Factory v1',
  });
  
  await factory.initialize();
  
  console.log('\n📊 Factory Status:', factory.snapshot());
  
  // 根据命令执行
  switch (command) {
    case 'init':
      console.log('✅ Factory initialized!');
      break;
      
    case 'status':
      console.log(JSON.stringify(factory.snapshot(), null, 2));
      break;
      
    case 'evaluate':
      const idea = args.slice(1).join(' ');
      if (!idea) {
        console.error('Usage: node cli.js evaluate "<idea>"');
        process.exit(1);
      }
      console.log(`\n📝 Evaluating: "${idea}"`);
      // TODO: 实际调用 LLM 评估
      console.log('(LLM evaluation not connected yet)');
      break;
      
    case 'create':
      const startup = await factory.createStartup({
        idea: {
          name: 'Test Startup',
          description: 'A test startup',
        },
        team: ['product', 'engineering', 'growth'],
      });
      console.log('✅ Created:', startup.id);
      break;
      
    case 'tasks':
      const tasks = factory.taskFlow.getRunnableTasks();
      console.log(`\n📋 Runnable tasks: ${tasks.length}`);
      for (const task of tasks.slice(0, 5)) {
        console.log(`  - ${task.id}: ${task.title}`);
      }
      break;
      
    default:
      console.log(`
🏭 YC Factory CLI

Usage:
  node cli.js init              Initialize factory
  node cli.js status            Show factory status  
  node cli.js evaluate "<idea>" Evaluate a startup idea
  node cli.js create            Create a test startup
  node cli.js tasks             List runnable tasks
      `);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
