import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const owner = req.user._id;
    const [projects, totalTasks, todo, inProgress, done, highPriority, recentTasks] = await Promise.all([
      Project.countDocuments({ owner, status: "active" }),
      Task.countDocuments({ owner }),
      Task.countDocuments({ owner, status: "todo" }),
      Task.countDocuments({ owner, status: "in-progress" }),
      Task.countDocuments({ owner, status: "done" }),
      Task.countDocuments({ owner, priority: "high", status: { $ne: "done" } }),
      Task.find({ owner }).populate("project", "name color").sort({ updatedAt: -1 }).limit(6).lean()
    ]);
    res.json({ success: true, data: { stats: { projects, totalTasks, todo, inProgress, done, highPriority }, recentTasks } });
  } catch (error) { next(error); }
});

export default router;
