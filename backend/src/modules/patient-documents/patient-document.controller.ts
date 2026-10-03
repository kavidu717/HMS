import type { Request, Response } from "express";
import { createPatientDocument } from "./patient-document.service.js";
import { getPatientDocuments } from "./patient-document.service.js";



export const uploadPatientDocument = async (
  req: Request,
  res: Response
) => {
  try {
    const patientIdParam = req.params.patientId;

    if (typeof patientIdParam !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID"
      });
    }

    const patientId = BigInt(patientIdParam);

    const authenticatedRequest = req as Request & {
      user: { userId: string | number | bigint };
    };

    const uploadedBy = BigInt(authenticatedRequest.user.userId);

    const file = (req as Request & {
      file?: Parameters<typeof createPatientDocument>[1];
    }).file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File is required"
      });
    }

    const document = await createPatientDocument(
      patientId,
      file,
      uploadedBy
    );

    return res.status(201).json({
      success: true,
      message: "Patient document uploaded successfully",
      data: document
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID"
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload patient document"
    });
  }
};


export const getPatientDocumentsController = async (
  req: Request,
  res: Response
) => {
  try {
    const patientIdParam = req.params.patientId;

    if (typeof patientIdParam !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID"
      });
    }

    let patientId: bigint;

    try {
      patientId = BigInt(patientIdParam);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID"
      });
    }

    const documents = await getPatientDocuments(patientId);

    return res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Patient not found") {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to get patient documents"
    });
  }
};