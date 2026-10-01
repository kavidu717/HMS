import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";





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

export default app;