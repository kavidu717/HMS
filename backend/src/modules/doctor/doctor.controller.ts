import type { NextFunction, Request, Response } from "express";
import { createDoctorSchema ,
  assignDepartmentSchema ,
  createDoctorScheduleSchema,
  updateDoctorScheduleSchema
} from "./doctor.schema.js";
import { createDoctor ,
  assignDepartment,
   createDoctorSchedule,
    getDoctorSchedules,
    updateDoctorSchedule,
    deleteDoctorSchedule,
    getDoctorAvailability
  } from "./doctor.service.js";

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


export const assignDepartmentController = async (
  req: Request,
  res: Response
) => {
  try {
      const doctorId = BigInt(String(req.params.id));

    const result = assignDepartmentSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten()
      });
      return;
    }

    const departmentId = BigInt(result.data.departmentId);

    const doctor = await assignDepartment(
      doctorId,
      departmentId
    );

    res.status(200).json({
      success: true,
      message: "Department assigned successfully",
      data: {
        ...doctor,
        id: doctor.id.toString(),
        userId: doctor.userId.toString(),
        departmentId: doctor.departmentId?.toString() ?? null
      }
    });
  } catch (error) {
    console.error("Assign department error:", error);

    if (error instanceof Error) {
      if (
        error.message === "Doctor not found" ||
        error.message === "Department not found"
      ) {
        res.status(404).json({
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

export const createDoctorScheduleController = async (
  req: Request,
  res: Response
) => {
  try {
    const doctorId = BigInt(String(req.params.id));

    const result = createDoctorScheduleSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten()
      });
      return;
    }

    const data = result.data;

    const scheduleData: {
      doctorId: bigint;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      status?: string;
    } = {
      doctorId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime
    };

    if (data.status !== undefined) {
      scheduleData.status = data.status;
    }

    const schedule = await createDoctorSchedule(scheduleData);

    res.status(201).json({
      success: true,
      message: "Doctor schedule created successfully",
      data: {
        ...schedule,
        id: schedule.id.toString(),
        doctorId: schedule.doctorId.toString()
      }
    });
  } catch (error) {
    console.error("Create doctor schedule error:", error);

    if (error instanceof Error) {
      if (error.message === "Doctor not found") {
        res.status(404).json({
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

export const getDoctorSchedulesController = async (
  req: Request,
  res: Response
) => {
  try {
    const doctorId = BigInt(String(req.params.id));

    const schedules = await getDoctorSchedules(doctorId);

    res.status(200).json({
      success: true,
      data: schedules.map((schedule) => ({
        ...schedule,
        id: schedule.id.toString(),
        doctorId: schedule.doctorId.toString()
      }))
    });
  } catch (error) {
    console.error("Get doctor schedules error:", error);

    if (error instanceof Error) {
      if (error.message === "Doctor not found") {
        res.status(404).json({
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

export const updateDoctorScheduleController = async (
  req: Request,
  res: Response
) => {
  try {
    const doctorId = BigInt(String(req.params.id));
    const scheduleId = BigInt(String(req.params.scheduleId));

    const result = updateDoctorScheduleSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten()
      });
      return;
    }

    const data = result.data;

    const scheduleData: {
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      status?: string;
    } = {};

    if (data.dayOfWeek !== undefined) {
      scheduleData.dayOfWeek = data.dayOfWeek;
    }

    if (data.startTime !== undefined) {
      scheduleData.startTime = data.startTime;
    }

    if (data.endTime !== undefined) {
      scheduleData.endTime = data.endTime;
    }

    if (data.status !== undefined) {
      scheduleData.status = data.status;
    }

    const schedule = await updateDoctorSchedule(
      doctorId,
      scheduleId,
      scheduleData
    );

    res.status(200).json({
      success: true,
      message: "Doctor schedule updated successfully",
      data: {
        ...schedule,
        id: schedule.id.toString(),
        doctorId: schedule.doctorId.toString()
      }
    });
  } catch (error) {
    console.error("Update doctor schedule error:", error);

    if (error instanceof Error) {
      if (
        error.message === "Doctor not found" ||
        error.message === "Schedule not found"
      ) {
        res.status(404).json({
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

export const deleteDoctorScheduleController = async (
  req: Request,
  res: Response
) => {
  try {
    const doctorId = BigInt(String(req.params.id));
    const scheduleId = BigInt(String(req.params.scheduleId));

    await deleteDoctorSchedule(
      doctorId,
      scheduleId
    );

    res.status(200).json({
      success: true,
      message: "Doctor schedule deleted successfully"
    });
  } catch (error) {
    console.error("Delete doctor schedule error:", error);

    if (error instanceof Error) {
      if (
        error.message === "Doctor not found" ||
        error.message === "Schedule not found"
      ) {
        res.status(404).json({
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

export const getDoctorAvailabilityController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;
    const date = req.query.date;

    if (
      typeof id !== "string" ||
      !/^\d+$/.test(id) ||
      BigInt(id) <= 0n
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
      return;
    }

    if (typeof date !== "string") {
      res.status(400).json({
        success: false,
        message: "Date query parameter is required (YYYY-MM-DD)",
      });
      return;
    }

    const availability = await getDoctorAvailability(id, date);

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode =
        error.message === "Doctor not found" ? 404 : 400;

      const handledErrors = [
        "Invalid doctor ID",
        "Invalid date",
        "Invalid date format. Use YYYY-MM-DD",
        "Doctor is not active",
      ];

      if (
        error.message === "Doctor not found" ||
        handledErrors.includes(error.message)
      ) {
        res.status(statusCode).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    next(error);
  }
};