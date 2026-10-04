import type { Request, Response } from "express";
import { createDoctorSchema } from "./doctor.schema.js";
import { createDoctor } from "./doctor.service.js";

export const createDoctorController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = createDoctorSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten()
      });
      return;
    }

    const data = result.data;

    const doctorData: {
      userId: bigint;
      doctorNumber: string;
      firstName: string;
      lastName: string;
      specialization: string;
      phone: string;
      email: string;
      departmentId?: bigint;
      status?: string;
    } = {
      userId: BigInt(data.userId),
      doctorNumber: data.doctorNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      specialization: data.specialization,
      phone: data.phone,
      email: data.email
    };

    if (data.departmentId !== undefined) {
      doctorData.departmentId = BigInt(data.departmentId);
    }

    if (data.status !== undefined) {
      doctorData.status = data.status;
    }

    const doctor = await createDoctor(doctorData);

    res.status(201).json({
  success: true,
  message: "Doctor created successfully",
  data: {
    ...doctor,
    id: doctor.id.toString(),
    userId: doctor.userId.toString(),
    departmentId: doctor.departmentId?.toString() ?? null
  }
});
  } catch (error) {
    console.error("Create doctor error:", error);

    if (error instanceof Error) {
      if (
        error.message === "User not found" ||
        error.message === "Department not found"
      ) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (
        error.message === "Doctor already exists for this user" ||
        error.message === "Doctor number already exists"
      ) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};