import { APL } from "@saleor/app-sdk/APL";
import { DynamoAPL } from "@saleor/app-sdk/APL/dynamodb";
import { FileAPL } from "@saleor/app-sdk/APL/file";
import { SaleorCloudAPL } from "@saleor/app-sdk/APL/saleor-cloud";
import { UpstashAPL } from "@saleor/app-sdk/APL/upstash";
import { SaleorApp } from "@saleor/app-sdk/saleor-app";

import { dynamoMainTable } from "./modules/dynamodb/dynamo-main-table";
import { RedisAPL } from "./modules/apl/redis-apl";

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

    apl = new RedisAPL();

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
