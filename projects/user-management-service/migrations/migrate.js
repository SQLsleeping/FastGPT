#!/usr/bin/env node

/**
 * 数据库迁移管理脚本
 * 用于执行和管理数据库迁移
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

// 迁移配置
const MIGRATIONS_DIR = __dirname;
const MIGRATIONS_TABLE = 'schema_migrations';

// 数据库连接配置
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

/**
 * 创建迁移记录表
 */
async function createMigrationsTable(client) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64) NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_filename ON ${MIGRATIONS_TABLE}(filename);
    CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON ${MIGRATIONS_TABLE}(executed_at);
  `;
  
  await client.query(createTableSQL);
  console.log('✓ 迁移记录表已创建或已存在');
}

/**
 * 获取已执行的迁移
 */
async function getExecutedMigrations(client) {
  const result = await client.query(
    `SELECT filename, checksum FROM ${MIGRATIONS_TABLE} ORDER BY filename`
  );
  return result.rows;
}

/**
 * 获取所有迁移文件
 */
function getAllMigrationFiles() {
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  return files.map(filename => {
    const filepath = path.join(MIGRATIONS_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    const checksum = require('crypto')
      .createHash('sha256')
      .update(content)
      .digest('hex');
    
    return { filename, filepath, content, checksum };
  });
}

/**
 * 执行单个迁移
 */
async function executeMigration(client, migration) {
  console.log(`执行迁移: ${migration.filename}`);
  
  try {
    // 开始事务
    await client.query('BEGIN');
    
    // 执行迁移SQL
    await client.query(migration.content);
    
    // 记录迁移执行
    await client.query(
      `INSERT INTO ${MIGRATIONS_TABLE} (filename, checksum) VALUES ($1, $2)`,
      [migration.filename, migration.checksum]
    );
    
    // 提交事务
    await client.query('COMMIT');
    
    console.log(`✓ 迁移 ${migration.filename} 执行成功`);
  } catch (error) {
    // 回滚事务
    await client.query('ROLLBACK');
    throw new Error(`迁移 ${migration.filename} 执行失败: ${error.message}`);
  }
}

/**
 * 执行所有待执行的迁移
 */
async function runMigrations() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('✓ 数据库连接成功');
    
    // 创建迁移记录表
    await createMigrationsTable(client);
    
    // 获取已执行的迁移
    const executedMigrations = await getExecutedMigrations(client);
    const executedFilenames = new Set(executedMigrations.map(m => m.filename));
    
    // 获取所有迁移文件
    const allMigrations = getAllMigrationFiles();
    
    // 检查已执行迁移的校验和
    for (const executed of executedMigrations) {
      const migration = allMigrations.find(m => m.filename === executed.filename);
      if (migration && migration.checksum !== executed.checksum) {
        throw new Error(`迁移文件 ${executed.filename} 已被修改，校验和不匹配`);
      }
    }
    
    // 找出待执行的迁移
    const pendingMigrations = allMigrations.filter(
      migration => !executedFilenames.has(migration.filename)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✓ 所有迁移都已执行，数据库是最新的');
      return;
    }
    
    console.log(`发现 ${pendingMigrations.length} 个待执行的迁移:`);
    pendingMigrations.forEach(m => console.log(`  - ${m.filename}`));
    
    // 执行待执行的迁移
    for (const migration of pendingMigrations) {
      await executeMigration(client, migration);
    }
    
    console.log('✓ 所有迁移执行完成');
    
  } catch (error) {
    console.error('❌ 迁移执行失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * 显示迁移状态
 */
async function showStatus() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    
    // 创建迁移记录表（如果不存在）
    await createMigrationsTable(client);
    
    const executedMigrations = await getExecutedMigrations(client);
    const allMigrations = getAllMigrationFiles();
    
    console.log('\n迁移状态:');
    console.log('========================================');
    
    for (const migration of allMigrations) {
      const executed = executedMigrations.find(e => e.filename === migration.filename);
      const status = executed ? '✓ 已执行' : '⏳ 待执行';
      const executedAt = executed ? ` (${executed.executed_at})` : '';
      
      console.log(`${status} ${migration.filename}${executedAt}`);
    }
    
    console.log('========================================');
    console.log(`总计: ${allMigrations.length} 个迁移文件`);
    console.log(`已执行: ${executedMigrations.length} 个`);
    console.log(`待执行: ${allMigrations.length - executedMigrations.length} 个`);
    
  } catch (error) {
    console.error('❌ 获取迁移状态失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

/**
 * 创建新的迁移文件
 */
function createMigration(name) {
  if (!name) {
    console.error('❌ 请提供迁移名称');
    console.log('用法: npm run migrate:create <migration_name>');
    process.exit(1);
  }
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`;
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  const template = `-- ${name}
-- Migration: ${filename}
-- Description: ${name}
-- Author: FastGPT Team
-- Date: ${new Date().toISOString().slice(0, 10)}

-- 在这里添加你的迁移SQL

-- 示例:
-- CREATE TABLE example (
--     id VARCHAR(24) PRIMARY KEY,
--     name VARCHAR(255) NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );

-- 添加表注释
-- COMMENT ON TABLE example IS '示例表';
`;
  
  fs.writeFileSync(filepath, template);
  console.log(`✓ 迁移文件已创建: ${filename}`);
}

/**
 * 主函数
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
    case 'migrate':
      await runMigrations();
      break;
      
    case 'status':
      await showStatus();
      break;
      
    case 'create':
      createMigration(process.argv[3]);
      break;
      
    default:
      console.log('FastGPT 用户管理服务 - 数据库迁移工具');
      console.log('');
      console.log('用法:');
      console.log('  node migrate.js up        - 执行所有待执行的迁移');
      console.log('  node migrate.js status    - 显示迁移状态');
      console.log('  node migrate.js create <name> - 创建新的迁移文件');
      console.log('');
      console.log('或者使用 npm 脚本:');
      console.log('  npm run migrate           - 执行迁移');
      console.log('  npm run migrate:status    - 显示状态');
      console.log('  npm run migrate:create <name> - 创建迁移');
      break;
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  showStatus,
  createMigration,
};
