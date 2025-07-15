#!/usr/bin/env node

/**
 * 最小化启动脚本
 * 使用ts-node直接运行TypeScript代码，避免编译错误
 */

const path = require('path');
const { spawn } = require('child_process');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 启动参数
const args = [
  '--transpile-only', // 跳过类型检查，只转译
  '--ignore-diagnostics', // 忽略诊断信息
  path.join(__dirname, 'src/app-minimal.ts')
];

console.log('🚀 Starting User Management Service (Minimal Mode)...');
console.log('📝 Using ts-node with transpile-only mode');
console.log('⚠️  Type checking is disabled for faster startup');

// 启动ts-node进程
const child = spawn('npx', ['ts-node', ...args], {
  stdio: 'inherit',
  cwd: __dirname,
  env: {
    ...process.env,
    TS_NODE_TRANSPILE_ONLY: 'true',
    TS_NODE_IGNORE_DIAGNOSTICS: 'true',
  }
});

// 处理进程退出
child.on('close', (code) => {
  console.log(`\n📊 Process exited with code ${code}`);
  process.exit(code);
});

child.on('error', (error) => {
  console.error('❌ Failed to start process:', error);
  process.exit(1);
});

// 处理信号
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  child.kill('SIGTERM');
});
