import { z } from "zod";

export const createAttendanceSchema = z.object({
  employeeId: z
    .string()
    .regex(/^[1-9]\d*$/, "Invalid employee ID"),

  date: z
    .string()
    .date("Invalid attendance date"),

  checkIn: z
    .string()
    .datetime({ offset: true })
    .optional(),

  checkOut: z
    .string()
    .datetime({ offset: true })
    .optional(),

  status: z
    .enum(["PRESENT", "ABSENT", "LATE"])
    .optional(),
});

export const updateAttendanceSchema = z
  .object({
    checkIn: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional(),

    checkOut: z
      .string()
      .datetime({ offset: true })
      .nullable()
      .optional(),

    status: z
      .enum(["PRESENT", "ABSENT", "LATE"])
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  );