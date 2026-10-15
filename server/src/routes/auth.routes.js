import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
});


function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

function setToken(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("devpulse_token", token, cookieOptions());
}


router.post("/logout", (req, res) => {
  res.clearCookie("devpulse_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  res.json({
    success: true,
    message: "Signed out successfully.",
  });
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }
    setToken(res, user);
    res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ success: true, data: { user: publicUser(req.user) } });
});

router.post("/logout", (req, res) => {
  res.clearCookie("devpulse_token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.json({ success: true, message: "Signed out successfully." });
});

export default router;
