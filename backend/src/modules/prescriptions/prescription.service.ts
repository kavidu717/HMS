import { prisma } from "../../config/prisma.js";
import type {
  CreatePrescriptionInput,
  UpdatePrescriptionInput
} from "./prescription.schema.js";

const serializePrescription = (prescription: {
  id: bigint;
  prescriptionNumber: string;
  patientId: bigint;
  doctorId: bigint;
  medicalRecordId: bigint | null;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number | null;
  instructions: string | null;
  status: string;
  prescribedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: prescription.id.toString(),
  prescriptionNumber: prescription.prescriptionNumber,
  patientId: prescription.patientId.toString(),
  doctorId: prescription.doctorId.toString(),
  medicalRecordId:
    prescription.medicalRecordId?.toString() ?? null,
  medicineName: prescription.medicineName,
  dosage: prescription.dosage,
  frequency: prescription.frequency,
  duration: prescription.duration,
  quantity: prescription.quantity,
  instructions: prescription.instructions,
  status: prescription.status,
  prescribedAt: prescription.prescribedAt,
  createdAt: prescription.createdAt,
  updatedAt: prescription.updatedAt
});

export const createPrescription = async (
  input: CreatePrescriptionInput
) => {
  const patientId = BigInt(input.patientId);
  const doctorId = BigInt(input.doctorId);

  const medicalRecordId = input.medicalRecordId
    ? BigInt(input.medicalRecordId)
    : undefined;

  const patient = await prisma.patient.findUnique({
    where: { id: patientId }
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId }
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  if (doctor.status !== "ACTIVE") {
    throw new Error("Doctor is not active");
  }

  if (medicalRecordId !== undefined) {
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: medicalRecordId }
    });

    if (!medicalRecord) {
      throw new Error("Medical record not found");
    }

    if (medicalRecord.patientId !== patientId) {
      throw new Error(
        "Medical record does not belong to this patient"
      );
    }
  }

  const prescription = await prisma.prescription.create({
    data: {
      prescriptionNumber: input.prescriptionNumber,
      patientId,
      doctorId,
      ...(medicalRecordId !== undefined && {
        medicalRecordId
      }),
      medicineName: input.medicineName,
      dosage: input.dosage,
      frequency: input.frequency,
      duration: input.duration,
      quantity: input.quantity ?? null,
      instructions: input.instructions ?? null
    }
  });

  return serializePrescription(prescription);
};

export const getAllPrescriptions = async () => {
  const prescriptions = await prisma.prescription.findMany({
    orderBy: {
      prescribedAt: "desc"
    }
  });

  return prescriptions.map(serializePrescription);
};

export const getPrescriptionById = async (
  prescriptionId: string
) => {
  const prescription = await prisma.prescription.findUnique({
    where: {
      id: BigInt(prescriptionId)
    }
  });

  if (!prescription) {
    throw new Error("Prescription not found");
  }

  return serializePrescription(prescription);
};

export const getPatientPrescriptions = async (
  patientId: string
) => {
  const id = BigInt(patientId);

  const patient = await prisma.patient.findUnique({
    where: { id }
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const prescriptions = await prisma.prescription.findMany({
    where: {
      patientId: id
    },
    orderBy: {
      prescribedAt: "desc"
    }
  });

  return prescriptions.map(serializePrescription);
};

export const updatePrescription = async (
  prescriptionId: string,
  input: UpdatePrescriptionInput
) => {
  const id = BigInt(prescriptionId);

  const existingPrescription =
    await prisma.prescription.findUnique({
      where: { id }
    });

  if (!existingPrescription) {
    throw new Error("Prescription not found");
  }

  if (existingPrescription.status !== "ACTIVE") {
    throw new Error(
      "Only active prescriptions can be updated"
    );
  }

  const prescription = await prisma.prescription.update({
    where: { id },
    data: {
      ...(input.medicineName !== undefined && {
        medicineName: input.medicineName
      }),
      ...(input.dosage !== undefined && {
        dosage: input.dosage
      }),
      ...(input.frequency !== undefined && {
        frequency: input.frequency
      }),
      ...(input.duration !== undefined && {
        duration: input.duration
      }),
      ...(input.quantity !== undefined && {
        quantity: input.quantity
      }),
      ...(input.instructions !== undefined && {
        instructions: input.instructions
      })
    }
  });

  return serializePrescription(prescription);
};

export const updatePrescriptionStatus = async (
  prescriptionId: string,
  status: "ACTIVE" | "COMPLETED" | "CANCELLED"
) => {
  const id = BigInt(prescriptionId);

  const existingPrescription =
    await prisma.prescription.findUnique({
      where: { id }
    });

  if (!existingPrescription) {
    throw new Error("Prescription not found");
  }

  if (existingPrescription.status === "CANCELLED") {
    throw new Error(
      "Cancelled prescriptions cannot be updated"
    );
  }

  const prescription = await prisma.prescription.update({
    where: { id },
    data: { status }
  });

  return serializePrescription(prescription);
};