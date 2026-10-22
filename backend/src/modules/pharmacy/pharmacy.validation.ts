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


export const createMedicineVariantSchema = z.object({
  strength: z
    .string()
    .trim()
    .min(1, "Strength is required")
    .max(50),

  dosageForm: z
    .string()
    .trim()
    .min(1, "Dosage form is required")
    .max(50),

  unit: z
    .string()
    .trim()
    .min(1, "Unit is required")
    .max(30),

  reorderLevel: z
    .number()
    .int()
    .min(0, "Reorder level cannot be negative")
    .default(0),
});

export type CreateMedicineVariantInput = z.infer<
  typeof createMedicineVariantSchema
>;


export const createMedicineBatchSchema = z.object({
  batchNumber: z
    .string()
    .trim()
    .min(1, "Batch number is required")
    .max(100),

  quantity: z
    .number()
    .int()
    .positive("Quantity must be greater than zero"),

  purchasePrice: z
    .number()
    .min(0, "Purchase price cannot be negative"),

  sellingPrice: z
    .number()
    .min(0, "Selling price cannot be negative"),

  expiryDate: z.iso.date("Expiry date must be in YYYY-MM-DD format"),
});

export type CreateMedicineBatchInput = z.infer<
  typeof createMedicineBatchSchema
>;


export const stockAdjustmentSchema = z.object({
  movementType: z.enum(["RECEIPT", "ISSUE", "ADJUSTMENT"]),
  quantity: z.number().int().positive("Quantity must be greater than zero"),
  reason: z.string().trim().min(1, "Reason is required").max(255),
  referenceNumber: z.string().trim().max(100).optional(),
});

export type StockAdjustmentInput = z.infer<
  typeof stockAdjustmentSchema
>;