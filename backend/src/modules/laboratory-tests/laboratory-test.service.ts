import { prisma } from "../../config/prisma.js";
import { CreateLaboratoryTestInput } from "./laboratory-test.schema.js";




    export const createLaboratoryTest=async (data: CreateLaboratoryTestInput) => {
       
        const existingTest = await prisma.laboratoryTest.findUnique({
            where: {
                testCode: data.testCode,
            },
        });

        if (existingTest) {
            throw new Error("Laboratory test with this code already exists");
        }

        const laboratoryTest = await prisma.laboratoryTest.create({
           data: {
           testCode: data.testCode,
           testName: data.testName,
           ...(data.description !== undefined && {
            description: data.description,
        }),
        sampleType: data.sampleType,
         price: data.price,
      },
        });

        return {
            ...laboratoryTest,
            id: laboratoryTest.id.toString(), 

        }

    }


 export const getLaboratoryTests = async () => {
  const laboratoryTests = await prisma.laboratoryTest.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return laboratoryTests.map((test) => ({
    ...test,
    id: test.id.toString(),
  }));
};   