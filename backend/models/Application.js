import mongoose from "mongoose";
const schema=new mongoose.Schema({
 job:{type:mongoose.Schema.Types.ObjectId,ref:"Job",required:true},
 applicant:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
 resume:{type:String,required:true},
 extractedSkills:[String],
 matchedSkills:[String],
 missingSkills:[String],
 matchScore:{type:Number,default:0},
 status:{type:String,enum:["Applied","Shortlisted","Rejected"],default:"Applied"}
},{timestamps:true});
schema.index({job:1,applicant:1},{unique:true});
export default mongoose.model("Application",schema);
