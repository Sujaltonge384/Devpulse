import mongoose from "mongoose";
const githubTriageSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  repoFullName: { type: String, required: true },
  number: { type: Number, required: true },
  kind: { type: String, enum: ["issue", "pull_request"], required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  triageStatus: { type: String, enum: ["backlog", "planned", "in-progress", "done", "ignored"], default: "backlog" },
  note: { type: String, default: "", maxlength: 1000 }
}, { timestamps: true });
githubTriageSchema.index({ owner: 1, repoFullName: 1, number: 1, kind: 1 }, { unique: true });
export default mongoose.model("GitHubTriage", githubTriageSchema);
