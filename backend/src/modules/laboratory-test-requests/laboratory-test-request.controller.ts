
import type { Request, Response, NextFunction } from "express";
import { createLaboratoryTestRequestSchema } from "./laboratory-test-request.schema.js";
import { createLaboratoryTestRequest } from "./laboratory-test-request.service.js";

export const createLaboratoryTestRequestController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validation = createLaboratoryTestRequestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const laboratoryTestRequest = await createLaboratoryTestRequest(
      validation.data,
    );

    res.status(201).json({
      success: true,
      message: "Laboratory test request created successfully",
      data: laboratoryTestRequest,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const statusByError: Record<string, number> = {
        PATIENT_NOT_FOUND: 404,
        DOCTOR_NOT_FOUND: 404,
        LABORATORY_TEST_NOT_FOUND: 404,
        LABORATORY_TEST_INACTIVE: 409,
      };

      const status = statusByError[error.message];

      if (status) {
        const messageByError: Record<string, string> = {
          PATIENT_NOT_FOUND: "Patient not found",
          DOCTOR_NOT_FOUND: "Doctor not found",
          LABORATORY_TEST_NOT_FOUND: "Laboratory test not found",
          LABORATORY_TEST_INACTIVE: "Laboratory test is inactive",
        };

        res.status(status).json({
          success: false,
          message: messageByError[error.message],
        });
        return;
      }
    }

    next(error);
  }
};
