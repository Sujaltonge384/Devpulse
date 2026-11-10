import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : req.cookies?.devpulse_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to continue.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload?.sub) {
      return res.status(401).json({
        success: false,
        message: "Your session is invalid. Please sign in again.",
      });
    }

    const user = await User.findById(payload.sub).select(
      "_id name email tokenVersion"
    );

    if (
      !user ||
      Number(payload.ver ?? 0) !== Number(user.tokenVersion ?? 0)
    ) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please sign in again.",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    if (
      error?.name === "JsonWebTokenError" ||
      error?.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please sign in again.",
      });
    }

    return next(error);
  }
}