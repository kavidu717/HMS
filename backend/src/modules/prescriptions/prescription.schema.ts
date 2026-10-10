import { z } from "zod";

export const createPrescriptionSchema = z.object({
  prescriptionNumber: z
    .string()
    .trim()
    .min(1, "Prescription number is required")
    .max(50),

  patientId: z
    .string()
    .regex(/^[1-9]\d*$/, "Invalid patient ID"),

  doctorId: z
    .string()
    .regex(/^[1-9]\d*$/, "Invalid doctor ID"),

  medicalRecordId: z
    .string()
    .regex(/^[1-9]\d*$/, "Invalid medical record ID")
    .optional(),

  medicineName: z
    .string()
    .trim()
    .min(1, "Medicine name is required")
    .max(255),

  dosage: z
    .string()
    .trim()
    .min(1, "Dosage is required")
    .max(100),

  frequency: z
    .string()
    .trim()
    .min(1, "Frequency is required")
    .max(100),

  duration: z
    .string()
    .trim()
    .min(1, "Duration is required")
    .max(100),

  quantity: z
    .number()
    .int()
    .positive()
    .optional(),

  instructions: z
    .string()
    .trim()
    .max(5000)
    .optional()
});

export const updatePrescriptionSchema = z.object({
  medicineName: z.string().trim().min(1).max(255).optional(),
  dosage: z.string().trim().min(1).max(100).optional(),
  frequency: z.string().trim().min(1).max(100).optional(),
  duration: z.string().trim().min(1).max(100).optional(),
  quantity: z.number().int().positive().nullable().optional(),
  instructions: z.string().trim().max(5000).nullable().optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided" }
);

export const updatePrescriptionStatusSchema = z.object({
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"])
});