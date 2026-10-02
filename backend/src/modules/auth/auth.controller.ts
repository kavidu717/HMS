import type { Request, Response } from "express";
import { changePasswordSchema, loginSchema } from "./auth.schema.js";
import { loginUser } from "./auth.service.js";
import { AuthenticatedRequest } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/prisma.js";
import { changePassword as changePasswordService } from "./auth.service.js";



export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const input = loginSchema.parse(req.body);

    const result = await loginUser(input);

    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Login failed"
    });
  }
};

export const getMe = async(req:Request, res:Response)=>{
  try{

    const authenticatedReq = req as AuthenticatedRequest;
    
    const user=await prisma.user.findUnique({
      where:{
        id:BigInt(authenticatedReq.user.userId)
      },
      include:{
        role:true
      }
    })

    if(!user || user.status!=="ACTIVE"){
      return res.status(401).json({
        success: false,
        message: "User account is not active or does not exist"
      })
    }

    res.status(200).json({
      success:true,
      message:"User fetched successfully",
      data:{
        id:user.id.toString(),
        username:user.username,
        email:user.email,
        role:user.role.name,
        privileges:user.role.privileges,
      }
    })

    





  }catch(error){
    return res.status(500).json({
      success:false,
      message:"Internal Server Error"
    })
  }

}

export const changePassword = async(req:Request, res:Response)=>{
  try{

    const authenticatedReq = req as AuthenticatedRequest;
    const input = changePasswordSchema.parse(req.body);

    await changePasswordService(authenticatedReq.user.userId, input);
     
    return res.status(200).json({
      success:true,
      message:"Password changed successfully"
    })



  }catch(error){

    if (error instanceof Error) {
      return res.status(400).json({
        success:false,
        message:error.message
      })
    }

    return res.status(500).json({
      success:false,
      message:"Internal Server Error"
    })
  }
}