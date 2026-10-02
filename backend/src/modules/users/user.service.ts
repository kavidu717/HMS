import { prisma } from "../../config/prisma.js";
import { sendInvitationEmail } from "../../services/email.service.js";
import { generateInvitationToken } from "../../utils/invitation-token.js";
import { CreateUserInput } from "./user.schema.js";



export const createUser = async (input: CreateUserInput) => {
 
    const roleId = BigInt(input.roleId);

    const role = await prisma.role.findUnique({
        where: {
            id: roleId
        }
    });

   if (!role) {
       throw new Error("Role not found");
    }

    const existingUsername = await prisma.user.findUnique({
        where: {
            username: input.username
        }
    });

    if (existingUsername) {
        throw new Error("Username already exists");
    }

    const existingEmail = await prisma.user.findUnique({
        where: {
            email: input.email
        }
    });

    if (existingEmail) {
        throw new Error("Email already exists");
    }

    const user = await prisma.user.create({
        data: {

            username: input.username,
            email: input.email,
            roleId,
            status: "PENDING",
        },
        include: {
            role: true
        }
    });

    const { token, tokenHash } = generateInvitationToken();
      
    const expiresAt = new Date(
  Date.now() + 24 * 60 * 60 * 1000
);

     await prisma.userInvitation.create({
         data: {
         userId: user.id,
         tokenHash,
         expiresAt
  }
});

      await sendInvitationEmail({
      to: user.email,
       username: user.username,
      role: user.role.name,
       invitationToken: token
     });

    return {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role.name,
        status: user.status,
        
        createdAt: user.createdAt,
    }


}

export const getUsers = async () => {
  const users = await prisma.user.findMany({
    include: {
      role: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return users.map((user) => ({
    id: user.id.toString(),
    username: user.username,
    email: user.email,
    role: user.role.name,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));
};

export const getUserById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: {
            id: BigInt(userId)
        },
        include: {
            role: true

        }
    });

    if (!user) {
        throw new Error("User not found");
    }

    return {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role.name,
        status: user.status,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}