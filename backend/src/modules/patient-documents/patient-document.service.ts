import {
  DeleteObjectCommand,
    GetObjectCommand,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

import { prisma } from "../../config/prisma.js";
import {
  s3Client,
  s3BucketName
} from "../../config/s3.js";

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const createPatientDocument = async (
  patientId: bigint,
  file: UploadedFile,
  uploadedBy: bigint
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId
    }
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const safeFileName = file.originalname
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  const s3Key = `patients/${patientId}/documents/${randomUUID()}-${safeFileName}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3BucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    const document = await prisma.patientDocument.create({
      data: {
        patientId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        s3Key,
        uploadedBy
      }
    });

    return {
      id: document.id.toString(),
      patientId: document.patientId.toString(),
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      uploadedBy: document.uploadedBy.toString(),
      createdAt: document.createdAt
    };
  } catch (error) {
    console.error("Patient document creation failed:", error);
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: s3Key
        })
      );
      console.log("Orphaned S3 object deleted:", s3Key);
    } catch {
      console.error("Failed to delete orphaned S3 object:", s3Key);
    }

    throw error;
  }
};


export const getPatientDocuments = async (patientId: bigint) =>  {
    
      const patient = await prisma.patient.findUnique({
    where: {
      id: patientId
    }
  });

  if (!patient) {
    throw new Error("Patient not found");
    }

    const documents = await prisma.patientDocument.findMany({
    where: {
        patientId
    },
    orderBy: {
        createdAt: "desc"
    }
  });

    return documents.map((document) => ({
    id: document.id.toString(),
    patientId: document.patientId.toString(),
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    uploadedBy: document.uploadedBy.toString(),
    createdAt: document.createdAt
    }));



    }

export const getPatientDocumentUrl = async (
  patientId: bigint,
  documentId: bigint
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      id: patientId
    }
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const document = await prisma.patientDocument.findFirst({
    where: {
      id: documentId,
      patientId
    }
  });

  if (!document) {
    throw new Error("Document not found");
  }

  const command = new GetObjectCommand({
    Bucket: s3BucketName,
    Key: document.s3Key
  });

  const url = await getSignedUrl(
    s3Client,
    command,
    {
      expiresIn: 300
    }
  );

  return {
    id: document.id.toString(),
    fileName: document.fileName,
    fileType: document.fileType,
    fileSize: document.fileSize,
    url,
    expiresIn: 300
  };
};