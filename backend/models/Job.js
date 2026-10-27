import mongoose from "mongoose";
const schema=new mongoose.Schema({
 title:{type:String,required:true},
 company:{type:String,required:true},
 location:{type:String,default:"Remote"},
 description:{type:String,required:true},
 skills:[String],
 recruiter:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true}
},{timestamps:true});
export default mongoose.model("Job",schema);
