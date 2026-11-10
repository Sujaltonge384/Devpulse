import { Router } from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const projectIds = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    }).distinct("_id");
    const taskScope = { project: { $in: projectIds } };
    const [projects, totalTasks, todo, inProgress, done, highPriority, recentTasks] = await Promise.all([
      Project.countDocuments({ _id: { $in: projectIds }, status: "active" }),
      Task.countDocuments(taskScope),
      Task.countDocuments({ ...taskScope, status: "todo" }),
      Task.countDocuments({ ...taskScope, status: "in-progress" }),
      Task.countDocuments({ ...taskScope, status: "done" }),
      Task.countDocuments({ ...taskScope, priority: "high", status: { $ne: "done" } }),
      Task.find(taskScope).populate("project", "name color").populate("owner", "name").sort({ updatedAt: -1 }).limit(6).lean()
    ]);

    return res.json({
      success: true,
      data: { stats: { projects, totalTasks, todo, inProgress, done, highPriority }, recentTasks }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
