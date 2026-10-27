import express from "express";
import Job from "../models/Job.js";
import {auth,role} from "../middleware/auth.js";
const router=express.Router();

const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

// All jobs. Optional search: /api/jobs?q=react (title, company, location, skills, description)
router.get("/",auth,async(req,res)=>{
 try{
  const q=String(req.query.q||"").trim();
  const filter=q?{$or:["title","company","location","description","skills"].map(f=>({[f]:{$regex:escapeRegex(q),$options:"i"}}))}:{};
  res.json(await Job.find(filter).populate("recruiter","name email").sort({createdAt:-1}));
 }catch(e){res.status(500).json({message:e.message});}
});

router.post("/",auth,role("recruiter"),async(req,res)=>{
 try{
  const {title,company,location,description,skills}=req.body;
  const job=await Job.create({title,company,location:location||"Remote",description,
    skills:Array.isArray(skills)?skills:String(skills||"").split(",").map(s=>s.trim()).filter(Boolean),
    recruiter:req.user.id});
  res.status(201).json(job);
 }catch(e){res.status(500).json({message:e.message});}
});

router.get("/mine",auth,role("recruiter"),async(req,res)=>{
 res.json(await Job.find({recruiter:req.user.id}).sort({createdAt:-1}));
});
export default router;
