# 生产环境变量配置清单

## ⚠️ 重要提示

`.env` 文件被 `.gitignore` 屏蔽，不会自动部署到生产环境。**必须在生产环境手动设置以下环境变量！**

## Redis APL 必需配置

### 方式 1: 使用 REDIS_URL（推荐）

```bash
APL=redis
REDIS_URL=redis://:your_password@your_redis_host:6379
```

**示例格式：**
- 无密码：`redis://your_redis_host:6379`
- 有密码：`redis://:your_password@your_redis_host:6379`
- 指定数据库：`redis://:your_password@your_redis_host:6379/0`
- **TLS + ACL（推荐生产环境）：** `rediss://username:password@your_redis_host:6379`
  - 注意：使用 `rediss://`（双 s）表示 TLS 加密连接
  - 如果使用 TLS，还需要设置 `REDIS_TLS_CA_CERT_PATH` 指向 CA 证书文件

### 方式 2: 使用单独配置项

```bash
APL=redis
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # 可选，如果 Redis 设置了密码
REDIS_DB=0                     # 可选，默认为 0
```

## 完整环境变量列表

### 必需变量

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `APL` | APL 类型，必须设置为 `redis` | `redis` |
| `REDIS_URL` | Redis 连接 URL（方式1） | `redis://:password@host:6379` |
| 或 `REDIS_HOST` | Redis 主机地址（方式2） | `43.153.98.182` |

### 可选变量

| 变量名 | 说明 | 默认值 | 示例值 |
|--------|------|--------|--------|
| `REDIS_PORT` | Redis 端口 | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | - | `your_password` |
| `REDIS_DB` | Redis 数据库编号 | `0` | `0` |
| `REDIS_HASH_COLLECTION_KEY` | Redis Hash 集合键名 | `saleor_app_auth` | `saleor_app_auth` |
| `REDIS_TLS_CA_CERT_PATH` | Redis TLS CA 证书文件路径（TLS 连接时必需） | - | `./ca.crt` 或 `/etc/redis/tls/ca.crt` |

## 根据你的配置

根据你的 `.env` 文件，你需要在生产环境设置：

**普通连接（无 TLS）：**
```bash
APL=redis
REDIS_URL=redis://:dxA28kdezT@43.153.98.182:6379
```

**TLS + ACL 连接（推荐生产环境）：**
```bash
APL=redis
REDIS_URL=rediss://victor:dxA28kdezT@43.153.98.182:6379
REDIS_TLS_CA_CERT_PATH=./ca.crt
```

**注意：**
- 使用 `rediss://`（双 s）表示 TLS 加密连接
- `victor` 是 ACL 用户名，`dxA28kdezT` 是密码
- `REDIS_TLS_CA_CERT_PATH` 指向 CA 证书文件路径（相对于项目根目录或绝对路径）
- 证书文件应放在 `apps/smtp/ca.crt`，或使用绝对路径如 `/etc/redis/tls/ca.crt`

## 部署平台配置指南

### Vercel

1. 进入项目设置 → Environment Variables
2. 添加以下变量：
   - `APL` = `redis`
   - `REDIS_URL` = `redis://:dxA28kdezT@43.153.98.182:6379`
3. 选择环境（Production, Preview, Development）
4. 保存并重新部署

### 其他平台

在部署平台的环境变量设置中添加上述变量。

## 验证配置

部署后，检查应用日志，应该看到：

```
Redis client connected
Redis client ready
Redis connection established
```

如果看到错误，检查：
1. 环境变量是否正确设置
2. Redis 服务器是否可访问
3. 密码是否正确
4. 网络连接是否正常

## 安全建议

⚠️ **重要安全提示：**

1. **不要**将 `.env` 文件提交到 Git
2. **不要**在代码中硬编码密码
3. 使用部署平台的环境变量功能
4. 定期轮换 Redis 密码
5. 限制 Redis 服务器的网络访问（仅允许应用服务器访问）

## 故障排除

如果遇到 `APL_NOT_CONFIGURED` 错误：

1. ✅ 确认 `APL=redis` 已设置
2. ✅ 确认 `REDIS_URL` 或 `REDIS_HOST` 已设置
3. ✅ 确认 Redis 服务器可访问
4. ✅ 检查应用日志中的 Redis 连接错误
5. ✅ 验证 Redis 密码是否正确

详细故障排除请参考：`REDIS_TROUBLESHOOTING.md`

