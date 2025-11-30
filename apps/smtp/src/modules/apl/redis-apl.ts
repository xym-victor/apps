import { APL, AuthData } from "@saleor/app-sdk/APL";
import { createClient, RedisClientType } from "redis";

import { createLogger } from "../../logger";

const logger = createLogger("RedisAPL");

/**
 * Custom Redis APL implementation for self-hosted Redis
 * 
 * Environment variables required:
 * - REDIS_URL: Redis connection URL (e.g., redis://localhost:6379 or redis://:password@host:port)
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Redis password (optional)
 * - REDIS_DB: Redis database number (default: 0)
 * - REDIS_KEY_PREFIX: Key prefix for APL keys (default: "saleor-apl:")
 */
export class RedisAPL implements APL {
  private client: RedisClientType;
  private keyPrefix: string;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisDb = parseInt(process.env.REDIS_DB || "0", 10);
    this.keyPrefix = process.env.REDIS_KEY_PREFIX || "saleor-apl:";

    if (redisUrl) {
      this.client = createClient({
        url: redisUrl,
      });
    } else {
      this.client = createClient({
        socket: {
          host: redisHost,
          port: redisPort,
        },
        password: redisPassword,
        database: redisDb,
      });
    }

    this.client.on("error", (err) => {
      logger.error({ error: err }, "Redis client error");
    });

    this.client.on("connect", () => {
      logger.info("Redis client connected");
    });

    // Connect to Redis
    this.client.connect().catch((err) => {
      logger.error({ error: err }, "Failed to connect to Redis");
      throw new Error(`Failed to connect to Redis: ${err.message}`);
    });
  }

  private getKey(saleorApiUrl: string): string {
    return `${this.keyPrefix}${saleorApiUrl}`;
  }

  async get(saleorApiUrl: string): Promise<AuthData | undefined> {
    try {
      const key = this.getKey(saleorApiUrl);
      const data = await this.client.get(key);

      if (!data) {
        return undefined;
      }

      return JSON.parse(data) as AuthData;
    } catch (error) {
      logger.error({ error, saleorApiUrl }, "Error getting auth data from Redis");
      throw error;
    }
  }

  async set(authData: AuthData): Promise<void> {
    try {
      const key = this.getKey(authData.saleorApiUrl);
      const data = JSON.stringify(authData);

      await this.client.set(key, data);
    } catch (error) {
      logger.error({ error, saleorApiUrl: authData.saleorApiUrl }, "Error setting auth data in Redis");
      throw error;
    }
  }

  async delete(saleorApiUrl: string): Promise<void> {
    try {
      const key = this.getKey(saleorApiUrl);
      await this.client.del(key);
    } catch (error) {
      logger.error({ error, saleorApiUrl }, "Error deleting auth data from Redis");
      throw error;
    }
  }

  async getAll(): Promise<AuthData[]> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.client.keys(pattern);

      if (keys.length === 0) {
        return [];
      }

      const values = await this.client.mGet(keys);
      const authDataList: AuthData[] = [];

      for (const value of values) {
        if (value) {
          try {
            authDataList.push(JSON.parse(value) as AuthData);
          } catch (parseError) {
            logger.warn({ error: parseError }, "Failed to parse auth data from Redis");
          }
        }
      }

      return authDataList;
    } catch (error) {
      logger.error({ error }, "Error getting all auth data from Redis");
      throw error;
    }
  }

  async isReady(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  async isConfigured(saleorApiUrl: string): Promise<boolean> {
    try {
      const key = this.getKey(saleorApiUrl);
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error({ error, saleorApiUrl }, "Error checking if auth data is configured in Redis");
      return false;
    }
  }
}

