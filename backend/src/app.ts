import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import patientRoutes from "./modules/patient/patient.routes.js";
import medicalRecordRoutes from "./modules/medical-records/medical-record.routes.js";
import patientDocumentRoutes from "./modules/patient-documents/patient-document.routes.js";
import doctorRoutes from "./modules/doctor/doctor.routes.js";
import departmentRoutes from "./modules/department/department.routes.js";
import appointmentRoutes from "./modules/appoinment/appointment.routes.js";


const app = express();


app.use(helmet());
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
)

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.get("/api/v1/health",(req,res)=>{
    res.status(200).json({
        success:true,
        message:"HMS backend is running"
    })
})

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/patients", patientRoutes);
app.use("/api/v1/medical-records", medicalRecordRoutes);
app.use("/api/v1/patients", patientDocumentRoutes);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/v1/appointments", appointmentRoutes);

export default app;
