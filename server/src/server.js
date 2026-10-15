import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/projects.routes.js";
import taskRoutes from "./routes/tasks.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import healthRoutes from "./routes/health.routes.js";
<<<<<<< HEAD
import notificationsRoutes from "./routes/notifications.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import githubRoutes from "./routes/github.routes.js";
import searchRoutes from "./routes/search.routes.js";
import teamRoutes from "./routes/team.routes.js";
=======
>>>>>>> 404cc66100e7cfb8a943eb63edc59fb1c084fb46
import { notFound, errorHandler } from "./middleware/errors.js";

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Add it to server/.env.");
  process.exit(1);
}

const app = express();
app.disable("x-powered-by");
app.use(helmet());
<<<<<<< HEAD
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
=======
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5174", credentials: true }));
>>>>>>> 404cc66100e7cfb8a943eb63edc59fb1c084fb46
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: true, legacyHeaders: false }));
app.get("/", (req, res) => res.json({ success: true, message: "Welcome to DevPulse API" }));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
<<<<<<< HEAD
app.use("/api/notifications", notificationsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/team", teamRoutes);
=======
>>>>>>> 404cc66100e7cfb8a943eb63edc59fb1c084fb46
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
try {
  await connectDB();
  app.listen(port, () => console.log(`DevPulse API running at http://localhost:${port}`));
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
}
