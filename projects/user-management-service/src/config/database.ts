import { Pool, PoolClient } from 'pg';
import mongoose from 'mongoose';
import * as Redis from 'redis';
import { config } from '@/config';
import { AppError } from '@/types';

/**
 * PostgreSQL 数据库连接池
 */
class PostgreSQLConnection {
  private static instance: PostgreSQLConnection;
  private pool: Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: config.database.url,
      host: config.database.host,
      port: config.database.port,
      database: config.database.name,
      user: config.database.user,
      password: config.database.password,
      ssl: config.database.ssl,
      min: config.database.pool.min,
      max: config.database.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // 监听连接池事件
    this.pool.on('connect', () => {
      console.log('PostgreSQL client connected');
    });

    this.pool.on('error', err => {
      console.error('PostgreSQL pool error:', err);
    });
  }

  public static getInstance(): PostgreSQLConnection {
    if (!PostgreSQLConnection.instance) {
      PostgreSQLConnection.instance = new PostgreSQLConnection();
    }
    return PostgreSQLConnection.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async getClient(): Promise<PoolClient> {
    try {
      return await this.pool.connect();
    } catch (error) {
      throw new AppError('Failed to get database client', 500, 'DATABASE_CONNECTION_ERROR');
    }
  }

  public async query(text: string, params?: unknown[]): Promise<unknown> {
    const client = await this.getClient();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = (await this.query('SELECT 1 as health')) as any;
      return result && result.rows && result.rows.length > 0;
    } catch {
      return false;
    }
  }
}

/**
 * MongoDB 连接管理
 */
class MongoDBConnection {
  private static instance: MongoDBConnection;
  private isConnected = false;

  private constructor() {
    // 配置 Mongoose
    mongoose.set('strictQuery', false);

    // 监听连接事件
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected');
      this.isConnected = true;
    });

    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      this.isConnected = false;
    });
  }

  public static getInstance(): MongoDBConnection {
    if (!MongoDBConnection.instance) {
      MongoDBConnection.instance = new MongoDBConnection();
    }
    return MongoDBConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(config.mongodb.uri, {
        dbName: config.mongodb.name,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
    } catch (error) {
      throw new AppError('Failed to connect to MongoDB', 500, 'MONGODB_CONNECTION_ERROR');
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      const result = await mongoose.connection.db?.admin().ping();
      return result?.['ok'] === 1;
    } catch {
      return false;
    }
  }

  public getConnection(): typeof mongoose {
    return mongoose;
  }
}

/**
 * Redis 连接管理
 */
class RedisConnection {
  private static instance: RedisConnection;
  private client: Redis.RedisClientType;
  private isConnected = false;

  private constructor() {
    const clientConfig: any = {
      url: config.redis.url,
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      database: config.redis.db,
    };

    if (config.redis.password) {
      clientConfig.password = config.redis.password;
    }

    this.client = Redis.createClient(clientConfig);

    // 监听连接事件
    this.client.on('connect', () => {
      console.log('Redis connected');
      this.isConnected = true;
    });

    this.client.on('error', err => {
      console.error('Redis connection error:', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      console.log('Redis disconnected');
      this.isConnected = false;
    });
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
    } catch (error) {
      throw new AppError('Failed to connect to Redis', 500, 'REDIS_CONNECTION_ERROR');
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  public getClient(): Redis.RedisClientType {
    return this.client;
  }

  public async get(key: string): Promise<string | null> {
    const fullKey = `${config.redis.keyPrefix}${key}`;
    return await this.client.get(fullKey);
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    const fullKey = `${config.redis.keyPrefix}${key}`;
    if (ttl) {
      await this.client.setEx(fullKey, ttl, value);
    } else {
      await this.client.set(fullKey, value);
    }
  }

  public async del(key: string): Promise<void> {
    const fullKey = `${config.redis.keyPrefix}${key}`;
    await this.client.del(fullKey);
  }

  public async exists(key: string): Promise<boolean> {
    const fullKey = `${config.redis.keyPrefix}${key}`;
    const result = await this.client.exists(fullKey);
    return result === 1;
  }

  public async healthCheck(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}

/**
 * 数据库管理器
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private postgresql: PostgreSQLConnection;
  private mongodb: MongoDBConnection;
  private redis: RedisConnection;

  private constructor() {
    this.postgresql = PostgreSQLConnection.getInstance();
    this.mongodb = MongoDBConnection.getInstance();
    this.redis = RedisConnection.getInstance();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<void> {
    console.log('Connecting to databases...');

    try {
      // 连接 Redis
      await this.redis.connect();

      // 连接 MongoDB（如果配置了）
      if (config.mongodb.uri) {
        await this.mongodb.connect();
      }

      console.log('✓ All databases connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    console.log('Disconnecting from databases...');

    await Promise.all([this.postgresql.close(), this.mongodb.disconnect(), this.redis.disconnect()]);

    console.log('✓ All databases disconnected');
  }

  public async healthCheck(): Promise<{
    postgresql: boolean;
    mongodb: boolean;
    redis: boolean;
    overall: boolean;
  }> {
    const [postgresql, mongodb, redis] = await Promise.all([
      this.postgresql.healthCheck(),
      this.mongodb.healthCheck(),
      this.redis.healthCheck(),
    ]);

    const overall = postgresql && redis && (config.mongodb.uri ? mongodb : true);

    return {
      postgresql,
      mongodb,
      redis,
      overall,
    };
  }

  // 获取数据库连接实例
  public getPostgreSQL(): PostgreSQLConnection {
    return this.postgresql;
  }

  public getMongoDB(): MongoDBConnection {
    return this.mongodb;
  }

  public getRedis(): RedisConnection {
    return this.redis;
  }

  /**
   * 初始化所有数据库连接
   */
  public async initialize(): Promise<void> {
    try {
      // 测试PostgreSQL连接
      await this.postgresql.query('SELECT 1');
      console.log('✅ PostgreSQL connection established');

      // 测试MongoDB连接（如果需要）
      if (this.mongodb) {
        await this.mongodb.connect();
        console.log('✅ MongoDB connection established');
      }

      // 测试Redis连接（如果需要）
      if (this.redis) {
        await this.redis.connect();
        console.log('✅ Redis connection established');
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * 关闭所有数据库连接
   */
  public async close(): Promise<void> {
    try {
      await this.postgresql.close();
      console.log('PostgreSQL connection closed');

      if (this.mongodb) {
        await this.mongodb.disconnect();
        console.log('MongoDB connection closed');
      }

      if (this.redis) {
        await this.redis.disconnect();
        console.log('Redis connection closed');
      }
    } catch (error) {
      console.error('Error closing database connections:', error);
      throw error;
    }
  }
}

// 导出单例实例
export const db = DatabaseManager.getInstance();
