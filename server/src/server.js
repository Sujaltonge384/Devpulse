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
import notificationsRoutes from "./routes/notifications.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import githubRoutes from "./routes/github.routes.js";
import searchRoutes from "./routes/search.routes.js";
import teamRoutes from "./routes/team.routes.js";

import {
  notFound,
  errorHandler,
} from "./middleware/errors.js";

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
) {
  console.error(
    "JWT_SECRET is missing or too short. Set a random secret of at least 32 characters in server/.env."
  );

  process.exit(1);
}

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());

const configuredOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS || "").split(","),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]
  .map((origin) =>
    String(origin || "")
      .trim()
      .replace(/\/+$/, "")
  )
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // Requests without Origin are server-to-server/health checks.
      if (
        !origin ||
        allowedOrigins.has(origin.replace(/\/+$/, ""))
      ) {
        return callback(null, true);
      }

      const error = new Error(
        `Origin ${origin} is not allowed by DevPulse CORS configuration.`
      );

      error.statusCode = 403;

      return callback(error);
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PATCH",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(cookieParser());
app.use(morgan("dev"));

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to DevPulse API",
  });
});

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/team", teamRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;

try {
  await connectDB();

  app.listen(port, "0.0.0.0", () => {
    console.log(`DevPulse API running on port ${port}`);

    console.log(
      `Allowed frontend origins: ${[...allowedOrigins].join(", ")}`
    );
  });
} catch (error) {
  console.error(
    `Startup failed: ${error.message}`
  );

  process.exit(1);
}