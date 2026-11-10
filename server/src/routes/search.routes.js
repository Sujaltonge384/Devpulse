import { Router } from "express";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const query = String(req.query.q || "")
      .trim()
      .slice(0, 80);

    if (query.length < 2) {
      return res.json({
        success: true,
        data: {
          tasks: [],
          projects: [],
        },
      });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");

    const projectFilter = {
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    };

    const projectIds = await Project.find(projectFilter).distinct("_id");

    const [tasks, projects] = await Promise.all([
      Task.find({
        project: { $in: projectIds },
        $or: [
          { title: regex },
          { description: regex },
        ],
      })
        .populate("project", "name color")
        .populate("owner", "name")
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),

      Project.find({
        ...projectFilter,
        $or: [
          { name: regex },
          { description: regex },
        ],
      })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean(),
    ]);

    return res.json({
      success: true,
      data: {
        tasks,
        projects,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;