import { Router } from "express";
import Notification from "../models/Notification.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router(); router.use(requireAuth);
router.get("/", async (req,res,next)=>{try{const limit=Math.min(Math.max(Number(req.query.limit)||30,1),100);const items=await Notification.find({owner:req.user._id}).sort({createdAt:-1}).limit(limit).lean();const unreadCount=await Notification.countDocuments({owner:req.user._id,readAt:null});res.json({success:true,data:{notifications:items,unreadCount}})}catch(e){next(e)}});
router.patch("/:id/read", async(req,res,next)=>{try{const item=await Notification.findOneAndUpdate({_id:req.params.id,owner:req.user._id},{readAt:new Date()},{new:true});if(!item)return res.status(404).json({success:false,message:"Notification not found."});res.json({success:true,data:{notification:item}})}catch(e){next(e)}});
router.post("/read-all",async(req,res,next)=>{try{await Notification.updateMany({owner:req.user._id,readAt:null},{$set:{readAt:new Date()}});res.json({success:true,message:"All notifications marked as read."})}catch(e){next(e)}});
router.delete("/:id",async(req,res,next)=>{try{const item=await Notification.findOneAndDelete({_id:req.params.id,owner:req.user._id});if(!item)return res.status(404).json({success:false,message:"Notification not found."});res.json({success:true,message:"Notification deleted."})}catch(e){next(e)}});
export default router;
