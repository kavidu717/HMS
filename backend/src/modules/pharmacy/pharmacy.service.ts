
import { prisma } from "../../config/prisma.js";
import type { CreateMedicineBatchInput, CreateMedicineInput, CreateMedicineVariantInput, StockAdjustmentInput } from "./pharmacy.validation.js";

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


export const createMedicineVariantService = async (
  medicineId: bigint,
  data: CreateMedicineVariantInput,
) => {
  const medicine = await prisma.medicine.findUnique({
    where: {
      id: medicineId,
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  return prisma.medicineVariant.create({
    data: {
      medicineId,
      strength: data.strength,
      dosageForm: data.dosageForm,
      unit: data.unit,
      reorderLevel: data.reorderLevel,
    },
  });
};

export const createMedicineBatchService = async (
  medicineVariantId: bigint,
  data: CreateMedicineBatchInput,
) => {
  const variant = await prisma.medicineVariant.findUnique({
    where: {
      id: medicineVariantId,
    },
  });

  if (!variant) {
    throw new Error("Medicine variant not found");
  }

  if (!variant.isActive || !variant.medicineId) {
    throw new Error("Medicine variant is inactive");
  }

  if (data.sellingPrice < data.purchasePrice) {
    throw new Error("Selling price cannot be less than purchase price");
  }

  const existingBatch = await prisma.medicineBatch.findUnique({
    where: {
      medicineVariantId_batchNumber: {
        medicineVariantId,
        batchNumber: data.batchNumber,
      },
    },
  });

  if (existingBatch) {
    throw new Error("Batch number already exists for this medicine variant");
  }

  return prisma.$transaction(async (tx) => {
    const batch = await tx.medicineBatch.create({
      data: {
        medicineVariantId,
        batchNumber: data.batchNumber,
        quantity: data.quantity,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        expiryDate: new Date(`${data.expiryDate}T00:00:00.000Z`),
      },
    });

    await tx.stockMovement.create({
      data: {
        medicineBatchId: batch.id,
        movementType: "RECEIPT",
        quantityChange: data.quantity,
        reason: "Initial stock",
        referenceNumber: data.batchNumber,
      },
    });

    return batch;
  });
};

export const getVariantStockService = async (medicineVariantId: bigint) => {
  const variant = await prisma.medicineVariant.findUnique({
    where: {
      id: medicineVariantId,
    },
    include: {
      medicine: true,
      batches: {
        orderBy: {
          expiryDate: "asc",
        },
      },
    },
  });

  if (!variant) {
    throw new Error("Medicine variant not found");
  }

  const totalStock = variant.batches.reduce(
    (total, batch) => total + batch.quantity,
    0,
  );

  return {
    medicineVariantId: variant.id.toString(),
    medicineName: variant.medicine.medicineName,
    medicineCode: variant.medicine.medicineCode,
    brandName: variant.medicine.brandName,
    strength: variant.strength,
    dosageForm: variant.dosageForm,
    unit: variant.unit,
    reorderLevel: variant.reorderLevel,
    totalStock,
    lowStock: totalStock <= variant.reorderLevel,
    batches: variant.batches.map((batch) => ({
      id: batch.id.toString(),
      batchNumber: batch.batchNumber,
      quantity: batch.quantity,
      purchasePrice: batch.purchasePrice.toString(),
      sellingPrice: batch.sellingPrice.toString(),
      expiryDate: batch.expiryDate.toISOString().slice(0, 10),
      receivedAt: batch.receivedAt.toISOString(),
    })),
  };
};


export const adjustMedicineStockService = async (
  batchId: bigint,
  data: StockAdjustmentInput,
) => {
  return prisma.$transaction(async (tx) => {
    const batch = await tx.medicineBatch.findUnique({
      where: {
        id: batchId,
      },
    });

    if (!batch) {
      throw new Error("Medicine batch not found");
    }

    let quantityChange: number;
    let newQuantity: number;

    if (data.movementType === "RECEIPT") {
      quantityChange = data.quantity;
      newQuantity = batch.quantity + data.quantity;
    } else if (data.movementType === "ISSUE") {
      quantityChange = -data.quantity;
      newQuantity = batch.quantity - data.quantity;

      if (newQuantity < 0) {
        throw new Error("Insufficient stock");
      }
    } else {
      quantityChange = data.quantity - batch.quantity;
      newQuantity = data.quantity;
    }

    const updatedBatch = await tx.medicineBatch.update({
      where: {
        id: batchId,
      },
      data: {
        quantity: newQuantity,
      },
    });

    await tx.stockMovement.create({
      data: {
        medicineBatchId: batchId,
        movementType: data.movementType,
        quantityChange,
        reason: data.reason,
        ...(data.referenceNumber !== undefined && {
          referenceNumber: data.referenceNumber,
        }),
      },
    });

    return updatedBatch;
  });
};



export const getStockMovementHistoryService = async (
  medicineBatchId: bigint,
) => {
  const batch = await prisma.medicineBatch.findUnique({
    where: {
      id: medicineBatchId,
    },
    select: {
      id: true,
      batchNumber: true,
    },
  });

  if (!batch) {
    throw new Error("Medicine batch not found");
  }

  const movements = await prisma.stockMovement.findMany({
    where: {
      medicineBatchId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    batchId: batch.id.toString(),
    batchNumber: batch.batchNumber,
    movements: movements.map((movement) => ({
      id: movement.id.toString(),
      movementType: movement.movementType,
      quantityChange: movement.quantityChange,
      reason: movement.reason,
      referenceNumber: movement.referenceNumber,
      createdAt: movement.createdAt.toISOString(),
    })),
  };
};

export const getExpiryMonitoringService = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextThirtyDays = new Date(today);
  nextThirtyDays.setDate(nextThirtyDays.getDate() + 30);

  const batches = await prisma.medicineBatch.findMany({
    where: {
      quantity: {
        gt: 0,
      },
      expiryDate: {
        lte: nextThirtyDays,
      },
    },
    include: {
      medicineVariant: {
        include: {
          medicine: true,
        },
      },
    },
    orderBy: {
      expiryDate: "asc",
    },
  });

  return batches.map((batch) => {
    const expiryDate = batch.expiryDate;
    const isExpired = expiryDate < today;

    return {
      batchId: batch.id.toString(),
      batchNumber: batch.batchNumber,
      medicineName: batch.medicineVariant.medicine.medicineName,
      medicineCode: batch.medicineVariant.medicine.medicineCode,
      strength: batch.medicineVariant.strength,
      dosageForm: batch.medicineVariant.dosageForm,
      quantity: batch.quantity,
      expiryDate: expiryDate.toISOString().slice(0, 10),
      status: isExpired ? "EXPIRED" : "EXPIRING_SOON",
    };
  });
};