import { Request, Response } from "express";

import {
  createPrescriptionSchema,
  updatePrescriptionSchema,
  updatePrescriptionStatusSchema
} from "./prescription.schema.js";

import {
  createPrescription as createPrescriptionService,
  getAllPrescriptions as getAllPrescriptionsService,
  getPrescriptionById as getPrescriptionByIdService,
  getPatientPrescriptions as getPatientPrescriptionsService,
  updatePrescription as updatePrescriptionService,
  updatePrescriptionStatus as updatePrescriptionStatusService
} from "./prescription.service.js";

export const createPrescription = async (
  req: Request,
  res: Response
) => {
  try {
    const input = createPrescriptionSchema.parse(req.body);

    const prescription =
      await createPrescriptionService(input);

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      data: prescription
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid prescription data",
          errors: error
        });
      }

      const notFoundErrors = [
        "Patient not found",
        "Doctor not found",
        "Medical record not found"
      ];

      if (notFoundErrors.includes(error.message)) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (
        error.message === "Doctor is not active" ||
        error.message ===
          "Medical record does not belong to this patient"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create prescription"
    });
  }
};

export const getAllPrescriptions = async (
  req: Request,
  res: Response
) => {
  try {
    const prescriptions =
      await getAllPrescriptionsService();

    return res.status(200).json({
      success: true,
      message: "Prescriptions retrieved successfully",
      data: prescriptions
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve prescriptions"
    });
  }
};

export const getPrescriptionById = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id) || !/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid prescription ID is required"
      });
    }

    const prescription =
      await getPrescriptionByIdService(id);

    return res.status(200).json({
      success: true,
      message: "Prescription retrieved successfully",
      data: prescription
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Prescription not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve prescription"
    });
  }
};

export const getPatientPrescriptions = async (
  req: Request,
  res: Response
) => {
  try {
    const { patientId } = req.params;

    if (
      !patientId ||
      Array.isArray(patientId) ||
      !/^[1-9]\d*$/.test(patientId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid patient ID is required"
      });
    }

    const prescriptions =
      await getPatientPrescriptionsService(patientId);

    return res.status(200).json({
      success: true,
      message: "Patient prescriptions retrieved successfully",
      data: prescriptions
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
      message: "Failed to retrieve patient prescriptions"
    });
  }
};

export const updatePrescription = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (
      !id ||
      Array.isArray(id) ||
      !/^[1-9]\d*$/.test(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid prescription ID is required"
      });
    }

    const input = updatePrescriptionSchema.parse(req.body);

    const prescription =
      await updatePrescriptionService(id, input);

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      data: prescription
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid prescription data",
          errors: error
        });
      }

      if (error.message === "Prescription not found") {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (
        error.message ===
        "Only active prescriptions can be updated"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update prescription"
    });
  }
};

export const updatePrescriptionStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (
      !id ||
      Array.isArray(id) ||
      !/^[1-9]\d*$/.test(id)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid prescription ID is required"
      });
    }

    const input =
      updatePrescriptionStatusSchema.parse(req.body);

    const prescription =
      await updatePrescriptionStatusService(
        id,
        input.status
      );

    return res.status(200).json({
      success: true,
      message: "Prescription status updated successfully",
      data: prescription
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return res.status(400).json({
          success: false,
          message: "Invalid prescription status",
          errors: error
        });
      }

      if (error.message === "Prescription not found") {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (
        error.message ===
        "Cancelled prescriptions cannot be updated"
      ) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update prescription status"
    });
  }
};