import { Router } from "express";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();

router.use(requireAuth);

// Get projects and collaborators visible to the signed-in user.
router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user._id },
        { members: req.user._id },
      ],
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ updatedAt: -1 })
      .lean();

    return res.json({
      success: true,

      data: {
        projects: projects.map((project) => ({
          ...project,

          isOwner:
            String(project.owner?._id || project.owner) ===
            String(req.user._id),
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Add an existing DevPulse user to a project.
router.post(
  "/projects/:id/members",
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      const email = String(
        req.body?.email || ""
      )
        .trim()
        .toLowerCase();

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid account email.",
        });
      }

      const project = await Project.findOne({
        _id: req.params.id,
        owner: req.user._id,
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Only the project owner can manage members.",
        });
      }

      const member = await User.findOne({
        email,
      }).select("_id name email");

      if (!member) {
        return res.status(404).json({
          success: false,
          message:
            "No DevPulse account found for this email. Ask them to register first.",
        });
      }

      if (String(member._id) === String(req.user._id)) {
        return res.status(400).json({
          success: false,
          message: "You already own this project.",
        });
      }

      if (
        project.members.some(
          (id) => String(id) === String(member._id)
        )
      ) {
        return res.status(409).json({
          success: false,
          message: "This user is already a member.",
        });
      }

      project.members.addToSet(member._id);

      await project.save();

      await recordActivity({
        owner: member._id,
        actorName: req.user.name,
        action: "Added you to a project",
        target: project.name,
        type: "team",
        href: "/team",
      });

      await recordActivity({
        owner: req.user._id,
        actorName: req.user.name,
        action: "Added project member",
        target: `${member.name} · ${project.name}`,
        type: "team",
        href: "/team",
      });

      return res.status(201).json({
        success: true,

        data: {
          member,
          projectId: String(project._id),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Remove a member. Only the project owner can do this.
router.delete(
  "/projects/:id/members/:memberId",
  async (req, res, next) => {
    try {
      if (
        !mongoose.isValidObjectId(req.params.id) ||
        !mongoose.isValidObjectId(req.params.memberId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid project or member ID.",
        });
      }

      const project = await Project.findOne({
        _id: req.params.id,
        owner: req.user._id,
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found or you are not the owner.",
        });
      }

      const before = project.members.length;

      project.members = project.members.filter(
        (id) => String(id) !== String(req.params.memberId)
      );

      if (project.members.length === before) {
        return res.status(404).json({
          success: false,
          message: "That user is not a member of this project.",
        });
      }

      await project.save();

      return res.json({
        success: true,
        message: "Project member removed.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Allow a member to leave a shared project.
router.post(
  "/projects/:id/leave",
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid project ID.",
        });
      }

      const project = await Project.findOne({
        _id: req.params.id,
        members: req.user._id,
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "You are not a member of this project.",
        });
      }

      project.members = project.members.filter(
        (id) => String(id) !== String(req.user._id)
      );

      await project.save();

      await recordActivity({
        owner: project.owner,
        actorName: req.user.name,
        action: "Left a shared project",
        target: project.name,
        type: "team",
        href: "/team",
      });

      return res.json({
        success: true,
        message: "You left the project.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;