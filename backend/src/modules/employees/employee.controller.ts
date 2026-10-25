
import type { Request, Response } from "express";
import { createEmployeeSchema } from "./employee.validation.js";
import {
  createEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from "./employee.service.js";

const updateEmployeeSchema = createEmployeeSchema.partial();

export const createEmployeeController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = createEmployeeSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten(),
      });
      return;
    }

    const data = result.data;

    const employeeData: {
      userId: bigint;
      employeeNumber: string;
      firstName: string;
      lastName: string;
      position: string;
      phone: string;
      email: string;
      departmentId?: bigint;
    } = {
      userId: BigInt(data.userId),
      employeeNumber: data.employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      phone: data.phone,
      email: data.email,
    };

    if (data.departmentId !== undefined && data.departmentId !== null) {
      employeeData.departmentId = BigInt(data.departmentId);
    }

    const employee = await createEmployee(employeeData);

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        ...employee,
        id: employee.id.toString(),
        userId: employee.userId.toString(),
        departmentId: employee.departmentId?.toString() ?? null,
      },
    });
  } catch (error) {
    console.error("Create employee error:", error);

    if (error instanceof Error) {
      if (
        error.message === "User not found" ||
        error.message === "Department not found"
      ) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message === "User account is not active" ||
        error.message === "User role is not assigned" ||
        error.message ===
          "User role is not allowed for employee registration"
      ) {
        res.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message === "Employee already exists for this user" ||
        error.message === "Employee number already exists"
      ) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getEmployeesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const employees = await getEmployees();

    res.status(200).json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees,
    });
  } catch (error) {
    console.error("Get employees error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getEmployeeByIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^\d+$/.test(id) || BigInt(id) <= 0n) {
      res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
      return;
    }

    const employee = await getEmployeeById(BigInt(id));

    res.status(200).json({
      success: true,
      message: "Employee retrieved successfully",
      data: employee,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Employee not found") {
      res.status(404).json({
        success: false,
        message: "Employee not found",
      });
      return;
    }

    console.error("Get employee by ID error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};



export const updateEmployeeController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^\d+$/.test(id) || BigInt(id) <= 0n) {
      res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
      return;
    }

    const parsed = updateEmployeeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const data: Parameters<typeof updateEmployee>[1] = {};

    if (parsed.data.employeeNumber !== undefined) {
      data.employeeNumber = parsed.data.employeeNumber;
    }
    if (parsed.data.firstName !== undefined) {
      data.firstName = parsed.data.firstName;
    }
    if (parsed.data.lastName !== undefined) {
      data.lastName = parsed.data.lastName;
    }
    if (parsed.data.position !== undefined) {
      data.position = parsed.data.position;
    }
    if (parsed.data.phone !== undefined) {
      data.phone = parsed.data.phone;
    }
    if (parsed.data.email !== undefined) {
      data.email = parsed.data.email;
    }
    if (parsed.data.departmentId !== undefined) {
      data.departmentId =
        parsed.data.departmentId === null
          ? null
          : BigInt(parsed.data.departmentId);
    }

    const updatedEmployee = await updateEmployee(BigInt(id), data);
    const employee = await getEmployeeById(updatedEmployee.id);

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    if (!(error instanceof Error)) {
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
      return;
    }

    if (error.message === "Employee not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === "Department not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === "Employee number already exists") {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
