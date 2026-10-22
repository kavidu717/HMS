
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { createMedicineSchema } from "./pharmacy.validation.js";
import { createMedicineService, getAllMedicinesService } from "./pharmacy.service.js";

export const createMedicineController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validationResult = createMedicineSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    const medicine = await createMedicineService(validationResult.data);

    res.status(201).json({
  success: true,
  message: "Medicine created successfully",
  data: {
    ...medicine,
    id: medicine.id.toString(),
  },
});


  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Medicine code already exists"
    ) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
      });
      return;
    }

    next(error);
  }
};
export const getAllMedicinesController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const medicines = await getAllMedicinesService();

    res.status(200).json({
      success: true,
      message: "Medicines retrieved successfully",
      data: medicines.map((medicine) => ({
        ...medicine,
        id: medicine.id.toString(),
        variants: medicine.variants.map((variant) => ({
          ...variant,
          id: variant.id.toString(),
          medicineId: variant.medicineId.toString(),
        })),
      })),
    });
  } catch (error) {
    next(error);
  }
};
