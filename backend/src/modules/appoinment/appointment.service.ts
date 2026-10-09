import { prisma } from "../../config/prisma.js"

import { CreateAppointmentInput,RescheduleAppointmentInput  } from "./appointment.schema.js"




export const createAppointment = async (input: CreateAppointmentInput) => {
   
    const patient= await prisma.patient.findUnique({
        where: {
            id: BigInt(input.patientId)
        }
    })

    if(!patient){
        throw new Error("Patient not found")
    }

    if(patient.status !== "ACTIVE"){
        throw new Error("Patient is not active")
    }

    const doctor= await prisma.doctor.findUnique({
        where: {
            id: BigInt(input.doctorId)
        }
    })

    if(!doctor){
        throw new Error("Doctor not found")
    }

    if(doctor.status !== "ACTIVE"){
        throw new Error("Doctor is not active")
    }

    const dateParts = input.appointmentDate.split("-");

if (dateParts.length !== 3) {
  throw new Error("Invalid appointment date");
}

const year = Number(dateParts[0]);
const month = Number(dateParts[1]);
const day = Number(dateParts[2]);

if (
  !Number.isInteger(year) ||
  !Number.isInteger(month) ||
  !Number.isInteger(day)
) {
  throw new Error("Invalid appointment date");
}

const appointmentDate = new Date(
  Date.UTC(year, month - 1, day)
);

if (
  appointmentDate.getUTCFullYear() !== year ||
  appointmentDate.getUTCMonth() !== month - 1 ||
  appointmentDate.getUTCDate() !== day
) {
  throw new Error("Invalid appointment date");
}


   const today = new Date();
  const todayDate = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
  );
  
   if (appointmentDate < todayDate) {
    throw new Error("Appointment date cannot be in the past");
    }

   const dayOfWeek = appointmentDate.getUTCDay();
   
   
    const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId: doctor.id,
      dayOfWeek,
      status: "ACTIVE"
    }
  });


   const matchingSchedule = schedules.some(
    (schedule) =>
      input.startTime >= schedule.startTime &&
      input.endTime <= schedule.endTime
  );

    if (!matchingSchedule) {
    throw new Error(
      "Doctor is not available during the selected time"
    );
  }

  const overlappingAppointment =
    await prisma.appointment.findFirst({
      where: {
        doctorId: doctor.id,
        appointmentDate,
        status: {
          in: ["SCHEDULED", "CONFIRMED"]
        },
        startTime: {
          lt: input.endTime
        },
        endTime: {
          gt: input.startTime
        }
      }
    });


    if (overlappingAppointment) {
    throw new Error(
      "Doctor already has an appointment during this time"
    );
  }

   const existingAppointment =
    await prisma.appointment.findUnique({
      where: {
        appointmentNumber: input.appointmentNumber
      }
    });

  if (existingAppointment) {
    throw new Error("Appointment number already exists");
  }

    const appointment = await prisma.appointment.create({
    data: {
      appointmentNumber: input.appointmentNumber,
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      reason: input.reason ?? null,
      notes: input.notes ?? null,
      status: "SCHEDULED"
    }
  });

   return {
    id: appointment.id.toString(),
    appointmentNumber: appointment.appointmentNumber,
    patientId: appointment.patientId.toString(),
    doctorId: appointment.doctorId.toString(),
    appointmentDate: input.appointmentDate,
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    reason: appointment.reason,
    notes: appointment.notes,
    status: appointment.status,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt
  };

}



const serializeBigInt = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [
        key,
        serializeBigInt(val),
      ]),
    );
  }

  return value;
};

export const getAllAppointments = async () => {
  const appointments = await prisma.appointment.findMany({
    orderBy: [
      {
        appointmentDate: "desc",
      },
      {
        startTime: "asc",
      },
    ],
    include: {
      patient: true,
      doctor: true,
    },
  });

  return appointments.map((appointment) =>
    serializeBigInt(appointment),
  );
};


export const getAppointmentById = async (id: string) => {
  const appointmentId = BigInt(id);

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  return serializeBigInt(appointment);
};

export const rescheduleAppointment = async (
  id: string,
  input: RescheduleAppointmentInput,
) => {
  // 1. Validate appointment ID
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new Error("Invalid appointment ID");
  }

  const appointmentId = BigInt(id);

  // 2. Find existing appointment
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // 3. Prevent rescheduling completed/cancelled appointments
  if (
    ["CANCELLED", "COMPLETED", "NO_SHOW"].includes(
      appointment.status,
    )
  ) {
    throw new Error(
      `Cannot reschedule an appointment with status ${appointment.status}`,
    );
  }

  // 4. Validate date parts
  const dateParts = input.appointmentDate.split("-");

  if (dateParts.length !== 3) {
    throw new Error("Invalid appointment date");
  }

  const year = Number(dateParts[0]);
  const month = Number(dateParts[1]);
  const day = Number(dateParts[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new Error("Invalid appointment date");
  }

  // 5. Create and validate appointment date
  const appointmentDate = new Date(
    Date.UTC(year, month - 1, day),
  );

  if (
    appointmentDate.getUTCFullYear() !== year ||
    appointmentDate.getUTCMonth() !== month - 1 ||
    appointmentDate.getUTCDate() !== day
  ) {
    throw new Error("Invalid appointment date");
  }

  // 6. Prevent past appointments
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (appointmentDate.getTime() < today.getTime()) {
    throw new Error("Appointment date cannot be in the past");
  }

  // 7. Validate start and end times
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (
    !timeRegex.test(input.startTime) ||
    !timeRegex.test(input.endTime)
  ) {
    throw new Error("Invalid appointment time");
  }

  if (input.startTime >= input.endTime) {
    throw new Error("End time must be after start time");
  }

  // 8. Find doctor's active schedule
  const dayOfWeek = appointmentDate.getUTCDay();

  const schedule = await prisma.doctorSchedule.findFirst({
    where: {
      doctorId: appointment.doctorId,
      dayOfWeek,
      status: "ACTIVE",
      startTime: {
        lte: input.startTime,
      },
      endTime: {
        gte: input.endTime,
      },
    },
  });

  if (!schedule) {
    throw new Error(
      "Doctor is not available during the selected time",
    );
  }

  // 9. Prevent overlapping appointments
  const overlappingAppointment =
    await prisma.appointment.findFirst({
      where: {
        id: {
          not: appointmentId,
        },
        doctorId: appointment.doctorId,
        appointmentDate,
        status: {
          in: ["SCHEDULED", "CONFIRMED"],
        },
        startTime: {
          lt: input.endTime,
        },
        endTime: {
          gt: input.startTime,
        },
      },
    });

  if (overlappingAppointment) {
    throw new Error(
      "Doctor already has an appointment during the selected time",
    );
  }

  // 10. Update appointment
  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });

  // 11. Convert BigInt values for JSON response
  return serializeBigInt(updatedAppointment);
};

export const cancelAppointment = async (id: string) => {
  // 1. Validate appointment ID
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new Error("Invalid appointment ID");
  }

  const appointmentId = BigInt(id);

  // 2. Find existing appointment
  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // 3. Prevent cancellation of already cancelled appointments
  if (appointment.status === "CANCELLED") {
    throw new Error("Appointment is already cancelled");
  }

  // 4. Prevent cancellation of completed or no-show appointments
  if (["COMPLETED", "NO_SHOW"].includes(appointment.status)) {
    throw new Error(
      `Cannot cancel an appointment with status ${appointment.status}`,
    );
  }

  // 5. Update appointment status instead of deleting it
  const cancelledAppointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status: "CANCELLED",
    },
    include: {
      patient: true,
      doctor: true,
    },
  });

  // 6. Serialize BigInt values
  return serializeBigInt(cancelledAppointment);
};

export const updateAppointmentStatus = async (
  id: string,
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW",
) => {
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new Error("Invalid appointment ID");
  }

  const appointmentId = BigInt(id);

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
  });

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.status === "CANCELLED") {
    throw new Error("Cannot update a cancelled appointment");
  }

  if (appointment.status === "COMPLETED") {
    throw new Error("Cannot update a completed appointment");
  }

  if (appointment.status === "NO_SHOW") {
    throw new Error("Cannot update a no-show appointment");
  }

  const updatedAppointment = await prisma.appointment.update({
    where: {
      id: appointmentId,
    },
    data: {
      status,
    },
    include: {
      patient: true,
      doctor: true,
    },
  });

  return serializeBigInt(updatedAppointment);
};