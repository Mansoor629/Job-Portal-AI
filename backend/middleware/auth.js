import jwt from "jsonwebtoken";
export function auth(req,res,next){
  const token=req.headers.authorization?.split(" ")[1];
  if(!token) return res.status(401).json({message:"Login required"});
  try{req.user=jwt.verify(token,process.env.JWT_SECRET); next();}
  catch(e){return res.status(401).json({message:"Invalid token"});}
}
export function role(...roles){
  return (req,res,next)=>roles.includes(req.user.role)
    ? next() : res.status(403).json({message:"Access denied"});
}
