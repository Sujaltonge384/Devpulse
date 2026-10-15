import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: "" },
  color: { type: String, enum: ["violet", "blue", "green", "orange", "pink"], default: "violet" },
  status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

projectSchema.index({ owner: 1, updatedAt: -1 });
export default mongoose.model("Project", projectSchema);
