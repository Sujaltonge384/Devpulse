import mongoose from "mongoose";
const notificationSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true, maxlength: 180 },
  message: { type: String, default: "", maxlength: 500 },
  type: { type: String, enum: ["task", "project", "github", "team", "system"], default: "system" },
  href: { type: String, default: "" },
  readAt: { type: Date, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
notificationSchema.index({ owner: 1, readAt: 1, createdAt: -1 });
export default mongoose.model("Notification", notificationSchema);
