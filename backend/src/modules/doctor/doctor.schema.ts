import {z} from 'zod';



export const createDoctorSchema = z.object({
     
     userId: z
    .string()
    .min(1, "User ID is required"),


    doctorNumber: z.string()
      .trim()
      .min(1,"Doctor number is required")
      .max(20,"Doctor number must be less than 20 characters"),

    firstName: z.string()
      .trim()
      .min(1,"First name is required")
      .max(50,"First name must be less than 50 characters"),
      
      
    lastName: z.string()
       .trim()
       .min(1,"Last name is required")
       .max(50,"Last name must be less than 50 characters"),
       
    specialization: z.string()
       .trim()
       .min(1,"Specialization is required")
       .max(50,"Specialization must be less than 50 characters"),
     
    phone: z.string()
         .trim()
         .min(1,"Phone number is required")
         .max(20,"Phone number must be less than 20 characters"),

    email: z.string()
         .trim()
         .email("Invalid email address")
         .max(100,"Email must be less than 100 characters"),


    departmentId: z.string()
         .min(1,"Department ID is required")
         .optional(),
         
    status: z.string()
        .trim()
        .min(1,"Status is required")
        .max(20,"Status must be less than 20 characters")
        .optional(),

})

 export const updateDoctorSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name must not exceed 100 characters")
    .optional(),

  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name must not exceed 100 characters")
    .optional(),

  specialization: z
    .string()
    .trim()
    .min(1, "Specialization is required")
    .max(100, "Specialization must not exceed 100 characters")
    .optional(),

  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .max(20, "Phone number must not exceed 20 characters")
    .optional(),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(150, "Email must not exceed 150 characters")
    .optional(),

  departmentId: z
    .string()
    .min(1, "Department ID is required")
    .optional(),

  status: z
    .string()
    .trim()
    .max(20, "Status must not exceed 20 characters")
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided"
);



export const createDoctorScheduleSchema = z.object({
  dayOfWeek: z
    .number()
    .int("Day of week must be an integer")
    .min(0, "Day of week must be between 0 and 6")
    .max(6, "Day of week must be between 0 and 6"),

  startTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Start time must be in HH:mm format"
    ),

  endTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "End time must be in HH:mm format"
    ),

  status: z
    .string()
    .trim()
    .max(20, "Status must not exceed 20 characters")
    .optional()
}).refine(
  (data) => data.startTime < data.endTime,
  {
    message: "End time must be later than start time",
    path: ["endTime"]
  }
);
export const updateDoctorScheduleSchema = z.object({
  dayOfWeek: z
    .number()
    .int("Day of week must be an integer")
    .min(0, "Day of week must be between 0 and 6")
    .max(6, "Day of week must be between 0 and 6")
    .optional(),

  startTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "Start time must be in HH:mm format"
    )
    .optional(),

  endTime: z
    .string()
    .regex(
      /^([01]\d|2[0-3]):[0-5]\d$/,
      "End time must be in HH:mm format"
    )
    .optional(),

  status: z
    .string()
    .trim()
    .max(20, "Status must be less than 20 characters")
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided"
);

export const assignDepartmentSchema = z.object({
  departmentId: z.string()
    .min(1, "Department ID is required")
});


  