import { Router } from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();

router.use(requireAuth);

async function accessibleProjectIds(userId) {
  return Project.find({
    $or: [
      { owner: userId },
      { members: userId },
    ],
  }).distinct("_id");
}

// Get tasks
router.get("/", async (req, res, next) => {
  try {
    const projectIds = await accessibleProjectIds(req.user._id);

    const query = {
      project: { $in: projectIds },
    };

    if (req.query.projectId) {
      if (!mongoose.isValidObjectId(req.query.projectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      query.project = req.query.projectId;
    }

    if (["todo", "in-progress", "done"].includes(req.query.status)) {
      query.status = req.query.status;
    }

    if (["low", "medium", "high"].includes(req.query.priority)) {
      query.priority = req.query.priority;
    }

    if (req.query.search) {
      const safeSearch = String(req.query.search)
        .slice(0, 80)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      query.title = {
        $regex: safeSearch,
        $options: "i",
      };
    }

    const tasks = await Task.find(query)
      .populate("project", "name color")
      .populate("owner", "name email")
      .sort({ updatedAt: -1 })
      .limit(250)
      .lean();

    return res.json({
      success: true,
      data: { tasks },
    });
  } catch (error) {
    return next(error);
  }
});

// Create task
router.post("/", async (req, res, next) => {
  try {
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const projectId = req.body?.project;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Task title is required.",
      });
    }

    if (title.length > 180 || description.length > 1500) {
      return res.status(400).json({
        success: false,
        message: "Task title or description is too long.",
      });
    }

    if (!mongoose.isValidObjectId(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid project.",
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you do not have access.",
      });
    }

    const task = await Task.create({
      title,
      description,

      status: [
        "todo",
        "in-progress",
        "done",
      ].includes(req.body?.status)
        ? req.body.status
        : "todo",

      priority: [
        "low",
        "medium",
        "high",
      ].includes(req.body?.priority)
        ? req.body.priority
        : "medium",

      dueDate: req.body?.dueDate || null,
      project: project._id,
      owner: req.user._id,
    });

    await task.populate([
      {
        path: "project",
        select: "name color",
      },
      {
        path: "owner",
        select: "name email",
      },
    ]);

    await recordActivity({
      owner: req.user._id,
      actorName: req.user.name,
      action: "Created task",
      target: task.title,
      type: "task",
      href: "/tasks",
      metadata: {
        taskId: String(task._id),
        projectId: String(project._id),
      },
    });

    if (String(project.owner) !== String(req.user._id)) {
      await recordActivity({
        owner: project.owner,
        actorName: req.user.name,
        action: "Added a task to your shared project",
        target: `${task.title} · ${project.name}`,
        type: "team",
        href: "/tasks",
      });
    }

    return res.status(201).json({
      success: true,
      data: { task },
    });
  } catch (error) {
    return next(error);
  }
});

// Update task
router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const project = await Project.findOne({
      _id: task.project,
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you do not have access.",
      });
    }

    const updates = {};

    if (req.body?.title !== undefined) {
      updates.title = String(req.body.title).trim();
    }

    if (req.body?.description !== undefined) {
      updates.description = String(req.body.description).trim();
    }

    if (req.body?.status !== undefined) {
      updates.status = req.body.status;
    }

    if (req.body?.priority !== undefined) {
      updates.priority = req.body.priority;
    }

    if (req.body?.dueDate !== undefined) {
      updates.dueDate = req.body.dueDate || null;
    }

    const updated = await Task.findByIdAndUpdate(
      task._id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("project", "name color")
      .populate("owner", "name email");

    const action =
      updated.status === "done" && task.status !== "done"
        ? "Completed task"
        : "Updated task";

    await recordActivity({
      owner: req.user._id,
      actorName: req.user.name,
      action,
      target: updated.title,
      type: "task",
      href: "/tasks",
      metadata: {
        taskId: String(updated._id),
        status: updated.status,
        priority: updated.priority,
      },
    });

    return res.json({
      success: true,
      data: { task: updated },
    });
  } catch (error) {
    return next(error);
  }
});

// Delete task
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID.",
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found.",
      });
    }

    const project = await Project.findOne({
      _id: task.project,
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you do not have access.",
      });
    }

    if (
      String(task.owner) !== String(req.user._id) &&
      String(project.owner) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only the task creator or project owner can delete this task.",
      });
    }

    await task.deleteOne();

    await recordActivity({
      owner: req.user._id,
      actorName: req.user.name,
      action: "Deleted task",
      target: task.title,
      type: "task",
      href: "/tasks",
    });

    return res.json({
      success: true,
      message: "Task deleted.",
    });
  } catch (error) {
    return next(error);
  }
});

export default router;