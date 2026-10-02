import {z} from "zod";


export const createUserSchema = z.object({
    username: z
     .string()
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username must be at most 30 characters long"),
    
    email: z.
string()
    .email("Invalid email address")
    .max(100, "Email must be at most 100 characters long"),

    roleId: z.string()
    .regex(/^[1-9]\d*$/, "Role ID must be a positive number")
    
    

})

export type CreateUserInput = z.infer<typeof createUserSchema>;
