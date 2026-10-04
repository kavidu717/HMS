import { prisma } from "../../config/prisma.js";

export const createDepartment = async (data: {
  name: string;
  description?: string;
  status?: string;
}) => {
  const existingDepartment = await prisma.department.findUnique({
    where: {
      name: data.name
    }
  });

  if (existingDepartment) {
    throw new Error("Department already exists");
  }

  const department = await prisma.department.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      status: data.status ?? "ACTIVE"
    }
  });

  return department;
};


export const getDepartments = async () => {
  const departments = await prisma.department.findMany({
    orderBy: {
      name: "asc"
    }
  });

  return departments;
};