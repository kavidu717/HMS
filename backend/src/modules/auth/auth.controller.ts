import type { Request, Response } from "express";
import { loginSchema } from "./auth.schema.js";
import { loginUser } from "./auth.service.js";

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