
import MockTest from '../models/MockTest.js';
import { resolveCloudinarySubjectPrefix } from '../utils/helpers.js';
import { searchCloudinaryRawResources, splitCloudinaryFolder, resourceFolder } from '../utils/cloudinary.js';

export async function getProgressSummary(req, res) {
  try {
    const userId = req.user.id;
    const classLevel = req.query.class || "11";

    const subjectMap = {
      "Physics": "Physics",
      "Chemistry": "Chemistry",
      "Mathematics": "Math",
      "Biology": "Biology"
    };

    const summary = {};

    for (const [displayName, lookupName] of Object.entries(subjectMap)) {
      const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, lookupName);
      let totalChapters = 0;

      if (subjectPrefix) {
        const resources = await searchCloudinaryRawResources(subjectPrefix);
        const chapterNames = new Set();
        for (const resource of resources) {
          const relative = splitCloudinaryFolder(resourceFolder(resource)).slice(splitCloudinaryFolder(subjectPrefix).length);
          if (relative.length > 0) {
            chapterNames.add(relative[0]);
          }
        }
        totalChapters = chapterNames.size;
      }

      const completedChapters = await MockTest.distinct("chapter", {
        userId,
        subject: displayName,
        type: "mocktest"
      });

      const finalTotal = Math.max(totalChapters, completedChapters.length);

      if (finalTotal > 0) {
        summary[displayName] = {
          completed: completedChapters.length,
          total: finalTotal
        };
      }
    }

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export default { getProgressSummary };

