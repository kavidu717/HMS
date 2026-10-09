import { Request, Response } from "express";
import { createAppointmentSchema } from "./appointment.schema.js";
import {
  createAppointment as createAppointmentService,
    getAllAppointments as getAllAppointmentsService
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