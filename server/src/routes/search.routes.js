import { Router } from "express";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";
const router=Router();router.use(requireAuth);
router.get("/",async(req,res,next)=>{try{const q=String(req.query.q||"").trim().slice(0,80);if(q.length<2)return res.json({success:true,data:{tasks:[],projects:[]}});const safe=q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");const regex=new RegExp(safe,"i");const projectIds=await Project.find({$or:[{owner:req.user._id},{members:req.user._id}]}).distinct("_id");const [tasks,projects]=await Promise.all([Task.find({$and:[{$or:[{owner:req.user._id},{project:{$in:projectIds}}]},{$or:[{title:regex},{description:regex}]}]}).populate("project","name color").sort({updatedAt:-1}).limit(20).lean(),Project.find({$or:[{owner:req.user._id},{members:req.user._id}],$and:[{$or:[{name:regex},{description:regex}]}]}).sort({updatedAt:-1}).limit(20).lean()]);res.json({success:true,data:{tasks,projects}})}catch(e){next(e)}});
export default router;
