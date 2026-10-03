

import { Request, Response } from "express";
import {
  createMedicalRecordSchema,
  updateMedicalRecordSchema
} from "./medical-record.schema.js";
import {
  createMedicalRecord as createMedicalRecordService,
  getMedicalRecordById as getMedicalRecordByIdService,
  getPatientMedicalHistory as getPatientMedicalHistoryService,
  updateMedicalRecord as updateMedicalRecordService
} from "./medical-record.service.js";

export const createMedicalRecord = async (
  req: Request,
  res: Response
) => {
  try {
    const input = createMedicalRecordSchema.parse(req.body);

    const medicalRecord =
      await createMedicalRecordService(input);

    return res.status(201).json({
      success: true,
      message: "Medical record created successfully",
      data: medicalRecord
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.name === "ZodError"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid medical record data",
          errors: error
        });
      }

      if (error.message === "Patient not found") {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create medical record"
    });
  }
};

export const getMedicalRecordById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id: rawId } = req.params;

    if (!rawId || Array.isArray(rawId)) {
      return res.status(400).json({
        success: false,
        message: "Medical record ID is required"
      });
    }

    const id = rawId;

    const medicalRecord =
      await getMedicalRecordByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Medical record retrieved successfully",
      data: medicalRecord
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Medical record not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve medical record"
    });
  }
};

export const getPatientMedicalHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId: rawPatientId } = req.params;

    if (!rawPatientId || Array.isArray(rawPatientId)) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    const patientId = rawPatientId;

    const medicalHistory =
      await getPatientMedicalHistoryService(patientId);

    return res.status(200).json({
      success: true,
      message: "Patient medical history retrieved successfully",
      data: medicalHistory
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Patient not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patient medical history"
    });
  }
};

export const updateMedicalRecord = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Medical record ID is required"
      });
    }

    const input = updateMedicalRecordSchema.parse(req.body);

    const medicalRecord =
      await updateMedicalRecordService(id, input);

    return res.status(200).json({
      success: true,
      message: "Medical record updated successfully",
      data: medicalRecord
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid medical record data",
          errors: error
        });
      }

      if (error.message === "Medical record not found") {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update medical record"
    });
  }
};