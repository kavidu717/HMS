
import {z} from "zod";

export const createPatientSchema = z.object({

    firstName: z.string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),


    lastName: z.string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters"),
    
    dateOfBirth: z.string()
    .date("date of birth must be a valid date"),

    gender: z.enum(["MALE", "FEMALE", "OTHER"], {
        error:"gender must be male female or other"
    }),

     nic: z
    .string()
    .trim()
    .max(20, "NIC must not exceed 20 characters")
    .optional()
    .or(z.literal("")),

     phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(20, "Phone number must not exceed 20 characters"),

  email: z
    .email("Invalid email address")
    .max(150, "Email must not exceed 150 characters")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .trim()
    .max(255, "Address must not exceed 255 characters")
    .optional(),

  emergencyContactName: z
    .string()
    .trim()
    .max(150, "Emergency contact name must not exceed 150 characters")
    .optional(),

  emergencyContactPhone: z
    .string()
    .trim()
    .max(20, "Emergency contact phone must not exceed 20 characters")
    .optional()

})

export const updatePatientSchema = createPatientSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided"
  );

export type cratePatientInput=z.infer<typeof createPatientSchema>
export type UpdatePatientInput = z.infer<
  typeof updatePatientSchema
>;