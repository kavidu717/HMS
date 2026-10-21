

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


export const getLaboratoryTestRequests = async () => {
  const requests = await prisma.laboratoryTestRequest.findMany({
    orderBy: {
      requestedAt: "desc",
    },
    include: {
      patient: true,
      doctor: true,
      laboratoryTest: true,
    },
  });

  return JSON.parse(
    JSON.stringify(requests, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
};

export const getLaboratoryTestRequestById = async (id: string) => {
  const laboratoryTestRequest =
    await prisma.laboratoryTestRequest.findUnique({
      where: {
        id: BigInt(id),
      },
      include: {
        patient: true,
        doctor: true,
        laboratoryTest: true,
      },
    });

  if (!laboratoryTestRequest) {
    throw new Error("LABORATORY_TEST_REQUEST_NOT_FOUND");
  }

  return JSON.parse(
    JSON.stringify(laboratoryTestRequest, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
};


export const collectLaboratoryTestSample = async (id: string) => {
  const requestId = BigInt(id);

  const laboratoryTestRequest =
    await prisma.laboratoryTestRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        status: true,
        sampleCollectedAt: true,
      },
    });

  if (!laboratoryTestRequest) {
    throw new Error("LABORATORY_TEST_REQUEST_NOT_FOUND");
  }

  if (laboratoryTestRequest.status !== "REQUESTED") {
    throw new Error("SAMPLE_COLLECTION_NOT_ALLOWED");
  }

  const updatedRequest = await prisma.laboratoryTestRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status: "SAMPLE_COLLECTED",
      sampleCollectedAt: new Date(),
    },
    include: {
      patient: true,
      doctor: true,
      laboratoryTest: true,
    },
  });

  return JSON.parse(
    JSON.stringify(updatedRequest, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
};

export const enterLaboratoryTestResult = async (
  id: string,
  result: string,
) => {
  const requestId = BigInt(id);

  const laboratoryTestRequest =
    await prisma.laboratoryTestRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (!laboratoryTestRequest) {
    throw new Error("LABORATORY_TEST_REQUEST_NOT_FOUND");
  }

  if (laboratoryTestRequest.status !== "SAMPLE_COLLECTED") {
    throw new Error("RESULT_ENTRY_NOT_ALLOWED");
  }

  const updatedRequest = await prisma.laboratoryTestRequest.update({
    where: {
      id: requestId,
    },
    data: {
      result,
      resultEnteredAt: new Date(),
      status: "RESULT_ENTERED",
    },
    include: {
      patient: true,
      doctor: true,
      laboratoryTest: true,
    },
  });

  return JSON.parse(
    JSON.stringify(updatedRequest, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
};


export const getLaboratoryReportData = async (id: string) => {
  const laboratoryTestRequest =
    await prisma.laboratoryTestRequest.findUnique({
      where: {
        id: BigInt(id),
      },
      include: {
        patient: true,
        doctor: true,
        laboratoryTest: true,
      },
    });

  if (!laboratoryTestRequest) {
    throw new Error("LABORATORY_TEST_REQUEST_NOT_FOUND");
  }

  if (
    laboratoryTestRequest.status !== "RESULT_ENTERED" ||
    !laboratoryTestRequest.result ||
    !laboratoryTestRequest.resultEnteredAt
  ) {
    throw new Error("LABORATORY_REPORT_NOT_READY");
  }

  return JSON.parse(
    JSON.stringify(laboratoryTestRequest, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
};
