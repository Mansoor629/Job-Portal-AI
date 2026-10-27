import mongoose from "mongoose";
const schema=new mongoose.Schema({
 name:{type:String,required:true},
 email:{type:String,required:true,unique:true},
 password:{type:String,required:true},
 role:{type:String,enum:["applicant","recruiter"],required:true}
},{timestamps:true});
export default mongoose.model("User",schema);
