import { Router } from "express";
import mongoose from "mongoose";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const query = { owner: req.user._id };
    if (req.query.projectId && mongoose.isValidObjectId(req.query.projectId)) query.project = req.query.projectId;
    if (["todo", "in-progress", "done"].includes(req.query.status)) query.status = req.query.status;
    if (["low", "medium", "high"].includes(req.query.priority)) query.priority = req.query.priority;
    if (req.query.search) query.title = { $regex: String(req.query.search).slice(0, 80), $options: "i" };
    const tasks = await Task.find(query).populate("project", "name color").sort({ updatedAt: -1 }).limit(250).lean();
    res.json({ success: true, data: { tasks } });
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const projectId = req.body.project;
    if (!title) return res.status(400).json({ success: false, message: "Task title is required." });
    if (!mongoose.isValidObjectId(projectId)) return res.status(400).json({ success: false, message: "Choose a valid project." });
    const project = await Project.findOne({ _id: projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ success: false, message: "Project not found." });
    const task = await Task.create({
      title, description: String(req.body.description || "").trim(),
      status: req.body.status || "todo", priority: req.body.priority || "medium",
      dueDate: req.body.dueDate || null, project: project._id, owner: req.user._id
    });
    await task.populate("project", "name color");
    res.status(201).json({ success: true, data: { task } });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const allowed = ["title", "description", "status", "priority", "dueDate"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key] || (key === "dueDate" ? null : "");
    const task = await Task.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, updates, { new: true, runValidators: true }).populate("project", "name color");
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    res.json({ success: true, data: { task } });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    res.json({ success: true, message: "Task deleted." });
  } catch (error) { next(error); }
});

export default router;
