import { NextFunction, Request, Response } from "express";
import { createAppointmentSchema, rescheduleAppointmentSchema, updateAppointmentStatusSchema } from "./appointment.schema.js";
import {
    cancelAppointment,
  createAppointment as createAppointmentService,
    getAllAppointments as getAllAppointmentsService,
    getAppointmentById,
    rescheduleAppointment,
    updateAppointmentStatus
} from "./appointment.service.js";

export const createAppointment = async (
  req: Request,
  res: Response
) => {
  try {
    const input = createAppointmentSchema.parse(req.body);

    const appointment = await createAppointmentService(input);

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment
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

    if (
      error instanceof Error &&
      error.message === "Doctor not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};


export const getAllAppointments = async (
  req: Request,
  res: Response
) => {
  try {
    const appointments = await getAllAppointmentsService();

    return res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      data: appointments
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve appointments"
    });
  }
};


export const getAppointmentByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    
    const id = req.params.id;

if (typeof id !== "string" || !/^\d+$/.test(id) || BigInt(id) <= 0n) {
  res.status(400).json({
    success: false,
    message: "Invalid appointment ID",
  });
  return;
}

    const appointment = await getAppointmentById(id);

    res.status(200).json({
      success: true,
      message: "Appointment retrieved successfully",
      data: appointment,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Appointment not found") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    next(error);
  }
};

export const rescheduleAppointmentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;

    // Validate appointment ID
    if (
      typeof id !== "string" ||
      !/^\d+$/.test(id) ||
      BigInt(id) <= 0n
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
      return;
    }

    // Validate request body
    const validation = rescheduleAppointmentSchema.safeParse(
      req.body,
    );

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
      return;
    }

    // Call service
    const appointment = await rescheduleAppointment(
      id,
      validation.data,
    );

    // Success response
    res.status(200).json({
      success: true,
      message: "Appointment rescheduled successfully",
      data: appointment,
    });
  } catch (error) {
    if (error instanceof Error) {
      const notFound =
        error.message === "Appointment not found";

      const businessErrors = [
        "Invalid appointment ID",
        "Invalid appointment date",
        "Appointment date cannot be in the past",
        "Invalid appointment time",
        "End time must be after start time",
        "Doctor is not available during the selected time",
        "Doctor already has an appointment during the selected time",
      ];

      if (
        notFound ||
        businessErrors.includes(error.message) ||
        error.message.startsWith(
          "Cannot reschedule an appointment",
        )
      ) {
        res.status(notFound ? 404 : 400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    next(error);
  }
};


export const cancelAppointmentController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;

    // Validate appointment ID
    if (
      typeof id !== "string" ||
      !/^\d+$/.test(id) ||
      BigInt(id) <= 0n
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
      return;
    }

    // Cancel appointment
    const appointment = await cancelAppointment(id);

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      data: appointment,
    });
  } catch (error) {
    if (error instanceof Error) {
      const notFound = error.message === "Appointment not found";

      const businessErrors = [
        "Invalid appointment ID",
        "Appointment is already cancelled",
      ];

      if (
        notFound ||
        businessErrors.includes(error.message) ||
        error.message.startsWith("Cannot cancel an appointment")
      ) {
        res.status(notFound ? 404 : 400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    next(error);
  }
};

export const updateAppointmentStatusController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;

    if (
      typeof id !== "string" ||
      !/^\d+$/.test(id) ||
      BigInt(id) <= 0n
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
      return;
    }

    const validation = updateAppointmentStatusSchema.safeParse(
      req.body,
    );

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.issues,
      });
      return;
    }

    const appointment = await updateAppointmentStatus(
      id,
      validation.data.status,
    );

    res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      data: appointment,
    });
  } catch (error) {
    if (error instanceof Error) {
      const notFound = error.message === "Appointment not found";

      const businessErrors = [
        "Invalid appointment ID",
        "Cannot update a cancelled appointment",
        "Cannot update a completed appointment",
        "Cannot update a no-show appointment",
      ];

      if (notFound || businessErrors.includes(error.message)) {
        res.status(notFound ? 404 : 400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    next(error);
  }
};