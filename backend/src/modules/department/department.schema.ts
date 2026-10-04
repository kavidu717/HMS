import {z} from "zod";

export const createDepartmentSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Department name is required")
    .max(100, "Department name must be less than 100 characters"),

  description: z.string()
    .trim()
    .max(500, "Description must be less than 500 characters")
    .optional(),

  status: z.string()
    .trim()
    .min(1, "Status is required")
    .max(20, "Status must be less than 20 characters")
    .optional()
});