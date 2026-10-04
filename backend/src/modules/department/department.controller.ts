import type { Request, Response } from "express";
import { createDepartmentSchema } from "./department.schema.js";
import { createDepartment, getDepartments} from "./department.service.js";

export const createDepartmentController = async (
  req: Request,
  res: Response
) => {
  try {
    const result = createDepartmentSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten()
      });
      return;
    }

    const data = result.data;

    const departmentData: {
      name: string;
      description?: string;
      status?: string;
    } = {
      name: data.name
    };

    if (data.description !== undefined) {
      departmentData.description = data.description;
    }

    if (data.status !== undefined) {
      departmentData.status = data.status;
    }

    const department = await createDepartment(departmentData);

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: {
        ...department,
        id: department.id.toString()
      }
    });
  } catch (error) {
    console.error("Create department error:", error);

    if (error instanceof Error) {
      if (error.message === "Department already exists") {
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

export const getDepartmentsController = async (
  req: Request,
  res: Response
) => {
  try {
    const departments = await getDepartments();

    res.status(200).json({
      success: true,
      data: departments.map((department) => ({
        ...department,
        id: department.id.toString()
      }))
    });
  } catch (error) {
    console.error("Get departments error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};