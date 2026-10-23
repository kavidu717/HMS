import { z } from "zod";

export const createInvoiceSchema = z.object({
  patientId: z
    .string()
    .min(1, "Patient ID is required")
    .regex(/^\d+$/, "Invalid patient ID"),

  items: z
    .array(
      z.object({
        category: z.enum(
          ["CONSULTATION", "LABORATORY", "PHARMACY", "ADMISSION"],
          {
            error: "Invalid invoice item category",
          },
        ),

        description: z
          .string()
          .trim()
          .min(1, "Description is required")
          .max(255, "Description must not exceed 255 characters"),

        quantity: z
          .number()
          .int()
          .positive("Quantity must be greater than zero"),

        unitPrice: z
          .number()
          .finite()
          .nonnegative("Unit price cannot be negative"),
      }),
    )
    .min(1, "At least one invoice item is required"),
});

export const recordPaymentSchema = z.object({
  invoiceId: z
    .string()
    .min(1, "Invoice ID is required")
    .regex(/^\d+$/, "Invalid invoice ID"),

  amount: z
    .number()
    .finite()
    .positive("Payment amount must be greater than zero"),

  paymentMethod: z.enum(
    ["CASH", "CARD", "BANK_TRANSFER"],
    {
      error: "Invalid payment method",
    },
  ),

  referenceNumber: z
    .string()
    .trim()
    .max(100, "Reference number must not exceed 100 characters")
    .optional(),
});

export type CreateInvoiceInput = z.infer<
  typeof createInvoiceSchema
>;

export type RecordPaymentInput = z.infer<
  typeof recordPaymentSchema
>;