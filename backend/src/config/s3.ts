import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.js";

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  endpoint: `https://s3.${env.AWS_REGION}.amazonaws.com`,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY
  }
});

export const s3BucketName = env.AWS_S3_BUCKET_NAME;