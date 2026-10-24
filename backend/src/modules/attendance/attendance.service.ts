import { prisma } from "../../config/prisma.js";

interface CreateAttendanceData {
  employeeId: bigint;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  status?: "PRESENT" | "ABSENT" | "LATE";
}

interface UpdateAttendanceData {
  checkIn?: Date | null;
  checkOut?: Date | null;
  status?: "PRESENT" | "ABSENT" | "LATE";
}

export const createAttendance = async (
  data: CreateAttendanceData,
) => {
  const employee = await prisma.employee.findUnique({
    where: { id: data.employeeId },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: data.employeeId,
        date: data.date,
      },
    },
  });

  if (existingAttendance) {
    throw new Error(
      "Attendance already exists for this employee on this date",
    );
  }

  if (data.checkIn && data.checkOut && data.checkOut < data.checkIn) {
    throw new Error(
      "Check-out time cannot be earlier than check-in time",
    );
  }

  return prisma.attendance.create({
    data: {
      employeeId: data.employeeId,
      date: data.date,
      ...(data.checkIn !== undefined && {
        checkIn: data.checkIn,
      }),
      ...(data.checkOut !== undefined && {
        checkOut: data.checkOut,
      }),
      status: data.status ?? "PRESENT",
    },
    include: {
      employee: true,
    },
  });
};


export const getAttendances = async () => {
  const attendances = await prisma.attendance.findMany({
    orderBy: [{ date: "desc" }, { id: "desc" }],
    include: {
      employee: true,
    },
  });

  return attendances;
};

export const getAttendanceById = async (id: bigint) => {
  const attendance = await prisma.attendance.findUnique({
    where: { id },
    include: {
      employee: true,
    },
  });

  if (!attendance) {
    throw new Error("Attendance not found");
  }

  return attendance;
};

export const updateAttendance = async (
  id: bigint,
  data: UpdateAttendanceData,
) => {
  const attendance = await prisma.attendance.findUnique({
    where: { id },
  });

  if (!attendance) {
    throw new Error("Attendance not found");
  }

  const checkIn =
    data.checkIn !== undefined ? data.checkIn : attendance.checkIn;

  const checkOut =
    data.checkOut !== undefined ? data.checkOut : attendance.checkOut;

  if (checkIn && checkOut && checkOut < checkIn) {
    throw new Error("Check-out time cannot be earlier than check-in time");
  }

  return prisma.attendance.update({
    where: { id },
    data,
    include: {
      employee: true,
    },
  });
};

export const getAttendancesByEmployee = async (
  employeeId: bigint,
) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  return prisma.attendance.findMany({
    where: { employeeId },
    orderBy: { date: "desc" },
    include: {
      employee: true,
    },
  });
};