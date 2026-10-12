

import { prisma } from "../../config/prisma.js";
import type { CreateLaboratoryTestRequestInput } from "./laboratory-test-request.schema.js";

export const createLaboratoryTestRequest = async (
  data: CreateLaboratoryTestRequestInput,
) => {
  const patientId = BigInt(data.patientId);
  const doctorId = BigInt(data.doctorId);
  const laboratoryTestId = BigInt(data.laboratoryTestId);

  const [patient, doctor, laboratoryTest] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true },
    }),
    prisma.doctor.findUnique({
      where: { id: doctorId },
      select: { id: true },
    }),
    prisma.laboratoryTest.findUnique({
      where: { id: laboratoryTestId },
      select: { id: true, isActive: true },
    }),
  ]);

  if (!patient) {
    throw new Error("PATIENT_NOT_FOUND");
  }

  if (!doctor) {
    throw new Error("DOCTOR_NOT_FOUND");
  }

  if (!laboratoryTest) {
    throw new Error("LABORATORY_TEST_NOT_FOUND");
  }

  if (!laboratoryTest.isActive) {
    throw new Error("LABORATORY_TEST_INACTIVE");
  }

  const requestNumber = `LTR-${Date.now()}-${Math.floor(
    Math.random() * 1000,
  )
    .toString()
    .padStart(3, "0")}`;

  const laboratoryTestRequest = await prisma.laboratoryTestRequest.create({
    data: {
      requestNumber,
      patientId,
      doctorId,
      laboratoryTestId,
    },
    include: {
      patient: true,
      doctor: true,
      laboratoryTest: true,
    },
  });

    
return JSON.parse(
  JSON.stringify(laboratoryTestRequest, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value,
  ),
);

};
