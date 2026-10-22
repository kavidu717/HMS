
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

import { createMedicineBatchSchema, createMedicineSchema, createMedicineVariantSchema, stockAdjustmentSchema } from "./pharmacy.validation.js";
import { adjustMedicineStockService, createMedicineBatchService, createMedicineService, createMedicineVariantService, getAllMedicinesService, getExpiryMonitoringService, getStockMovementHistoryService, getVariantStockService } from "./pharmacy.service.js";

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

export const createMedicineVariantController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
      return;
    }

    const parsed = createMedicineVariantSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    try {
      const variant = await createMedicineVariantService(
        BigInt(id),
        parsed.data,
      );

      res.status(201).json({
        success: true,
        message: "Medicine variant created successfully",
        data: {
          ...variant,
          id: variant.id.toString(),
          medicineId: variant.medicineId.toString(),
        },
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Medicine not found") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        res.status(409).json({
          success: false,
          message:
            "A variant with this strength and dosage form already exists for this medicine",
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};

export const createMedicineBatchController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine variant ID",
      });
      return;
    }

    const parsed = createMedicineBatchSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    try {
      const batch = await createMedicineBatchService(
        BigInt(id),
        parsed.data,
      );

      res.status(201).json({
        success: true,
        message: "Medicine batch created successfully",
        data: {
          ...batch,
          id: batch.id.toString(),
          medicineVariantId: batch.medicineVariantId.toString(),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Medicine variant not found") {
          res.status(404).json({
            success: false,
            message: error.message,
          });
          return;
        }

        if (
          error.message === "Medicine variant is inactive" ||
          error.message ===
            "Selling price cannot be less than purchase price"
        ) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }

        if (
          error.message ===
          "Batch number already exists for this medicine variant"
        ) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};



export const getVariantStockController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine variant ID",
      });
      return;
    }

    try {
      const stock = await getVariantStockService(BigInt(id));

      res.status(200).json({
        success: true,
        message: "Medicine variant stock retrieved successfully",
        data: stock,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Medicine variant not found"
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};


export const adjustMedicineStockController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine batch ID",
      });
      return;
    }

    const parsed = stockAdjustmentSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    try {
      const batch = await adjustMedicineStockService(
        BigInt(id),
        parsed.data,
      );

      res.status(200).json({
        success: true,
        message: "Medicine stock updated successfully",
        data: {
          ...batch,
          id: batch.id.toString(),
          medicineVariantId: batch.medicineVariantId.toString(),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Medicine batch not found") {
          res.status(404).json({
            success: false,
            message: error.message,
          });
          return;
        }

        if (error.message === "Insufficient stock") {
          res.status(400).json({
            success: false,
            message: error.message,
          });
          return;
        }
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};


export const getStockMovementHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid medicine batch ID",
      });
      return;
    }

    try {
      const history = await getStockMovementHistoryService(BigInt(id));

      res.status(200).json({
        success: true,
        message: "Stock movement history retrieved successfully",
        data: history,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Medicine batch not found"
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      throw error;
    }
  } catch (error) {
    next(error);
  }
};


export const getExpiryMonitoringController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const batches = await getExpiryMonitoringService();

    res.status(200).json({
      success: true,
      message: "Expiry monitoring data retrieved successfully",
      data: batches,
    });
  } catch (error) {
    next(error);
  }
};
