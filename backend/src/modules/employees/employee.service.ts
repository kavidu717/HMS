
import { prisma } from "../../config/prisma.js";

export const createEmployee = async (data: {
  userId: bigint;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  position: string;
  phone: string;
  email: string;
  departmentId?: bigint;
  status?: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      id: data.userId,
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

 if (!user.role) {
  throw new Error("User role is not assigned");
}

const allowedEmployeeRoles = [
  "NURSE",
  "RECEPTIONIST",
  "LABORATORY_STAFF",
  "PHARMACIST",
  "ACCOUNTANT",
];

if (!allowedEmployeeRoles.includes(user.role.name)) {
  throw new Error("User role is not allowed for employee registration");
}

  const existingEmployee = await prisma.employee.findUnique({
    where: {
      userId: data.userId,
    },
  });

  if (existingEmployee) {
    throw new Error("Employee already exists for this user");
  }

  const existingEmployeeNumber = await prisma.employee.findUnique({
    where: {
      employeeNumber: data.employeeNumber,
    },
  });

  if (existingEmployeeNumber) {
    throw new Error("Employee number already exists");
  }

  if (data.departmentId !== undefined) {
    const department = await prisma.department.findUnique({
      where: {
        id: data.departmentId,
      },
    });

    if (!department) {
      throw new Error("Department not found");
    }
  }

  const employee = await prisma.employee.create({
    data: {
      userId: data.userId,
      employeeNumber: data.employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      position: data.position,
      phone: data.phone,
      email: data.email,
      departmentId: data.departmentId ?? null,
      status: data.status ?? "ACTIVE",
    },
  });

  return employee;
};

export const getEmployees = async () => {
  const employees = await prisma.employee.findMany({
    include: {
      user: {
        include: {
          role: true,
        },
      },
      department: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return employees.map((employee) => ({
    id: employee.id.toString(),
    userId: employee.userId.toString(),
    username: employee.user.username,
    userEmail: employee.user.email,
    role: employee.user.role.name,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    position: employee.position,
    phone: employee.phone,
    email: employee.email,
    department: employee.department
      ? {
          id: employee.department.id.toString(),
          name: employee.department.name,
        }
      : null,
    status: employee.status,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  }));
};

export const getEmployeeById = async (id: bigint) => {
  const employee = await prisma.employee.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        include: {
          role: true,
        },
      },
      department: true,
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  return {
    id: employee.id.toString(),
    userId: employee.userId.toString(),
    username: employee.user.username,
    userEmail: employee.user.email,
    role: employee.user.role.name,
    employeeNumber: employee.employeeNumber,
    firstName: employee.firstName,
    lastName: employee.lastName,
    position: employee.position,
    phone: employee.phone,
    email: employee.email,
    department: employee.department
      ? {
          id: employee.department.id.toString(),
          name: employee.department.name,
        }
      : null,
    status: employee.status,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
};


export const updateEmployee = async (
  id: bigint,
  data: {
    employeeNumber?: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    phone?: string;
    email?: string;
    departmentId?: bigint | null;
  },
) => {
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (data.employeeNumber) {
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        employeeNumber: data.employeeNumber,
        id: { not: id },
      },
    });

    if (existingEmployee) {
      throw new Error("Employee number already exists");
    }
  }

  if (data.departmentId !== undefined && data.departmentId !== null) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new Error("Department not found");
    }
  }

  return prisma.employee.update({
    where: { id },
    data,
    include: {
      user: {
        include: {
          role: true,
        },
      },
      department: true,
    },
  });
};