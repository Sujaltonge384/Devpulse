
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.cookies?.devpulse_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Account not found.",
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Your session has expired. Please sign in again.",
    });
  }
}
