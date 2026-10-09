import { prisma } from "../../config/prisma.js"

import { CreateAppointmentInput } from "./appointment.schema.js"




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