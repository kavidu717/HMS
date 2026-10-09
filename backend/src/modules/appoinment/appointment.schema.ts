import {z} from "zod";

export const createAppointmentSchema = z.object({
    appointmentNumber: z.string()
        .trim()
        .min(1, "Appointment number is required")
        .max(20, "Appointment number must be less than 20 characters"),


    patientId: z.string()
       .min(1, "Patient ID is required")
        .regex(/^\d+$/, "Invalid patient ID"),

     doctorId: z.string()
    .min(1, "Doctor ID is required")
    .regex(/^\d+$/, "Invalid doctor ID"),
    
    
     appointmentDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),


     startTime: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:mm format"),

     endTime: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:mm format"),

       reason: z.string()
    .trim()
    .max(5000, "Reason must not exceed 5000 characters")
    .optional(),

     notes: z.string()
    .trim()
    .max(5000, "Notes must not exceed 5000 characters")
    .optional()
}).refine(
  (data) => data.startTime < data.endTime,
  {
    message: "End time must be later than start time",
    path: ["endTime"]
  }
);

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),

  startTime: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be in HH:mm format"),

  endTime: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be in HH:mm format")
}).refine(
  (data) => data.startTime < data.endTime,
  {
    message: "End time must be later than start time",
    path: ["endTime"]
  }
);


export const updateAppointmentStatusSchema = z.object({
  status: z.enum([
    "SCHEDULED",
    "CONFIRMED",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW"
  ])
});



export type CreateAppointmentInput = z.infer<
  typeof createAppointmentSchema
>;

export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;

export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;