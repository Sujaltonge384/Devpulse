import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";

export async function recordActivity({ owner, actorName = "You", action, target = "", type = "system", href = "", metadata = {}, notify = true }) {
  if (!owner || !action) return;
  try {
    await Activity.create({ owner, actorName, action, target, type, href, metadata });
    if (notify) await Notification.create({ owner, title: action, message: target, type, href, metadata });
  } catch (error) {
    // Activity history must never make the primary task/project action fail.
    console.error("Could not record DevPulse activity:", error.message);
  }
}
