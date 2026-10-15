import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/"
});

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

function setToken(res, user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("devpulse_token", token, cookieOptions());
}

router.post("/register", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (name.length < 2) return res.status(400).json({ success: false, message: "Name must contain at least 2 characters." });
    if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ success: false, message: "Enter a valid email address." });
    if (password.length < 8) return res.status(400).json({ success: false, message: "Password must contain at least 8 characters." });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ success: false, message: "An account with this email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    setToken(res, user);
    res.status(201).json({ success: true, data: { user: publicUser(user) } });
  } catch (error) { next(error); }
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
