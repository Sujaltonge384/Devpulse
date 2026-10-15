import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  github: {
    id: { type: Number, default: null },
    login: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    profileUrl: { type: String, default: "" },
    encryptedAccessToken: { type: String, default: "", select: false },
    connectedAt: { type: Date, default: null }
  }
}, { timestamps: true });
export default mongoose.model("User", userSchema);
