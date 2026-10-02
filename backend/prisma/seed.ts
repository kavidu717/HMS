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
    update: {
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
        "staff:update",
        "user:read",
        "user:create",
        "user:update"
      ]
    },
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
        "staff:update",
        "user:read",
        "user:create",
        "user:update"
      ]
    }
  });

  const doctorRole = await prisma.role.upsert({
    where: {
      name: "DOCTOR"
    },
    update: {},
    create: {
      name: "DOCTOR",
      description: "Hospital doctor",
      privileges: [
        "patient:read",
        "medical_record:read",
        "medical_record:create",
        "medical_record:update",
        "prescription:create",
        "appointment:read"
      ]
    }
  });

  const nurseRole = await prisma.role.upsert({
    where: {
      name: "NURSE"
    },
    update: {},
    create: {
      name: "NURSE",
      description: "Hospital nurse",
      privileges: [
        "patient:read",
        "medical_record:read",
        "appointment:read"
      ]
    }
  });

  const receptionistRole = await prisma.role.upsert({
    where: {
      name: "RECEPTIONIST"
    },
    update: {},
    create: {
      name: "RECEPTIONIST",
      description: "Hospital receptionist",
      privileges: [
        "patient:read",
        "patient:create",
        "patient:update",
        "appointment:read",
        "appointment:create",
        "appointment:update",
        "appointment:delete",
        "billing:read",
        "billing:create"
      ]
    }
  });

  const laboratoryStaffRole = await prisma.role.upsert({
    where: {
      name: "LABORATORY_STAFF"
    },
    update: {},
    create: {
      name: "LABORATORY_STAFF",
      description: "Hospital laboratory staff",
      privileges: [
        "patient:read",
        "laboratory:read",
        "laboratory:create",
        "laboratory:update"
      ]
    }
  });

  const pharmacistRole = await prisma.role.upsert({
    where: {
      name: "PHARMACIST"
    },
    update: {},
    create: {
      name: "PHARMACIST",
      description: "Hospital pharmacist",
      privileges: [
        "patient:read",
        "pharmacy:read",
        "pharmacy:create",
        "pharmacy:update"
      ]
    }
  });

  const accountantRole = await prisma.role.upsert({
    where: {
      name: "ACCOUNTANT"
    },
    update: {},
    create: {
      name: "ACCOUNTANT",
      description: "Hospital accountant",
      privileges: [
        "patient:read",
        "billing:read",
        "billing:create",
        "billing:update"
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
  console.log("Doctor role created:", doctorRole.name);
  console.log("Nurse role created:", nurseRole.name);
  console.log("Receptionist role created:", receptionistRole.name);
  console.log("Laboratory staff role created:", laboratoryStaffRole.name);
  console.log("Pharmacist role created:", pharmacistRole.name);
  console.log("Accountant role created:", accountantRole.name);
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