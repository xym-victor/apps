import { APL } from "@saleor/app-sdk/APL";
import { DynamoAPL } from "@saleor/app-sdk/APL/dynamodb";
import { FileAPL } from "@saleor/app-sdk/APL/file";
import { SaleorCloudAPL } from "@saleor/app-sdk/APL/saleor-cloud";
import { UpstashAPL } from "@saleor/app-sdk/APL/upstash";
import { SaleorApp } from "@saleor/app-sdk/saleor-app";

import { createLogger } from "./logger";
import { dynamoMainTable } from "./modules/dynamodb/dynamo-main-table";

const aplType = process.env.APL ?? "file";

export let apl: APL;

// TODO introduce t3/env
const validateDynamoEnvVariables = () => {
  const envsSet = [
    "DYNAMODB_MAIN_TABLE_NAME",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
  ].every((req) => process.env[req] !== undefined);

  if (!envsSet) {
    throw new Error("Missing required environment variables for DynamoDB APL configuration.");
  }
};

const validateRedisEnvVariables = () => {
  // Redis can be configured via REDIS_URL or individual host/port/password
  const hasUrl = process.env.REDIS_URL !== undefined;
  const hasHost = process.env.REDIS_HOST !== undefined;

  if (!hasUrl && !hasHost) {
    throw new Error(
      "Missing required environment variables for Redis APL configuration. Set either REDIS_URL or REDIS_HOST.",
    );
  }
};

/**
 * Lazy initialization of Redis APL to avoid blocking module loading
 * This prevents Redis client creation from affecting AppBridge initialization
 */
let redisAPLInstance: APL | undefined;

const createRedisAPL = async (): Promise<APL> => {
  if (redisAPLInstance) {
    return redisAPLInstance;
  }

  // Dynamic import to avoid loading Redis module on client side
  const { RedisAPL } = await import("@saleor/app-sdk/APL/redis");
  const { createClient } = await import("redis");
  const { readFileSync } = await import("fs");

  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || "localhost";
  const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisDb = parseInt(process.env.REDIS_DB || "0", 10);
  const redisTlsCaCertPath = process.env.REDIS_TLS_CA_CERT_PATH;

  let redisClient;

  if (redisUrl) {
    const clientConfig: Parameters<typeof createClient>[0] = {
      url: redisUrl,
    };

    // If CA certificate path is provided, add TLS configuration
    if (redisTlsCaCertPath) {
      try {
        const caCert = readFileSync(redisTlsCaCertPath, "utf-8");

        clientConfig.socket = {
          ...clientConfig.socket,
          tls: true,
          ca: caCert,
          rejectUnauthorized: true, // Verify certificate
        };
      } catch (error) {
        throw new Error(
          `Failed to read Redis TLS CA certificate from ${redisTlsCaCertPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    redisClient = createClient(clientConfig);
  } else {
    const clientConfig: Parameters<typeof createClient>[0] = {
      socket: {
        host: redisHost,
        port: redisPort,
      },
      password: redisPassword,
      database: redisDb,
    };

    // If CA certificate path is provided, add TLS configuration
    if (redisTlsCaCertPath) {
      try {
        const caCert = readFileSync(redisTlsCaCertPath, "utf-8");

        clientConfig.socket = {
          ...clientConfig.socket,
          tls: true,
          ca: caCert,
          rejectUnauthorized: true, // Verify certificate
        };
      } catch (error) {
        throw new Error(
          `Failed to read Redis TLS CA certificate from ${redisTlsCaCertPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    redisClient = createClient(clientConfig);
  }

  // Add error event listeners for better debugging
  redisClient.on("error", (error) => {
    const logger = createLogger("RedisAPL");
    logger.error(
      {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : undefined,
      },
      "Redis client error",
    );
  });

  redisClient.on("connect", () => {
    const logger = createLogger("RedisAPL");
    logger.info("Redis client connecting...");
  });

  redisClient.on("ready", () => {
    const logger = createLogger("RedisAPL");
    logger.info("Redis client ready");
  });

  redisClient.on("reconnecting", () => {
    const logger = createLogger("RedisAPL");
    logger.warn("Redis client reconnecting...");
  });

  const hashCollectionKey = process.env.REDIS_HASH_COLLECTION_KEY || "saleor_app_auth";

  redisAPLInstance = new RedisAPL({
    client: redisClient,
    hashCollectionKey,
  });

  return redisAPLInstance;
};

switch (aplType) {
  case "dynamodb": {
    validateDynamoEnvVariables();

    apl = DynamoAPL.create({
      table: dynamoMainTable,
    });

    break;
  }

  case "upstash":
    apl = new UpstashAPL();

    break;

  case "redis": {
    validateRedisEnvVariables();

    /**
     * Use a proxy APL that lazily initializes Redis APL on first use
     * This prevents blocking module initialization and avoids client-side execution
     */
    const proxyAPL: APL = {
      get: async (saleorApiUrl: string) => {
        const redisAPL = await createRedisAPL();

        return redisAPL.get(saleorApiUrl);
      },
      set: async (authData) => {
        const redisAPL = await createRedisAPL();

        return redisAPL.set(authData);
      },
      delete: async (saleorApiUrl: string) => {
        const redisAPL = await createRedisAPL();

        return redisAPL.delete(saleorApiUrl);
      },
      getAll: async () => {
        const redisAPL = await createRedisAPL();

        return redisAPL.getAll();
      },
    };

    apl = proxyAPL;

    break;
  }

  case "file":
    apl = new FileAPL();

    break;

  case "saleor-cloud": {
    if (!process.env.REST_APL_ENDPOINT || !process.env.REST_APL_TOKEN) {
      throw new Error("Rest APL is not configured - missing env variables. Check saleor-app.ts");
    }

    apl = new SaleorCloudAPL({
      resourceUrl: process.env.REST_APL_ENDPOINT,
      token: process.env.REST_APL_TOKEN,
    });

    break;
  }

  default: {
    throw new Error("Invalid APL config, ");
  }
}
export const saleorApp = new SaleorApp({
  apl,
});

export const REQUIRED_SALEOR_VERSION = ">=3.11.7 <4";
