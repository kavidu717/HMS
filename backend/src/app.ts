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
import prescriptionRoutes from "./modules/prescriptions/prescription.routes.js";
import laboratoryTestRoutes from "./modules/laboratory-tests/laboratory-test.routes.js";
import laboratoryTestRequestRoutes from "./modules/laboratory-test-requests/laboratory-test-request.routes.js";
import pharmacyRoutes from "./modules/pharmacy/pharmacy.route.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import employeeRoutes from "./modules/employees/employee.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import employeeLeaveRecordRoutes from "./modules/employee-leave-records/employee-leave-record.routes.js";


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
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/laboratory-tests", laboratoryTestRoutes);
app.use("/api/v1/laboratory-test-requests", laboratoryTestRequestRoutes);

app.use("/api/v1/pharmacy", pharmacyRoutes);
app.use("/api/v1/billing", billingRoutes);
app.use("/api/v1/employees", employeeRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/employee-leave-records", employeeLeaveRecordRoutes);

export default app;
