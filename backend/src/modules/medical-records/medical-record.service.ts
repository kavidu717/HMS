import { prisma } from "../../config/prisma.js";
import { CreateMedicalRecordInput,UpdateMedicalRecordInput } from "./medical-record.schema.js";

export const createMedicalRecord= async (input: CreateMedicalRecordInput) => {
    
    const patientId = BigInt(input.patientId);

    const patient = await prisma.patient.findUnique({
        where: {
            id: patientId,
        },
    });

    if (!patient) {
        throw new Error("Patient not found");
    }

    const medicalRecord = await prisma.medicalRecord.create({
        data: {
            patientId,
            diagnosis: input.diagnosis ?? null,
            symptoms: input.symptoms ?? null,
            treatment: input.treatment ?? null,
            notes: input.notes ?? null,
            recordedAt: input.recordedAt
              ? new Date(input.recordedAt)
                : new Date(),
        },
    });
    return {
        id: medicalRecord.id.toString(),
        patientId: medicalRecord.patientId.toString(),
        diagnosis: medicalRecord.diagnosis,
        symptoms: medicalRecord.symptoms,
        treatment: medicalRecord.treatment,
        notes: medicalRecord.notes,
        recordedAt: medicalRecord.recordedAt,
        updatedAt: medicalRecord.updatedAt,
        createdAt: medicalRecord.createdAt,
    
    }
}


export const getMedicalRecordById = async (
  recordId: string
) => {
     const medicalRecord = await prisma.medicalRecord.findUnique({
    where: {
      id: BigInt(recordId)
    }
  });

  if (!medicalRecord) {
    throw new Error("Medical record not found");
  }

  return {
    id: medicalRecord.id.toString(),
    patientId: medicalRecord.patientId.toString(),
    diagnosis: medicalRecord.diagnosis,
    symptoms: medicalRecord.symptoms,
    treatment: medicalRecord.treatment,
    notes: medicalRecord.notes,
    recordedAt: medicalRecord.recordedAt,
    createdAt: medicalRecord.createdAt,
    updatedAt: medicalRecord.updatedAt
  };
};

     export const updateMedicalRecord = async (
  recordId: string,
  input: UpdateMedicalRecordInput
) => {
  const id = BigInt(recordId);

  const existingRecord = await prisma.medicalRecord.findUnique({
    where: {
      id
    }
  });

  if (!existingRecord) {
    throw new Error("Medical record not found");
  }

  const medicalRecord = await prisma.medicalRecord.update({
    where: {
      id
    },
    data: {
      ...(input.diagnosis !== undefined && { diagnosis: input.diagnosis }),
      ...(input.symptoms !== undefined && { symptoms: input.symptoms }),
      ...(input.treatment !== undefined && { treatment: input.treatment }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.recordedAt !== undefined && {
        recordedAt: new Date(input.recordedAt)
      })
    }
  });

  return {
    id: medicalRecord.id.toString(),
    patientId: medicalRecord.patientId.toString(),
    diagnosis: medicalRecord.diagnosis,
    symptoms: medicalRecord.symptoms,
    treatment: medicalRecord.treatment,
    notes: medicalRecord.notes,
    recordedAt: medicalRecord.recordedAt,
    createdAt: medicalRecord.createdAt,
    updatedAt: medicalRecord.updatedAt
  };
};

export const getPatientMedicalHistory = async (
  patientId: string
) => {
  const id = BigInt(patientId);

  const patient = await prisma.patient.findUnique({
    where: {
      id
    }
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  const medicalRecords = await prisma.medicalRecord.findMany({
    where: {
      patientId: id
    },
    orderBy: {
      recordedAt: "desc"
    }
  });

  return medicalRecords.map((record) => ({
    id: record.id.toString(),
    patientId: record.patientId.toString(),
    diagnosis: record.diagnosis,
    symptoms: record.symptoms,
    treatment: record.treatment,
    notes: record.notes,
    recordedAt: record.recordedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }));
};