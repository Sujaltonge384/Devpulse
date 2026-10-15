import mongoose from "mongoose";
const activitySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  actorName: { type: String, default: "You" },
  action: { type: String, required: true, maxlength: 120 },
  target: { type: String, default: "", maxlength: 180 },
  type: { type: String, enum: ["task", "project", "github", "team", "system"], default: "system" },
  href: { type: String, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
activitySchema.index({ owner: 1, createdAt: -1 });
export default mongoose.model("Activity", activitySchema);
