import { z } from "zod";

export const createEmployeeLeaveRecordSchema = z
  .object({
    employeeId: z.string().regex(/^[1-9]\d*$/, "Invalid employee ID"),
    leaveType: z.string().trim().min(1).max(50),
    startDate: z.string().date("Invalid start date"),
    endDate: z.string().date("Invalid end date"),
    reason: z.string().trim().max(5000).optional(),
  })
  .refine(
    (data) => data.endDate >= data.startDate,
    {
      message: "End date cannot be earlier than start date",
      path: ["endDate"],
    },
  );

export const updateEmployeeLeaveRecordSchema = z
  .object({
    leaveType: z.string().trim().min(1).max(50).optional(),
    startDate: z.string().date("Invalid start date").optional(),
    endDate: z.string().date("Invalid end date").optional(),
    reason: z.string().trim().max(5000).nullable().optional(),
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided",
  )
  .refine(
    (data) =>
      data.startDate === undefined ||
      data.endDate === undefined ||
      data.endDate >= data.startDate,
    {
      message: "End date cannot be earlier than start date",
      path: ["endDate"],
    },
  );