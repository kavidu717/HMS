import { z } from "zod";

export const createEmployeeSchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, "User ID must be a valid integer"),

  employeeNumber: z
    .string()
    .trim()
    .min(1, "Employee number is required")
    .max(50, "Employee number must not exceed 50 characters"),

  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must not exceed 100 characters"),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must not exceed 100 characters"),

  position: z
    .string()
    .trim()
    .min(1, "Position is required")
    .max(100, "Position must not exceed 100 characters"),

  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(20, "Phone number must not exceed 20 characters"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(150, "Email must not exceed 150 characters"),

  departmentId: z
    .string()
    .regex(/^\d+$/, "Department ID must be a valid integer")
    .nullable()
    .optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;