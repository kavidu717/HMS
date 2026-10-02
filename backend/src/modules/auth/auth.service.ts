import { prisma } from "../../config/prisma.js";
import { comparePassword, hashPassword } from "../../utils/password.js";
import { generateAccessToken } from "../../utils/jwt.js";
import type { ActivateAccountInput, ChangePasswordInput, LoginInput } from "./auth.schema.js";
import crypto from "crypto";


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

export const activateAccount = async (input: ActivateAccountInput) => {
   
  const tokenHash = crypto.createHash("sha256").update(input.token).digest("hex");
  
  const invitation = await prisma.userInvitation.findUnique({
    where: {
      tokenHash
    },
    include: {
      user: true
    }
  });

  if (!invitation) {
    throw new Error("Invalid invitation token");
  }

  if ((invitation as typeof invitation & { usedAt?: Date | null }).usedAt) {
    throw new Error("Invitation token has already been used");
  }

  if (invitation.expiresAt < new Date()) {
    throw new Error("Invitation token has expired");
  }

  if (invitation.user.status !== "PENDING") {
    throw new Error("User account is not in a pending state");
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: invitation.userId
      },
      data: {
        passwordHash,
        status: "ACTIVE"
      }
    }),
    prisma.userInvitation.update({
      where: {
        id: invitation.id
      },
      data: {
        usedAt: new Date()
      }
    })
  ]);

}