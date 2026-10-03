import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";

import {
  s3Client,
  s3BucketName
} from "./s3.js";

const testKey = "test/s3-connection-test.txt";

const testS3 = async () => {
  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3BucketName,
        Key: testKey,
        Body: "HMS S3 connection test"
      })
    );

    console.log("S3 upload successful");

    await s3Client.send(
      new GetObjectCommand({
        Bucket: s3BucketName,
        Key: testKey
      })
    );

    console.log("S3 download access successful");

   
  } catch (error) {
    console.error("S3 test failed");
    console.error(error);
  }
};

testS3();