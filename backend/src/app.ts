import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/user.routes.js";
import patientRoutes from "./modules/patient/patient.routes.js";
import medicalRecordRoutes from "./modules/medical-records/medical-record.routes.js";


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

export default app;