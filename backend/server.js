import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";

dotenv.config();
const app=express();
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use("/uploads",express.static(path.join(__dirname,"uploads")));

app.get("/",(req,res)=>res.json({message:"Job Portal AI API is running"}));
app.use("/api/auth",authRoutes);
app.use("/api/jobs",jobRoutes);
app.use("/api/applications",applicationRoutes);

app.use((err,req,res,next)=>res.status(500).json({message:err.message||"Server error"}));

const PORT=process.env.PORT||5000;
mongoose.connect(process.env.MONGO_URI)
.then(()=>app.listen(PORT,()=>console.log(`Backend running on http://localhost:${PORT}`)))
.catch(err=>{console.error("MongoDB connection failed:",err.message); process.exit(1);});
