import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";
import { prisma } from "../config/prisma.js";



export const privilegeMiddleware = (requiredPrivilege:string)=>{
   
    return async (req: Request, res: Response, next: NextFunction)=>{
        try{
            const authenticatedReq = req as AuthenticatedRequest;
            const userId=authenticatedReq.user?.userId;

            if(!userId){
                return res.status(401).json({
                    success: false,
                    message: "Access Denied! No userId provided"
                })
            }

            const user=await prisma.user.findUnique({
                where:{
                    id:BigInt(userId)
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

            const privileges=user.role.privileges;

            if(!Array.isArray(privileges) || !privileges.includes(requiredPrivilege)){
                return res.status(403).json({
                    success: false,
                    message: "you do not have the required privilege to access this resource"
                })
            }

            next()

        }catch(error){
            next(error);
        }
    }
}
