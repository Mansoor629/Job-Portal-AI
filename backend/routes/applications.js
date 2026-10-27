import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import pdfParse from "pdf-parse/lib/pdf-parse.js"; // direct import avoids pdf-parse's ESM debug-mode bug
import mammoth from "mammoth";
import Application from "../models/Application.js";
import Job from "../models/Job.js";
import {auth,role} from "../middleware/auth.js";

const router=express.Router();
const uploadDir=path.resolve("uploads");
fs.mkdirSync(uploadDir,{recursive:true});

const DOCX="application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const storage=multer.diskStorage({
 destination:(req,file,cb)=>cb(null,uploadDir),
 filename:(req,file,cb)=>cb(null,Date.now()+"-"+file.originalname.replace(/[^a-zA-Z0-9._-]/g,"_"))
});
const upload=multer({
 storage,
 limits:{fileSize:5*1024*1024},
 fileFilter:(req,file,cb)=>{
  const ok=["application/pdf",DOCX,"text/plain"].includes(file.mimetype);
  cb(ok?null:new Error("Only PDF, DOCX or TXT resumes are allowed"),ok);
 }
});

// Run multer and return JSON errors instead of an HTML error page
const uploadResume=(req,res,next)=>upload.single("resume")(req,res,err=>
 err?res.status(400).json({message:err.message}):next());

async function extractText(file){
 if(file.mimetype==="application/pdf"){
  const data=await pdfParse(fs.readFileSync(file.path)); return data.text||"";
 }
 if(file.mimetype===DOCX){
  const r=await mammoth.extractRawText({path:file.path}); return r.value||"";
 }
 return fs.readFileSync(file.path,"utf8");
}

// Fallback used only if the Python AI service is not running
function fallbackAnalyze(text,job){
 const lower=text.toLowerCase();
 const matchedSkills=job.skills.filter(s=>lower.includes(String(s).toLowerCase()));
 const missingSkills=job.skills.filter(s=>!matchedSkills.includes(s));
 const score=job.skills.length?Math.round(matchedSkills.length/job.skills.length*100):0;
 return {skills:matchedSkills,matchedSkills,missingSkills,score};
}

async function analyze(text,job){
 try{
  const r=await axios.post(`${process.env.AI_SERVICE_URL}/analyze`,
   {resume:text,jobDescription:job.description,jobSkills:job.skills},{timeout:8000});
  return r.data;
 }catch{
  console.warn("AI service unavailable - using built-in keyword matcher");
  return fallbackAnalyze(text,job);
 }
}

router.post("/",auth,role("applicant"),uploadResume,async(req,res)=>{
 try{
  if(!req.file)return res.status(400).json({message:"Resume required"});
  const job=await Job.findById(req.body.jobId);
  if(!job)return res.status(404).json({message:"Job not found"});
  const already=await Application.findOne({job:job._id,applicant:req.user.id});
  if(already){fs.unlink(req.file.path,()=>{});return res.status(400).json({message:"You have already applied to this job"});}
  const text=await extractText(req.file);
  if(text.trim().length<20)return res.status(400).json({message:"Could not read text from this resume. Use a text-based PDF, DOCX or TXT (not a scanned image)."});
  const a=await analyze(text,job);
  const app=await Application.create({
   job:job._id,applicant:req.user.id,resume:req.file.filename,
   extractedSkills:a.skills||[],matchedSkills:a.matchedSkills||[],
   missingSkills:a.missingSkills||[],matchScore:a.score||0
  });
  res.status(201).json(app);
 }catch(e){res.status(500).json({message:e.message});}
});

router.get("/mine",auth,role("applicant"),async(req,res)=>{
 res.json(await Application.find({applicant:req.user.id}).populate("job").sort({createdAt:-1}));
});

router.get("/job/:jobId",auth,role("recruiter"),async(req,res)=>{
 try{
  const job=await Job.findOne({_id:req.params.jobId,recruiter:req.user.id});
  if(!job)return res.status(404).json({message:"Job not found"});
  res.json(await Application.find({job:job._id}).populate("applicant","name email").sort({matchScore:-1}));
 }catch(e){res.status(500).json({message:e.message});}
});

router.patch("/:id/status",auth,role("recruiter"),async(req,res)=>{
 try{
  if(!["Applied","Shortlisted","Rejected"].includes(req.body.status))return res.status(400).json({message:"Invalid status"});
  const app=await Application.findById(req.params.id).populate("job");
  if(!app||String(app.job.recruiter)!==req.user.id)return res.status(404).json({message:"Application not found"});
  app.status=req.body.status; await app.save(); res.json(app);
 }catch(e){res.status(500).json({message:e.message});}
});
export default router;
