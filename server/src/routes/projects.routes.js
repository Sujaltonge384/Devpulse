import { Router } from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const projects = await Project.find({ $or: [{ owner: req.user._id }, { members: req.user._id }] }).populate("owner", "name email").sort({ updatedAt: -1 }).lean();
    const ids = projects.map(p => p._id);
    const counts = await Task.aggregate([
      { $match: { project: { $in: ids } } },
      { $group: { _id: "$project", total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } } } }
    ]);
    const map = new Map(counts.map(c => [String(c._id), c]));
    res.json({ success: true, data: { projects: projects.map(p => ({ ...p, taskCount: map.get(String(p._id))?.total || 0, completedTasks: map.get(String(p._id))?.done || 0 })) } });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Project name is required." });
    const project = await Project.create({
      name, description: String(req.body.description || "").trim(),
      color: req.body.color || "violet", owner: req.user._id
    });
    await recordActivity({ owner: req.user._id, actorName: req.user.name, action: "Created project", target: project.name, type: "project", href: "/projects", metadata: { projectId: String(project._id) } });
    res.status(201).json({ success: true, data: { project: { ...project.toObject(), taskCount: 0, completedTasks: 0 } } });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const updates = {};
    for (const key of ["name", "description", "color", "status"]) if (req.body[key] !== undefined) updates[key] = req.body[key];
    const project = await Project.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, updates, { new: true, runValidators: true });
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    await recordActivity({ owner: req.user._id, actorName: req.user.name, action: "Updated project", target: project.name, type: "project", href: "/projects", metadata: { projectId: String(project._id) } });
    res.json({ success: true, data: { project } });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    await Task.deleteMany({ project: project._id });
    await recordActivity({ owner: req.user._id, actorName: req.user.name, action: "Deleted project", target: project.name, type: "project", href: "/projects" });
    res.json({ success: true, message: "Project and its tasks deleted." });
  } catch (error) { next(error); }
});

export default router;
