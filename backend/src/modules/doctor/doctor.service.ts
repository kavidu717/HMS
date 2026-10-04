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
