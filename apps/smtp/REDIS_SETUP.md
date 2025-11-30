# 使用自建 Redis 配置指南

本文档说明如何在 `apps/smtp` 项目中使用自建的 Redis 作为 APL (Auth Persistence Layer) 存储。

## 前置要求

1. 已安装并运行 Redis 服务器
2. Node.js 和 pnpm 已安装

## 安装依赖

首先，安装 Redis 客户端依赖：

```bash
pnpm install
```

## Redis 服务器配置

### 方式 1: 使用 Redis URL（推荐）

在 `.env` 文件中设置：

```env
APL=redis
REDIS_URL=redis://localhost:6379
```

如果 Redis 设置了密码：

```env
APL=redis
REDIS_URL=redis://:yourpassword@localhost:6379
```

### 方式 2: 使用单独的配置项

在 `.env` 文件中设置：

```env
APL=redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=yourpassword  # 可选
REDIS_DB=0                    # 可选，默认为 0
```

## 环境变量说明

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `APL` | APL 类型，设置为 `redis` | 是 | `file` |
| `REDIS_URL` | Redis 连接 URL | 否* | - |
| `REDIS_HOST` | Redis 主机地址 | 否* | `localhost` |
| `REDIS_PORT` | Redis 端口 | 否 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | 否 | - |
| `REDIS_DB` | Redis 数据库编号 | 否 | `0` |
| `REDIS_KEY_PREFIX` | Redis key 前缀 | 否 | `saleor-apl:` |

\* 必须设置 `REDIS_URL` 或 `REDIS_HOST` 其中之一

## 配置示例

### 本地开发环境

```env
APL=redis
REDIS_URL=redis://localhost:6379
```

### 生产环境（带密码）

```env
APL=redis
REDIS_URL=redis://:your_secure_password@redis.example.com:6379
```

### 使用单独的配置项

```env
APL=redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password
REDIS_DB=0
REDIS_KEY_PREFIX=saleor-apl:
```

## 启动 Redis 服务器

### Windows

```bash
redis-server
```

### Linux/macOS

```bash
redis-server
```

或使用 Docker:

```bash
docker run -d -p 6379:6379 redis:latest
```

## 验证配置

1. 确保 Redis 服务器正在运行
2. 设置环境变量
3. 启动应用：

```bash
pnpm dev
```

如果配置正确，应用启动时会在日志中看到 "Redis client connected" 消息。

## 故障排除

### APL_NOT_CONFIGURED 错误

如果遇到 "APL_NOT_CONFIGURED" 错误，请检查以下几点：

1. **环境变量是否正确设置**
   ```bash
   # 检查环境变量
   echo $APL
   echo $REDIS_URL
   # 或
   echo $REDIS_HOST
   ```

2. **Redis 服务器是否运行**
   ```bash
   # 测试 Redis 连接
   redis-cli ping
   # 应该返回 PONG
   ```

3. **连接信息是否正确**
   - 验证主机地址和端口
   - 如果使用密码，确保密码正确
   - 检查网络连接（防火墙、VPN等）

4. **查看应用日志**
   应用启动时会输出 Redis 连接日志，查找以下信息：
   - "Redis client connected" - 连接成功
   - "Redis client ready" - 客户端就绪
   - "Failed to connect to Redis" - 连接失败

5. **验证环境变量文件**
   确保 `.env` 文件在项目根目录，且格式正确：
   ```env
   APL=redis
   REDIS_URL=redis://localhost:6379
   ```

### 连接失败

- 检查 Redis 服务器是否正在运行
- 验证 `REDIS_HOST` 和 `REDIS_PORT` 是否正确
- 如果使用密码，确保 `REDIS_PASSWORD` 正确
- 检查防火墙设置
- 尝试使用 `redis-cli` 手动连接测试

### 认证失败

- 验证 Redis 密码是否正确
- 检查 Redis 配置文件中 `requirepass` 设置
- 如果使用 URL 格式，确保密码在 URL 中正确编码

### 常见错误信息

| 错误信息 | 可能原因 | 解决方法 |
|---------|---------|---------|
| "Missing required environment variables" | 环境变量未设置 | 检查 `.env` 文件，确保设置了 `REDIS_URL` 或 `REDIS_HOST` |
| "Failed to connect to Redis" | Redis 服务器未运行或连接信息错误 | 启动 Redis 服务器，检查连接信息 |
| "APL_NOT_CONFIGURED" | APL 未正确初始化或连接失败 | 检查 Redis 连接和日志输出 |

## 与其他 APL 选项对比

| APL 类型 | 用途 | 多租户支持 |
|----------|------|-----------|
| `file` | 本地开发 | ❌ |
| `redis` | 自建 Redis | ✅ |
| `upstash` | Upstash Redis | ✅ |
| `dynamodb` | AWS DynamoDB | ✅ |
| `saleor-cloud` | Saleor Cloud | ✅ |

## 注意事项

1. **生产环境**: 确保 Redis 服务器有适当的备份和监控
2. **安全性**: 使用强密码，并考虑使用 TLS 连接（需要修改代码支持）
3. **性能**: Redis 非常适合高并发场景，性能优于文件存储
4. **持久化**: 根据需求配置 Redis 的持久化策略（RDB 或 AOF）

## 代码位置

- Redis APL 实现: `src/modules/apl/redis-apl.ts`
- APL 配置: `src/saleor-app.ts`

