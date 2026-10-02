import { prisma } from "../../config/prisma.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { generateAccessToken } from "../../utils/jwt.js";
import type { ChangePasswordInput, LoginInput } from "./auth.schema.js";

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: {
      username: input.username
    },
    include: {
      role: true
    }
  });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

  if (!user.passwordHash) {
    throw new Error("Password has not been set");
  }

  const passwordValid = await comparePassword(
    input.password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error("Invalid username or password");
  }

  const accessToken = generateAccessToken({
    userId: user.id.toString(),
    roleId: user.roleId.toString()
  });

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      lastLoginAt: new Date()
    }
  });

  return {
    accessToken,
    user: {
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role.name,
      privileges: user.role.privileges
    }
  };
};

export const changePassword = async (userId: string, input: ChangePasswordInput) => {
      
  const user = await prisma.user.findUnique({
    where: {
      id: BigInt(userId)
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

  if (!user.passwordHash) {
    throw new Error("Password has not been set");
  }

  const passwordValid = await comparePassword(
    input.currentPassword,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new Error("Current password is incorrect");
  }

  const newPasswordHash = await hashPassword(input.newPassword)
     
  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      passwordHash: newPasswordHash
    }
  });
}