import { prisma } from "../../config/prisma.js"


export const createDoctor = async (data: {
   
    userId: bigint,
    doctorNumber: string,
    firstName: string,
    lastName: string,
    specialization: string,
    phone: string,
    email: string,
    departmentId?: bigint;

    status?: string
})=>{

    const user=await prisma.user.findUnique({
        where:{
            id:data.userId
        }
    })

    if(!user){
        throw new Error("User not found")
    }

    const existingDoctor=await prisma.doctor.findUnique({
        where:{
            userId:data.userId
        }
    })

    if(existingDoctor){
        throw new Error("Doctor already exists for this user")
    }

    const existingDoctorNumber=await prisma.doctor.findUnique({
        where:{
            doctorNumber:data.doctorNumber
        }
    })

    if(existingDoctorNumber){
        throw new Error("Doctor number already exists")
    }

     if (data.departmentId !== undefined) {
    const department = await prisma.department.findUnique({
      where: {
        id: BigInt(data.departmentId)
      }
    });

    if (!department) {
      throw new Error("Department not found");
    }
    }

    const doctor = await prisma.doctor.create({
    data: {
      userId: data.userId,
      doctorNumber: data.doctorNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      specialization: data.specialization,
      phone: data.phone,
      email: data.email,
      departmentId: data.departmentId ?? null,
      status: data.status ?? "ACTIVE"
    }
   });

  return doctor;

}



export const getDoctors = async () => {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: {
        include: {
          role: true
        }
      },
      department: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return doctors.map((doctor) => ({
    id: doctor.id.toString(),
    userId: doctor.userId.toString(),
    username: doctor.user.username,
    userEmail: doctor.user.email,
    role: doctor.user.role.name,
    doctorNumber: doctor.doctorNumber,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    specialization: doctor.specialization,
    phone: doctor.phone,
    email: doctor.email,
    department: doctor.department
      ? {
          id: doctor.department.id.toString(),
          name: doctor.department.name
        }
      : null,
    status: doctor.status,
    createdAt: doctor.createdAt,
    updatedAt: doctor.updatedAt
  }));
};


export const assignDepartment = async (
  doctorId: bigint,
  departmentId: bigint
) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId
    }
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const department = await prisma.department.findUnique({
    where: {
      id: departmentId
    }
  });

  if (!department) {
    throw new Error("Department not found");
  }

  const updatedDoctor = await prisma.doctor.update({
    where: {
      id: doctorId
    },
    data: {
      departmentId: departmentId
    }
  });

  return updatedDoctor;
};


export const createDoctorSchedule = async (data: {
  doctorId: bigint;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  status?: string;
}) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: data.doctorId
    }
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const schedule = await prisma.doctorSchedule.create({
    data: {
      doctorId: data.doctorId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      status: data.status ?? "ACTIVE"
    }
  });

  return schedule;
};

export const getDoctorSchedules = async (doctorId: bigint) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId
    }
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId: doctorId
    },
    orderBy: {
      dayOfWeek: "asc"
    }
  });

  return schedules;
};

export const updateDoctorSchedule = async (
  doctorId: bigint,
  scheduleId: bigint,
  data: {
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    status?: string;
  }
) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId
    }
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const schedule = await prisma.doctorSchedule.findFirst({
    where: {
      id: scheduleId,
      doctorId: doctorId
    }
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const updatedSchedule = await prisma.doctorSchedule.update({
    where: {
      id: scheduleId
    },
    data
  });

  return updatedSchedule;
};


export const deleteDoctorSchedule = async (
  doctorId: bigint,
  scheduleId: bigint
) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId
    }
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const schedule = await prisma.doctorSchedule.findFirst({
    where: {
      id: scheduleId,
      doctorId: doctorId
    }
  });

  if (!schedule) {
    throw new Error("Schedule not found");
  }

  await prisma.doctorSchedule.delete({
    where: {
      id: scheduleId
    }
  });
};



export const getDoctorAvailability = async (
  id: string,
  date: string,
) => {
  // 1. Validate doctor ID
  if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
    throw new Error("Invalid doctor ID");
  }

  // 2. Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const [year, month, day] = date.split("-").map(Number);

  const appointmentDate = new Date(
    Date.UTC(year!, month! - 1, day!),
  );

  if (
    appointmentDate.getUTCFullYear() !== year ||
    appointmentDate.getUTCMonth() !== month! - 1 ||
    appointmentDate.getUTCDate() !== day
  ) {
    throw new Error("Invalid date");
  }

  // 3. Find doctor
  const doctor = await prisma.doctor.findUnique({
    where: {
      id: BigInt(id),
    },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  if (doctor.status !== "ACTIVE") {
    throw new Error("Doctor is not active");
  }

  // 4. Find the doctor's active schedules for this weekday
  const dayOfWeek = appointmentDate.getUTCDay();

  const schedules = await prisma.doctorSchedule.findMany({
    where: {
      doctorId: BigInt(id),
      dayOfWeek,
      status: "ACTIVE",
    },
    orderBy: {
      startTime: "asc",
    },
  });

  if (schedules.length === 0) {
    return {
      doctorId: id,
      date,
      availableSlots: [],
    };
  }

  // 5. Find appointments scheduled for the selected date
  const appointments = await prisma.appointment.findMany({
    where: {
      doctorId: BigInt(id),
      appointmentDate,
      status: {
        in: ["SCHEDULED", "CONFIRMED"],
      },
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // 6. Convert HH:mm to minutes
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours! * 60 + minutes!;
  };

  const toTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  // 7. Get current date and time in Sri Lanka
  const sriLankaNow = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Colombo",
    }),
  );

  const todayInSriLanka = [
    sriLankaNow.getFullYear(),
    String(sriLankaNow.getMonth() + 1).padStart(2, "0"),
    String(sriLankaNow.getDate()).padStart(2, "0"),
  ].join("-");

  const currentMinutes =
    sriLankaNow.getHours() * 60 + sriLankaNow.getMinutes();

  // 8. Generate 30-minute slots
  const availableSlots: {
    startTime: string;
    endTime: string;
    available: boolean;
  }[] = [];

  for (const schedule of schedules) {
    const scheduleStart = toMinutes(schedule.startTime);
    const scheduleEnd = toMinutes(schedule.endTime);

    for (
      let start = scheduleStart;
      start + 30 <= scheduleEnd;
      start += 30
    ) {
      const end = start + 30;

      const startTime = toTime(start);
      const endTime = toTime(end);

      // Check for overlapping appointments
      const isBooked = appointments.some((appointment) => {
        const bookedStart = toMinutes(appointment.startTime);
        const bookedEnd = toMinutes(appointment.endTime);

        return start < bookedEnd && end > bookedStart;
      });

      // Prevent booking past time slots
      const isPast =
        date < todayInSriLanka ||
        (date === todayInSriLanka && start <= currentMinutes);

      availableSlots.push({
        startTime,
        endTime,
        available: !isBooked && !isPast,
      });
    }
  }

  // 9. Return availability
  return {
    doctorId: id,
    date,
    availableSlots,
  };
};