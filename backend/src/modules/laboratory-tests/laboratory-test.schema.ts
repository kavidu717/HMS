import { z } from "zod";

export const createLaboratoryTestSchema = z.object({
  testCode: z
    .string()
    .trim()
    .min(1, "Test code is required")
    .max(50),

  testName: z
    .string()
    .trim()
    .min(1, "Test name is required")
    .max(150),

  description: z
    .string()
    .trim()
    .max(5000)
    .optional(),

  sampleType: z
    .string()
    .trim()
    .min(1, "Sample type is required")
    .max(100),

  price: z
    .number()
    .finite()
    .nonnegative("Price cannot be negative"),
});

export const updateLaboratoryTestSchema =
  createLaboratoryTestSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "At least one field is required",
      },
    );

export type CreateLaboratoryTestInput = z.infer<
  typeof createLaboratoryTestSchema
>;

export type UpdateLaboratoryTestInput = z.infer<
  typeof updateLaboratoryTestSchema
>;