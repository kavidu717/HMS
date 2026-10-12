
import { z } from "zod";

const positiveIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "ID must be a positive integer");

export const createLaboratoryTestRequestSchema = z.object({
  patientId: positiveIdSchema,
  doctorId: positiveIdSchema,
  laboratoryTestId: positiveIdSchema,
});

export type CreateLaboratoryTestRequestInput = z.infer<
  typeof createLaboratoryTestRequestSchema
>;
