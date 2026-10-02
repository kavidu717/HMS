import { createUserSchema } from "./user.schema.js";
import { createUser as createUserService ,getUsers as getUsersService,
getUserById as getUserByIdService
} from "./user.service.js";
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

export const getUsers = async (req: Request, res: Response) => {
  try{
    const users = await getUsersService();
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users
    });

  }catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to get users"
    });
  }
}

export const getUserById = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        if (!userId || Array.isArray(userId)) {
            return res.status(400).json({
                success: false,
                message: "User ID is required"
            });

        }

        const user = await getUserByIdService(userId);

        return res.status(200).json({

            success: true,
            message: "User retrieved successfully",
            data: user
        });

    }
    catch (error) {
       if (error instanceof Error && error.message === "User not found") {
            return res.status(404).json({
                success: false,
                message: error.message

            });
        }

        return res.status(500).json({
            success: false,
            message:"Failed to get user"
        });
    }
}
