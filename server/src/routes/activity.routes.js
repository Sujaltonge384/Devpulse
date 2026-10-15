import { Router } from "express";
import Activity from "../models/Activity.js";
import { requireAuth } from "../middleware/auth.js";
const router=Router();router.use(requireAuth);
router.get("/",async(req,res,next)=>{try{const limit=Math.min(Math.max(Number(req.query.limit)||50,1),150);const query={owner:req.user._id};if(["task","project","github","team","system"].includes(req.query.type))query.type=req.query.type;const activities=await Activity.find(query).sort({createdAt:-1}).limit(limit).lean();res.json({success:true,data:{activities}})}catch(e){next(e)}});
export default router;
