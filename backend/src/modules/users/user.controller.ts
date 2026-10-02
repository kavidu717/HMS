import { createUserSchema } from "./user.schema.js";
import { createUser as createUserService } from "./user.service.js";
import type { Request, Response } from "express";


export const createUser = async (req: Request, res: Response)=>{
    try {

        const input=createUserSchema.parse(req.body);
        const user = await createUserService(input);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            data: user
        });

    }catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create user"
    });
  }

}