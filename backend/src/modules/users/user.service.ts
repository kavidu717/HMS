import { prisma } from "../../config/prisma.js";
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

    return {
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        role: user.role.name,
        status: user.status,
        createdAt: user.createdAt,
    }


}