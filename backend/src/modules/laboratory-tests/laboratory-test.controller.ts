import type { Request, Response, NextFunction } from "express";
import {
  createLaboratoryTestSchema,
} from "./laboratory-test.schema.js";
import {
  createLaboratoryTest,
  getLaboratoryTests,
} from "./laboratory-test.service.js";

export const createLaboratoryTestController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const validation = createLaboratoryTestSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.flatten(),
      });
      return;
    }

    const laboratoryTest = await createLaboratoryTest(validation.data);

    res.status(201).json({
      success: true,
      message: "Laboratory test created successfully",
      data: laboratoryTest,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === "LABORATORY_TEST_CODE_EXISTS"
    ) {
      res.status(409).json({
        success: false,
        message: "Laboratory test code already exists",
      });
      return;
    }

    next(error);
  }
};


export const getLaboratoryTestsController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const laboratoryTests = await getLaboratoryTests();

    res.status(200).json({
      success: true,
      message: "Laboratory tests retrieved successfully",
      data: laboratoryTests,
    });
  } catch (error: unknown) {
    next(error);
  }
};