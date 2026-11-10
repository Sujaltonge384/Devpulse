import { Router } from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();

router.use(requireAuth);

// Get projects accessible to the signed-in user
router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    })
      .populate("owner", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    const ids = projects.map((project) => project._id);

    const counts = await Task.aggregate([
      {
        $match: {
          project: { $in: ids },
        },
      },
      {
        $group: {
          _id: "$project",
          total: { $sum: 1 },
          done: {
            $sum: {
              $cond: [
                { $eq: ["$status", "done"] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const countByProject = new Map(
      counts.map((item) => [String(item._id), item])
    );

    return res.json({
      success: true,
      data: {
        projects: projects.map((project) => ({
          ...project,

          isOwner:
            String(project.owner?._id || project.owner) ===
            String(req.user._id),

          taskCount:
            countByProject.get(String(project._id))?.total || 0,

          completedTasks:
            countByProject.get(String(project._id))?.done || 0,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Create project
router.post("/", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();

    const color = [
      "violet",
      "blue",
      "green",
      "orange",
      "pink",
    ].includes(req.body?.color)
      ? req.body.color
      : "violet";

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Project name is required.",
      });
    }

    if (name.length > 120 || description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Project name or description is too long.",
      });
    }

    const project = await Project.create({
      name,
      description,
      color,
      owner: req.user._id,
    });

    await recordActivity({
      owner: req.user._id,
      actorName: req.user.name,
      action: "Created project",
      target: project.name,
      type: "project",
      href: "/projects",
      metadata: {
        projectId: String(project._id),
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        project: {
          ...project.toObject(),
          taskCount: 0,
          completedTasks: 0,
          isOwner: true,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Update project
router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const updates = {};

    for (const key of [
      "name",
      "description",
      "color",
      "status",
    ]) {
      if (req.body?.[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user._id,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you are not the owner.",
      });
    }

    await recordActivity({
      owner: req.user._id,
      actorName: req.user.name,
      action: "Updated project",
      target: project.name,
      type: "project",
      href: "/projects",
    });

    return res.json({
      success: true,
      data: { project },
    });
  } catch (error) {
    return next(error);
  }
});

// Delete project
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID.",
      });
    }

    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or you are not the owner.",
      });
    }

    await Task.deleteMany({
      project: project._id,
    });

    await recordActivity({
      owner: req.user._id,
      actorName: req.user.name,
      action: "Deleted project",
      target: project.name,
      type: "project",
      href: "/projects",
    });

    return res.json({
      success: true,
      message: "Project and its tasks deleted.",
    });
  } catch (error) {
    return next(error);
  }
});

export default router;