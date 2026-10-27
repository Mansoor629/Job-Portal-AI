import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import axios from "axios";
import "./style.css";

const API="http://localhost:5000/api";
const FILES="http://localhost:5000/uploads/";
const api=axios.create({baseURL:API});
api.interceptors.request.use(c=>{const t=localStorage.getItem("token");if(t)c.headers.Authorization=`Bearer ${t}`;return c;});

function Auth({onLogin}){
 const [mode,setMode]=useState("login"),[form,setForm]=useState({name:"",email:"",password:"",role:"applicant"}),[msg,setMsg]=useState("");
 const submit=async e=>{e.preventDefault();try{const r=await api.post(`/auth/${mode}`,form);localStorage.setItem("token",r.data.token);localStorage.setItem("user",JSON.stringify(r.data.user));onLogin(r.data.user)}catch(e){setMsg(e.response?.data?.message||"Error")}};
 return <div className="auth"><div className="card"><h1>Job Portal AI</h1><p className="muted">AI-Based Resume Screening</p>
  {msg&&<div className="error">{msg}</div>}<form onSubmit={submit}>
  {mode==="register"&&<input placeholder="Full name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>}
  <input type="email" placeholder="Email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
  <input type="password" placeholder="Password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
  {mode==="register"&&<select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="applicant">Applicant</option><option value="recruiter">Recruiter</option></select>}
  <button>{mode==="login"?"Login":"Create account"}</button></form>
  <button className="link" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"New user? Register":"Already registered? Login"}</button>
 </div></div>
}

function App(){
 const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem("user")||"null"));
 const logout=()=>{localStorage.clear();setUser(null)};
 if(!user)return <Auth onLogin={setUser}/>;
 return <Dashboard user={user} logout={logout}/>;
}

function Dashboard({user,logout}){
 const [q,setQ]=useState(""),[jobs,setJobs]=useState([]),[apps,setApps]=useState([]),[selected,setSelected]=useState(null),[msg,setMsg]=useState("");
 const [job,setJob]=useState({title:"",company:"",location:"",description:"",skills:""});
 const load=async(query=q)=>{try{if(user.role==="applicant"){setJobs((await api.get("/jobs",{params:{q:query}})).data);setApps((await api.get("/applications/mine")).data)}else setJobs((await api.get("/jobs/mine")).data)}catch(e){setMsg(e.response?.data?.message||"Error")}};
 useEffect(()=>{load()},[]);
 const post=async e=>{e.preventDefault();try{await api.post("/jobs",job);setJob({title:"",company:"",location:"",description:"",skills:""});setMsg("Job posted successfully");load()}catch(e){setMsg(e.response?.data?.message||"Error")}};
 const apply=async(jobId)=>{const input=document.createElement("input");input.type="file";input.accept=".pdf,.docx,.txt";input.onchange=async()=>{if(!input.files[0])return;const fd=new FormData();fd.append("jobId",jobId);fd.append("resume",input.files[0]);try{await api.post("/applications",fd);setMsg("Application submitted and resume screened");load()}catch(e){setMsg(e.response?.data?.message||"Application failed")}};input.click()};
 const applicants=async(jobId)=>{try{setSelected(await api.get(`/applications/job/${jobId}`));}catch(e){setMsg(e.response?.data?.message||"Error")}};
 return <div><header><div><h2>Job Portal AI</h2><span>{user.name} · {user.role}</span></div><button onClick={logout}>Logout</button></header>
 <main>{msg&&<div className="notice">{msg}</div>}
 {user.role==="recruiter"?<><section className="card"><h3>Post a Job</h3><form onSubmit={post} className="grid">
 <input placeholder="Job title" required value={job.title} onChange={e=>setJob({...job,title:e.target.value})}/><input placeholder="Company" required value={job.company} onChange={e=>setJob({...job,company:e.target.value})}/>
 <input placeholder="Location" value={job.location} onChange={e=>setJob({...job,location:e.target.value})}/><input placeholder="Skills: Java, SQL, React" required value={job.skills} onChange={e=>setJob({...job,skills:e.target.value})}/>
 <textarea className="wide" placeholder="Job description" required value={job.description} onChange={e=>setJob({...job,description:e.target.value})}/><button className="wide">Post Job</button></form></section>
 <h3>My Jobs</h3>{jobs.map(j=><div className="card" key={j._id}><h3>{j.title}</h3><p>{j.company} · {j.location}</p><p>{j.description}</p><p><b>Skills:</b> {j.skills.join(", ")}</p><button onClick={()=>applicants(j._id)}>View Applicants</button></div>)}
 {selected&&<div className="card"><h3>Ranked Applicants</h3>{selected.data.length?selected.data.map(a=><div className="applicant" key={a._id}><b>{a.applicant?.name}</b> ({a.applicant?.email}) — <strong>{a.matchScore}% Match</strong><br/>Matched: {(a.matchedSkills||[]).join(", ")||"none"}<br/>Missing: {(a.missingSkills||[]).join(", ")||"none"}<br/>All skills found: {a.extractedSkills.join(", ")}<br/><a href={FILES+a.resume} target="_blank" rel="noreferrer">View resume</a><br/><select value={a.status} onChange={async e=>{try{await api.patch(`/applications/${a._id}/status`,{status:e.target.value});applicants(a.job)}catch(err){setMsg(err.response?.data?.message||"Error")}}}><option>Applied</option><option>Shortlisted</option><option>Rejected</option></select></div>):<p>No applicants yet.</p>}</div>}
 </>:<><h3>Available Jobs</h3><input placeholder="Search jobs by title, company, skill or location..." value={q} onChange={e=>{setQ(e.target.value);load(e.target.value)}}/>{jobs.length===0&&<p>No jobs found.</p>}{jobs.map(j=><div className="card" key={j._id}><h3>{j.title}</h3><p>{j.company} · {j.location}</p><p>{j.description}</p><p><b>Required:</b> {j.skills.join(", ")}</p><button onClick={()=>apply(j._id)}>Upload Resume &amp; Apply</button></div>)}
 <h3>My Applications</h3>{apps.map(a=><div className="card" key={a._id}><b>{a.job?.title}</b> — {a.job?.company}<br/>AI Match: <strong>{a.matchScore}%</strong> · Status: {a.status}<br/>Matched: {(a.matchedSkills||[]).join(", ")||"none"}<br/>Missing: {(a.missingSkills||[]).join(", ")||"none"}</div>)}</>}
 </main></div>
}
createRoot(document.getElementById("root")).render(<App/>);
