import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";


export interface AuthenticatedRequest extends Request {
    user:{
        userId: string;
        roleId: string;
    }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction)=>{
    
    try{

        const token=req.cookies?.access_token;

        if(!token){
            return res.status(401).json(
                {
                    success: false,
                    message: "Access Denied! No token provided"
                }
            )
        }

        const payload = verifyAccessToken(token);

        (req as AuthenticatedRequest).user = {
            userId: payload.userId,
            roleId: payload.roleId
        }

        next();

    }catch{
        return res.status(401).json
        ({
            success: false,
            message: "invalid token or expired token"
        })
    }
}

