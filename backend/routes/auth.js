import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
const router=express.Router();

router.post("/register",async(req,res)=>{
 try{
  const {name,email,password,role}=req.body;
  if(!name||!email||!password||!role) return res.status(400).json({message:"All fields required"});
  const exists=await User.findOne({email});
  if(exists) return res.status(400).json({message:"Email already registered"});
  const hash=await bcrypt.hash(password,10);
  const user=await User.create({name,email,password:hash,role});
  const token=jwt.sign({id:user._id,name:user.name,role:user.role},process.env.JWT_SECRET,{expiresIn:"7d"});
  res.json({token,user:{id:user._id,name:user.name,email:user.email,role:user.role}});
 }catch(e){res.status(500).json({message:e.message});}
});

router.post("/login",async(req,res)=>{
 try{
  const {email,password}=req.body;
  const user=await User.findOne({email});
  if(!user||!(await bcrypt.compare(password,user.password))) return res.status(401).json({message:"Invalid email or password"});
  const token=jwt.sign({id:user._id,name:user.name,role:user.role},process.env.JWT_SECRET,{expiresIn:"7d"});
  res.json({token,user:{id:user._id,name:user.name,email:user.email,role:user.role}});
 }catch(e){res.status(500).json({message:e.message});}
});
export default router;
