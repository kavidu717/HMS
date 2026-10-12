import { prisma } from "../../config/prisma.js";
import { CreateLaboratoryTestInput } from "./laboratory-test.schema.js";
import type { UpdateLaboratoryTestInput } from "./laboratory-test.schema.js";



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


export const getLaboratoryTestById = async (id: bigint) => {
  const laboratoryTest = await prisma.laboratoryTest.findUnique({
    where: {
      id,
    },
  });

  if (!laboratoryTest) {
    throw new Error("LABORATORY_TEST_NOT_FOUND");
  }

  return {
    ...laboratoryTest,
    id: laboratoryTest.id.toString(),
  };
};





export const updateLaboratoryTest = async (
  id: bigint,
  data: UpdateLaboratoryTestInput,
) => {
  const existingTest = await prisma.laboratoryTest.findUnique({
    where: { id },
  });

  if (!existingTest) {
    throw new Error("LABORATORY_TEST_NOT_FOUND");
  }

  if (
    data.testCode !== undefined &&
    data.testCode !== existingTest.testCode
  ) {
    const duplicateTest = await prisma.laboratoryTest.findUnique({
      where: { testCode: data.testCode },
    });

    if (duplicateTest) {
      throw new Error("LABORATORY_TEST_CODE_EXISTS");
    }
  }

  const updatedTest = await prisma.laboratoryTest.update({
    where: { id },
    data: {
      ...(data.testCode !== undefined && { testCode: data.testCode }),
      ...(data.testName !== undefined && { testName: data.testName }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.sampleType !== undefined && { sampleType: data.sampleType }),
      ...(data.price !== undefined && { price: data.price }),
    },
  });

  return {
    ...updatedTest,
    id: updatedTest.id.toString(),
  };
};



export const deactivateLaboratoryTest = async (id: bigint) => {
  const existingTest = await prisma.laboratoryTest.findUnique({
    where: { id },
  });

  if (!existingTest) {
    throw new Error("LABORATORY_TEST_NOT_FOUND");
  }

  const updatedTest = await prisma.laboratoryTest.update({
    where: { id },
    data: { isActive: false },
  });

  return {
    ...updatedTest,
    id: updatedTest.id.toString(),
  };
};

