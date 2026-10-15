import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.devpulse_token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) return res.status(401).json({ success: false, message: "Please sign in to continue." });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email");
    if (!user) return res.status(401).json({ success: false, message: "Account not found." });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "Your session has expired. Please sign in again." });
  }
}
