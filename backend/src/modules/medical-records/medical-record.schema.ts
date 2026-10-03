
import { z } from "zod";

export const createMedicalRecordSchema = z.object({
  patientId: z
    .string()
    .min(1, "Patient ID is required"),

  diagnosis: z
    .string()
    .trim()
    .max(5000, "Diagnosis must not exceed 5000 characters")
    .optional(),

  symptoms: z
    .string()
    .trim()
    .max(5000, "Symptoms must not exceed 5000 characters")
    .optional(),

  treatment: z
    .string()
    .trim()
    .max(5000, "Treatment must not exceed 5000 characters")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(5000, "Notes must not exceed 5000 characters")
    .optional(),

  recordedAt: z
    .string()
    .datetime()
    .optional()
});

export const updateMedicalRecordSchema = createMedicalRecordSchema
  .omit({
    patientId: true
  })
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided"
  );

export type CreateMedicalRecordInput = z.infer<
  typeof createMedicalRecordSchema
>;

export type UpdateMedicalRecordInput = z.infer<
  typeof updateMedicalRecordSchema
>;