# Redis APL 故障排除快速指南

## APL_NOT_CONFIGURED 错误诊断步骤

### 步骤 1: 检查环境变量

确保 `.env` 文件在项目根目录（`apps/smtp/.env`），并包含以下配置：

```env
APL=redis
REDIS_URL=redis://localhost:6379
```

或者：

```env
APL=redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

**验证方法：**
```bash
# 在 apps/smtp 目录下
cat .env | grep -E "APL|REDIS"
```

### 步骤 2: 验证 Redis 服务器运行状态

```bash
# 测试 Redis 连接
redis-cli ping
# 应该返回: PONG

# 如果 Redis 未运行，启动它
redis-server

# 或使用 Docker
docker run -d -p 6379:6379 redis:latest
```

### 步骤 3: 测试 Redis 连接

```bash
# 使用 redis-cli 测试连接
redis-cli -h localhost -p 6379 ping

# 如果有密码
redis-cli -h localhost -p 6379 -a yourpassword ping
```

### 步骤 4: 检查应用日志

启动应用时，查看控制台输出，应该看到：

```
Redis client connected
Redis client ready
Redis connection established
```

如果看到错误信息，根据错误信息排查：

- `Failed to connect to Redis: connect ECONNREFUSED` → Redis 服务器未运行
- `Failed to connect to Redis: NOAUTH Authentication required` → 需要设置密码
- `Missing required environment variables` → 环境变量未正确设置

### 步骤 5: 验证环境变量加载

在 Node.js 中，确保环境变量被正确加载。检查：

1. `.env` 文件位置正确（`apps/smtp/.env`）
2. 如果使用 `dotenv`，确保在应用启动前加载
3. Next.js 会自动加载 `.env.local` 或 `.env` 文件

### 步骤 6: 检查网络连接

如果 Redis 在远程服务器：

```bash
# 测试网络连接
telnet redis-host 6379
# 或
nc -zv redis-host 6379
```

### 步骤 7: 验证 Redis 配置

检查 Redis 配置文件（通常在 `/etc/redis/redis.conf` 或 `redis.conf`）：

```conf
# 确保绑定到正确的接口
bind 127.0.0.1  # 或 0.0.0.0 如果从远程连接

# 如果设置了密码
requirepass yourpassword

# 确保端口正确
port 6379
```

## 常见问题解决方案

### 问题 1: 环境变量未生效

**解决方案：**
- 确保 `.env` 文件在 `apps/smtp` 目录
- 重启应用服务器
- 检查是否有 `.env.local` 覆盖了 `.env`

### 问题 2: Redis 连接被拒绝

**解决方案：**
```bash
# 检查 Redis 是否运行
ps aux | grep redis

# 启动 Redis
redis-server

# 检查端口是否被占用
netstat -an | grep 6379
# 或
lsof -i :6379
```

### 问题 3: 认证失败

**解决方案：**
- 检查 `REDIS_PASSWORD` 是否正确
- 如果使用 URL 格式，确保密码正确编码：
  ```env
  REDIS_URL=redis://:password@localhost:6379
  ```

### 问题 4: 连接超时

**解决方案：**
- 检查防火墙设置
- 验证网络连接
- 检查 Redis 的 `timeout` 配置

## 调试技巧

### 启用详细日志

在应用启动时，Redis APL 会输出日志。确保日志级别足够详细。

### 手动测试 Redis 操作

```bash
# 连接到 Redis
redis-cli

# 测试基本操作
SET test-key "test-value"
GET test-key
KEYS saleor-apl:*
```

### 检查应用启动顺序

确保：
1. Redis 服务器先启动
2. 然后启动应用
3. 应用启动时会自动连接 Redis

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. 错误消息的完整内容
2. 应用启动日志
3. Redis 服务器日志
4. `.env` 文件内容（隐藏敏感信息）
5. Redis 版本和配置

