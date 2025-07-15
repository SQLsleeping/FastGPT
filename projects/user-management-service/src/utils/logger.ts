import winston from 'winston';
import path from 'path';
import { config } from '../config';

/**
 * 日志级别定义
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

/**
 * 日志格式化器
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // 添加元数据
    if (Object.keys(meta).length > 0) {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }

    // 添加错误堆栈
    if (stack) {
      logMessage += `\nStack: ${stack}`;
    }

    return logMessage;
  }),
);

/**
 * 控制台格式化器（开发环境使用）
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss',
  }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;

    // 在开发环境中显示更多详细信息
    if (config.app.env === 'development' && Object.keys(meta).length > 0) {
      logMessage += `\n  Meta: ${JSON.stringify(meta, null, 2)}`;
    }

    if (stack) {
      logMessage += `\n  Stack: ${stack}`;
    }

    return logMessage;
  }),
);

/**
 * 创建日志传输器
 */
const createTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // 控制台输出
  transports.push(
    new winston.transports.Console({
      level: config.app.env === 'production' ? 'info' : 'debug',
      format: config.app.env === 'production' ? logFormat : consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),
  );

  // 文件输出（生产环境）
  if (config.app.env === 'production') {
    // 错误日志文件
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        handleExceptions: true,
        handleRejections: true,
      }),
    );

    // 组合日志文件
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    );

    // HTTP访问日志文件
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'access.log'),
        level: 'http',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 10,
      }),
    );
  }

  return transports;
};

/**
 * 创建Winston日志器实例
 */
const createLogger = (): winston.Logger => {
  return winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: {
      service: 'user-management-service',
      version: process.env['npm_package_version'] || '1.0.0',
      environment: config.app.env,
    },
    transports: createTransports(),
    exitOnError: false,
  });
};

/**
 * 日志器实例
 */
export const logger = createLogger();

/**
 * 日志工具类
 */
export class Logger {
  private static instance: winston.Logger = logger;

  /**
   * 记录错误日志
   */
  static error(message: string, meta?: any): void {
    this.instance.error(message, meta);
  }

  /**
   * 记录警告日志
   */
  static warn(message: string, meta?: any): void {
    this.instance.warn(message, meta);
  }

  /**
   * 记录信息日志
   */
  static info(message: string, meta?: any): void {
    this.instance.info(message, meta);
  }

  /**
   * 记录HTTP日志
   */
  static http(message: string, meta?: any): void {
    this.instance.http(message, meta);
  }

  /**
   * 记录调试日志
   */
  static debug(message: string, meta?: any): void {
    this.instance.debug(message, meta);
  }

  /**
   * 记录详细日志
   */
  static verbose(message: string, meta?: any): void {
    this.instance.verbose(message, meta);
  }

  /**
   * 记录认证相关日志
   */
  static auth(action: string, meta?: any): void {
    this.instance.info(`AUTH: ${action}`, {
      category: 'authentication',
      ...meta,
    });
  }

  /**
   * 记录安全相关日志
   */
  static security(event: string, meta?: any): void {
    this.instance.warn(`SECURITY: ${event}`, {
      category: 'security',
      ...meta,
    });
  }

  /**
   * 记录性能日志
   */
  static performance(operation: string, duration: number, meta?: any): void {
    this.instance.info(`PERFORMANCE: ${operation} took ${duration}ms`, {
      category: 'performance',
      duration,
      ...meta,
    });
  }

  /**
   * 记录数据库操作日志
   */
  static database(operation: string, meta?: any): void {
    this.instance.debug(`DATABASE: ${operation}`, {
      category: 'database',
      ...meta,
    });
  }

  /**
   * 记录API请求日志
   */
  static api(method: string, path: string, statusCode: number, responseTime: number, meta?: any): void {
    this.instance.http(`API: ${method} ${path} ${statusCode} ${responseTime}ms`, {
      category: 'api',
      method,
      path,
      statusCode,
      responseTime,
      ...meta,
    });
  }

  /**
   * 创建子日志器
   */
  static child(defaultMeta: any): winston.Logger {
    return this.instance.child(defaultMeta);
  }

  /**
   * 设置日志级别
   */
  static setLevel(level: string): void {
    this.instance.level = level;
  }

  /**
   * 获取当前日志级别
   */
  static getLevel(): string {
    return this.instance.level;
  }
}

/**
 * 请求日志中间件
 */
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  // 记录请求开始
  logger.http('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId,
  });

  // 监听响应结束
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: duration,
      ip: req.ip,
      userId: req.user?.userId,
    });
  });

  next();
};

/**
 * 错误日志中间件
 */
export const errorLogger = (error: any, req: any, _res: any, next: any) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.userId,
    body: req.body,
    query: req.query,
  });

  next(error);
};

// 导出默认日志器
export default logger;
