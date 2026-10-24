import type { Request, Response } from "express";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.validation.js";
import {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  getAttendancesByEmployee,
} from "./attendance.service.js";
const serializeBigInt = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (_key, nestedValue) =>
      typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue,
    ),
  ) as T;

export const createAttendanceController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parsed = createAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const attendance = await createAttendance({
      employeeId: BigInt(parsed.data.employeeId),
      date: new Date(`${parsed.data.date}T00:00:00.000Z`),
      ...(parsed.data.checkIn !== undefined && {
        checkIn: new Date(parsed.data.checkIn),
      }),
      ...(parsed.data.checkOut !== undefined && {
        checkOut: new Date(parsed.data.checkOut),
      }),
      ...(parsed.data.status !== undefined && {
        status: parsed.data.status,
      }),
    });

    res.status(201).json({
      success: true,
      message: "Attendance created successfully",
      data: serializeBigInt(attendance),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Employee not found") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message ===
        "Attendance already exists for this employee on this date"
      ) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message ===
        "Check-out time cannot be earlier than check-in time"
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    console.error("Create Attendance Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAttendancesController = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const attendances = await getAttendances();

    res.status(200).json({
      success: true,
      data: serializeBigInt(attendances),
    });
  } catch (error) {
    console.error("Get Attendances Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAttendanceByIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
      return;
    }

    const attendance = await getAttendanceById(BigInt(id));

    res.status(200).json({
      success: true,
      data: serializeBigInt(attendance),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Attendance not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Get Attendance By ID Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateAttendanceController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const id = req.params.id;

    if (typeof id !== "string" || !/^[1-9]\d*$/.test(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid attendance ID",
      });
      return;
    }

    const parsed = updateAttendanceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const attendance = await updateAttendance(BigInt(id), {
      ...(parsed.data.checkIn !== undefined && {
        checkIn:
          parsed.data.checkIn === null
            ? null
            : new Date(parsed.data.checkIn),
      }),
      ...(parsed.data.checkOut !== undefined && {
        checkOut:
          parsed.data.checkOut === null
            ? null
            : new Date(parsed.data.checkOut),
      }),
      ...(parsed.data.status !== undefined && {
        status: parsed.data.status,
      }),
    });

    res.status(200).json({
      success: true,
      message: "Attendance updated successfully",
      data: serializeBigInt(attendance),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Attendance not found") {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message ===
        "Check-out time cannot be earlier than check-in time"
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    console.error("Update Attendance Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAttendancesByEmployeeController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const employeeId = req.params.employeeId;

    if (typeof employeeId !== "string" || !/^[1-9]\d*$/.test(employeeId)) {
      res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
      return;
    }

    const attendances = await getAttendancesByEmployee(BigInt(employeeId));

    res.status(200).json({
      success: true,
      data: serializeBigInt(attendances),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Employee not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Get Attendances By Employee Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};