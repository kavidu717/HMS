import {z} from 'zod';


export const createMedicineSchema = z.object({
  medicineCode: z
    .string()
    .trim()
    .min(1, "Medicine code is required")
    .max(50),

  medicineName: z
    .string()
    .trim()
    .min(1, "Medicine name is required")
    .max(150),

  brandName: z
    .string()
    .trim()
    .min(1, "Brand name is required")
    .max(150),

  genericName: z
    .string()
    .trim()
    .min(1, "Generic name is required")
    .max(150),

  category: z
    .string()
    .trim()
    .min(1, "Category is required")
    .max(100),

  description: z
    .string()
    .trim()
    .max(5000)
    .optional(),
});

export type CreateMedicineInput = z.infer<
  typeof createMedicineSchema
>;