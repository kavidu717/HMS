import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../src/config/env.js";

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL
});

const prisma = new PrismaClient({
  adapter
});

const main = async () => {
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  const adminRole = await prisma.role.upsert({
    where: {
      name: "ADMIN"
    },
    update: {},
    create: {
      name: "ADMIN",
      description: "Hospital system administrator",
      privileges: [
        "patient:read",
        "patient:create",
        "patient:update",
        "patient:delete",
        "appointment:read",
        "appointment:create",
        "appointment:update",
        "appointment:delete",
        "billing:read",
        "billing:create",
        "billing:update",
        "pharmacy:read",
        "pharmacy:create",
        "pharmacy:update",
        "laboratory:read",
        "laboratory:create",
        "laboratory:update",
        "staff:read",
        "staff:create",
        "staff:update"
      ]
    }
  });

  const adminUser = await prisma.user.upsert({
    where: {
      username: "admin"
    },
    update: {
      passwordHash,
      roleId: adminRole.id,
      status: "ACTIVE"
    },
    create: {
      username: "admin",
      email: "admin@hms.com",
      passwordHash,
      roleId: adminRole.id,
      status: "ACTIVE"
    }
  });

  console.log("Admin role created:", adminRole.name);
  console.log("Admin user created:", adminUser.username);
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });