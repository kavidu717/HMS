
import { prisma } from "../../config/prisma.js";
import type { CreateMedicineInput } from "./pharmacy.validation.js";

export const createMedicineService = async (
  data: CreateMedicineInput,
) => {
  const existingMedicine = await prisma.medicine.findUnique({
    where: {
      medicineCode: data.medicineCode,
    },
  });

  if (existingMedicine) {
    throw new Error("Medicine code already exists");
  }

  return prisma.medicine.create({
    data: {
      medicineCode: data.medicineCode,
      medicineName: data.medicineName,
      brandName: data.brandName,
      genericName: data.genericName,
      category: data.category,
      ...(data.description !== undefined && {
        description: data.description,
      }),
    },
  });
};

export const getAllMedicinesService = async () => {
  return prisma.medicine.findMany({
    include: {
      variants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
