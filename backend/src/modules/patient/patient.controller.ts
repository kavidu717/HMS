import { Request, Response } from "express";
import { createPatientSchema, updatePatientSchema } from "./patient.schema.js";
import { createPatient as createPatientService,
    getPatientById as getPatientByIdService,
    updatePatient as updatePatientService,
    searchPatients as searchPatientsService } from "./patient.service.js";

export const createPatient = async (req: Request, res: Response) => {
    try{
        const input=createPatientSchema.parse(req.body);
        const patient=await createPatientService(input);

        return res.status(201).json({
            success: true,
            message: "Patient created successfully",
            data: patient
        });


    }catch(error){
        if(error instanceof Error){
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }


}

export const updatePatient=async(req:Request,res:Response)=>{
    try{
        const patientId = req.params.id;

        if (typeof patientId !== "string" || !patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

     const input = updatePatientSchema.parse(req.body);
     const patient = await updatePatientService(
      patientId,
      input
    );

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      data: patient
    });
    } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Patient not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(400).json({
      success: false,
      message: "Failed to update patient"
    });
  }
}

export const getPatientById = async (
  req: Request,
  res: Response
) => {
  try {
    const patientId = req.params.id;

    if (typeof patientId !== "string" || !patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    const patient =
      await getPatientByIdService(patientId);

    return res.status(200).json({
      success: true,
      message: "Patient retrieved successfully",
      data: patient
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Patient not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve patient"
    });
  }
};

export const searchPatients = async (req: Request, res: Response) => {
  try {
    const query = req.query.q;

    if (typeof query !== "string" || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const patients = await searchPatientsService(query);

    return res.status(200).json({
      success: true,
      message: "Patients retrieved successfully",
      data: patients
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to search patients"
    });
  }
};