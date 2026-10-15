import { Router } from "express";
import mongoose from "mongoose";

const router = Router();
router.get("/", (req, res) => {
  const states = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
  res.json({ success: true, message: "DevPulse API is running", data: {
    database: states[mongoose.connection.readyState] || "unknown",
    timestamp: new Date().toISOString()
  }});
});
export default router;
