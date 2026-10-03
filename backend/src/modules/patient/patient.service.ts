import { prisma } from "../../config/prisma.js";
import type { cratePatientInput, UpdatePatientInput } from "./patient.schema.js";

export const createPatient=async (input: cratePatientInput) => {

    const patientNumber=`PAT-${Date.now()}`

    const patient = await prisma.patient.create({
        data: {
            patientNumber,
            firstName: input.firstName,
            lastName: input.lastName,
            dateOfBirth: new Date(input.dateOfBirth),
            gender: input.gender,
            nic: input.nic || null,
            email: input.email || null,
            phone: input.phone,
            address: input.address || null,
            emergencyContactName: input.emergencyContactName || null,
            emergencyContactPhone: input.emergencyContactPhone || null,
            status: "ACTIVE",
        },
    });

    return {
        id: patient.id.toString(),
        patientNumber: patient.patientNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        nic: patient.nic,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        status: patient.status,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
    
    }

}

export const updatePatient=async (patientId:string,input:UpdatePatientInput) => {
      
    const id=BigInt(patientId)

    const existingPatient = await prisma.patient.findUnique({
        where: {
            id,
        },
    });

    if (!existingPatient) {
        throw new Error("Patient not found");
    }

    const updatedPatient = await prisma.patient.update({
        where: {
            id,
        },
        data: {
            ...(input.firstName !== undefined && { firstName: input.firstName }),
            ...(input.lastName !== undefined && { lastName: input.lastName }),
            ...(input.dateOfBirth !== undefined && { dateOfBirth: new Date(input.dateOfBirth) }),
            ...(input.gender !== undefined && { gender: input.gender }),
            ...(input.nic !== undefined && { nic: input.nic || null }),
            ...(input.email !== undefined && { email: input.email || null }),
            ...(input.phone !== undefined && { phone: input.phone }),
            ...(input.address !== undefined && { address: input.address || null }),
            ...(input.emergencyContactName !== undefined && { emergencyContactName: input.emergencyContactName || null }),
            ...(input.emergencyContactPhone !== undefined && { emergencyContactPhone: input.emergencyContactPhone || null }),
        },
    });

    return {
        id: updatedPatient.id.toString(),
        patientNumber: updatedPatient.patientNumber,
        firstName: updatedPatient.firstName,
        lastName: updatedPatient.lastName,
        dateOfBirth: updatedPatient.dateOfBirth,
        gender: updatedPatient.gender,
        nic: updatedPatient.nic,
        email: updatedPatient.email,
        phone: updatedPatient.phone,
        address: updatedPatient.address,
        emergencyContactName: updatedPatient.emergencyContactName,
        emergencyContactPhone: updatedPatient.emergencyContactPhone,
        status: updatedPatient.status,
        createdAt: updatedPatient.createdAt,
        updatedAt: updatedPatient.updatedAt,
    };
}

export const getPatientById = async (
  patientId: string
) => {
  const patient = await prisma.patient.findUnique({
    where: {
      id: BigInt(patientId)
    }
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  return {
    id: patient.id.toString(),
    patientNumber: patient.patientNumber,
    firstName: patient.firstName,
    lastName: patient.lastName,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    nic: patient.nic,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
    status: patient.status,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt
  };
};