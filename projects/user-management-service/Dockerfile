# 用户管理服务 Dockerfile - 简化版本
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache curl

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci && npm install -g ts-node typescript

# 复制源代码
COPY . .

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# 启动命令 - 使用我们测试过的最小化应用
CMD ["npx", "ts-node", "--transpile-only", "src/app-minimal.ts"]
