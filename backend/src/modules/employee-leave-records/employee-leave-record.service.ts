
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../config/prisma.js";

const serializeBigInt = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (_key, nestedValue) =>
      typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue,
    ),
  ) as T;

export const createEmployeeLeaveRecord = async (data: {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
}) => {
  const employee = await prisma.employee.findUnique({
    where: {
      id: BigInt(data.employeeId),
    },
    select: {
      id: true,
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const leaveRecord = await prisma.employeeLeaveRecord.create({
    data: {
      employeeId: BigInt(data.employeeId),
      leaveType: data.leaveType,
      startDate: new Date(`${data.startDate}T00:00:00.000Z`),
      endDate: new Date(`${data.endDate}T00:00:00.000Z`),
      ...(data.reason !== undefined && {
        reason: data.reason,
      }),
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return serializeBigInt(leaveRecord);
};

export const getAllEmployeeLeaveRecords = async (filters: {
  employeeId?: string;
  status?: string;
}) => {
  const where: Prisma.EmployeeLeaveRecordWhereInput = {};

  if (filters.employeeId) {
    where.employeeId = BigInt(filters.employeeId);
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const leaveRecords = await prisma.employeeLeaveRecord.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
      approver: {
        select: {
          id: true,
        },
      },
    },
  });

  return serializeBigInt(leaveRecords);
};

export const getEmployeeLeaveRecordById = async (id: string) => {
  const leaveRecord = await prisma.employeeLeaveRecord.findUnique({
    where: {
      id: BigInt(id),
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
      approver: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!leaveRecord) {
    throw new Error("Leave record not found");
  }

  return serializeBigInt(leaveRecord);
};

export const updateEmployeeLeaveRecord = async (
  id: string,
  data: {
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    reason?: string | null;
    status?: "PENDING" | "APPROVED" | "REJECTED";
  },
) => {
  const recordId = BigInt(id);
  const currentRecord = await prisma.employeeLeaveRecord.findUnique({
    where: { id: recordId },
    select: { startDate: true, endDate: true },
  });

  if (!currentRecord) {
    throw new Error("Leave record not found");
  }

  const startDate = data.startDate
    ? new Date(`${data.startDate}T00:00:00.000Z`)
    : currentRecord.startDate;
  const endDate = data.endDate
    ? new Date(`${data.endDate}T00:00:00.000Z`)
    : currentRecord.endDate;

  if (endDate < startDate) {
    throw new Error("End date cannot be earlier than start date");
  }

  const updatedRecord = await prisma.employeeLeaveRecord.update({
    where: { id: recordId },
    data: {
      ...(data.leaveType !== undefined && { leaveType: data.leaveType }),
      ...(data.startDate !== undefined && { startDate }),
      ...(data.endDate !== undefined && { endDate }),
      ...(data.reason !== undefined && { reason: data.reason }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: {
      employee: {
        select: {
          id: true,
          employeeNumber: true,
          firstName: true,
          lastName: true,
        },
      },
      approver: {
        select: { id: true },
      },
    },
  });

  return serializeBigInt(updatedRecord);
};
