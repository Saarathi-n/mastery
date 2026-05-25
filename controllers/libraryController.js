
import { 
  resolveCloudinarySubjectPrefix, 
  resourceMatchesFile, 
  chapterMatchesResource 
} from '../utils/helpers.js';
import { 
  searchCloudinaryRawResources, 
  splitCloudinaryFolder, 
  resourceFolder, 
  resourceName, 
  resourceDownloadUrl 
} from '../utils/cloudinary.js';
import { 
  SECTION_FOLDERS, 
  CLOUDINARY_PYQ_ROOT, 
  CLOUDINARY_MOCKTEST_ROOT 
} from '../config/constants.js';
import path from 'path';

export async function getLibraryChapters(req, res) {
  try {
    const { subject, class: classLevel } = req.query;
    if (!subject || !classLevel) {
      return res.status(400).json({ error: "subject and class are required" });
    }

    const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
    if (!subjectPrefix) {
      return res.status(400).json({ error: "Invalid subject or class" });
    }

    const resources = await searchCloudinaryRawResources(subjectPrefix);
    const subjectParts = splitCloudinaryFolder(subjectPrefix);
    const chapterMap = new Map();

    for (const resource of resources) {
      const relativeParts = splitCloudinaryFolder(resourceFolder(resource)).slice(subjectParts.length);
      const fileName = resourceName(resource);
      let chapterName = relativeParts[0];
      let sectionName = relativeParts[1];

      if (relativeParts.length === 0) {
        const { extractChapterFromFilename, getVirtualChapterName } = await import('../utils/helpers.js');
        const chapterNum = extractChapterFromFilename(fileName);
        if (chapterNum) {
          chapterName = getVirtualChapterName(chapterNum, subject);
          sectionName = SECTION_FOLDERS.ncert;
        } else {
          chapterName = 'Supplementary';
          sectionName = SECTION_FOLDERS.ncert;
        }
      } else if (relativeParts.length === 1) {
        chapterName = relativeParts[0];
        sectionName = SECTION_FOLDERS.ncert;
      } else if (!chapterName || !sectionName) {
        const { extractChapterFromFilename, getVirtualChapterName } = await import('../utils/helpers.js');
        const chapterNum = extractChapterFromFilename(fileName);
        if (chapterNum) {
          chapterName = getVirtualChapterName(chapterNum, subject);
          sectionName = SECTION_FOLDERS.ncert;
        } else {
          chapterName = 'Supplementary';
          sectionName = SECTION_FOLDERS.ncert;
        }
      }

      if (!chapterMap.has(chapterName)) {
        chapterMap.set(chapterName, {});
      }

      const sections = chapterMap.get(chapterName);
      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }

      sections[sectionName].push({
        name: fileName,
        url: `/api/library/file?${new URLSearchParams({
          subject,
          class: classLevel,
          chapter: chapterName,
          section: sectionName,
          file: fileName
        }).toString()}`,
        resourceType: resource.resource_type,
        format: resource.format
      });
    }

    const chapters = Array.from(chapterMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, sections]) => ({
        name,
        sections: Object.fromEntries(
          Object.entries(SECTION_FOLDERS).map(([key, folderName]) => [
            key,
            (sections[folderName] || []).sort((a, b) => a.name.localeCompare(b.name))
          ])
        )
      }));

    res.json({ subject, class: classLevel, chapters });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function getLibraryFile(req, res) {
  try {
    const { subject, class: classLevel, chapter, section, file } = req.query;
    if (!subject || !classLevel || !chapter || !section || !file) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
    if (!subjectPrefix) {
      return res.status(400).json({ error: "Invalid subject or class" });
    }

    let resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}/${section}`);
    let resource = resources.find((item) => resourceMatchesFile(item, file));

    if (!resource) {
      resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}`);
      resource = resources.find((item) => resourceMatchesFile(item, file));
    }

    if (!resource) {
      resources = await searchCloudinaryRawResources(subjectPrefix);
      resource = resources.find((item) => resourceMatchesFile(item, file));
    }

    if (!resource) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Cache-Control", "no-store");
    res.redirect(resourceDownloadUrl(resource));
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function getLibraryAsset(req, res) {
  try {
    const { subject, class: classLevel, chapter, section, file } = req.query;
    if (!subject || !classLevel || !chapter || !section || !file) {
      return res.status(400).json({ error: "subject, class, chapter, section, and file are required" });
    }

    const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
    if (!subjectPrefix) {
      return res.status(400).json({ error: "Invalid subject or class" });
    }

    let resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}/${section}`);
    let resource = resources.find((item) => resourceMatchesFile(item, file));

    if (!resource) {
      resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}`);
      resource = resources.find((item) => resourceMatchesFile(item, file));
    }

    if (!resource) {
      resources = await searchCloudinaryRawResources(subjectPrefix);
      resource = resources.find((item) => resourceMatchesFile(item, file));
    }

    if (!resource) {
      return res.status(404).json({ error: "File not found" });
    }

    const ext = path.extname(file).toLowerCase();
    const contentType =
      ext === ".png" ? "image/png" :
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
          ext === ".webp" ? "image/webp" :
            "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");
    res.redirect(resourceDownloadUrl(resource));
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
}

export async function getLibraryPYQ(req, res) {
  try {
    const { subject, class: classLevel, chapter } = req.query;
    if (!subject || !classLevel || !chapter) {
      return res.status(400).json({ error: "subject, class, and chapter are required" });
    }

    const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
    if (!subjectPrefix) {
      return res.status(400).json({ error: "Invalid subject or class" });
    }

    const files = [];
    let resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}/${SECTION_FOLDERS.pyq}`);
    let resource = resources.find((item) => resourceMatchesFile(item, "questions.json")) || resources[0];

    if (!resource) {
      resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}`);
      resource = resources.find((item) => resourceMatchesFile(item, "questions.json")) || resources[0];
    }

    if (resource) {
      const fetchRes = await fetch(resourceDownloadUrl(resource));
      if (!fetchRes.ok) {
        return res.status(502).json({ error: "Failed to fetch PYQ from Cloudinary" });
      }

      const contentType = fetchRes.headers.get("content-type") || "";
      if (contentType.includes("json") || resource.format === "json") {
        const data = await fetchRes.json();
        files.push(...(data.files || []));
        const pyqDocs = await searchCloudinaryRawResources(CLOUDINARY_PYQ_ROOT);
        const matchingDocs = pyqDocs.filter((item) => chapterMatchesResource(item, chapter, subject));
        files.push(...matchingDocs.map((item) => ({
          name: resourceName(item),
          url: resourceDownloadUrl(item),
          contentType: item.format || "application/octet-stream"
        })));

        return res.json({
          chapter,
          subject,
          class: classLevel,
          type: data.type || "PYQ",
          exam: data.exam || "JEE",
          questions: data.questions || data,
          files
        });
      }
    }

    const pyqDocs = await searchCloudinaryRawResources(CLOUDINARY_PYQ_ROOT);
    const matchingDocs = pyqDocs.filter((item) => chapterMatchesResource(item, chapter, subject));

    res.json({
      chapter,
      subject,
      class: classLevel,
      type: "PYQ",
      exam: "JEE",
      questions: [],
      files: matchingDocs.map((item) => ({
        name: resourceName(item),
        url: resourceDownloadUrl(item),
        contentType: item.format || "application/octet-stream"
      }))
    });
  } catch (err) {
    console.error("Error reading PYQ JSON:", err);
    res.status(500).json({ error: "Failed to read PYQ JSON" });
  }
}

export async function getLibraryMockTest(req, res) {
  try {
    const { subject, class: classLevel, chapter } = req.query;
    if (!subject || !classLevel || !chapter) {
      return res.status(400).json({ error: "subject, class, and chapter are required" });
    }

    const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
    if (!subjectPrefix) {
      return res.status(400).json({ error: "Invalid subject or class" });
    }

    const files = [];
    let resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}/${SECTION_FOLDERS.mocktest}`);
    let resource = resources.find((item) => resourceMatchesFile(item, "questions.json")) || resources[0];

    if (!resource) {
      resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}`);
      resource = resources.find((item) => resourceMatchesFile(item, "questions.json")) || resources[0];
    }

    if (resource) {
      const fetchRes = await fetch(resourceDownloadUrl(resource));
      if (!fetchRes.ok) {
        return res.status(502).json({ error: "Failed to fetch Mocktest from Cloudinary" });
      }

      const contentType = fetchRes.headers.get("content-type") || "";
      if (contentType.includes("json") || resource.format === "json") {
        const data = await fetchRes.json();
        files.push(...(data.files || []));
        const mockDocs = await searchCloudinaryRawResources(CLOUDINARY_MOCKTEST_ROOT);
        const matchingDocs = mockDocs.filter((item) => chapterMatchesResource(item, chapter, subject));
        files.push(...matchingDocs.map((item) => ({
          name: resourceName(item),
          url: resourceDownloadUrl(item),
          contentType: item.format || "application/octet-stream"
        })));

        return res.json({
          questions: data.questions || data,
          files
        });
      }
    }

    const mockDocs = await searchCloudinaryRawResources(CLOUDINARY_MOCKTEST_ROOT);
    const matchingDocs = mockDocs.filter((item) => chapterMatchesResource(item, chapter, subject));

    res.json({
      questions: [],
      files: matchingDocs.map((item) => ({
        name: resourceName(item),
        url: resourceDownloadUrl(item),
        contentType: item.format || "application/octet-stream"
      }))
    });
  } catch (err) {
    console.error("Error reading Mocktest JSON:", err);
    res.status(500).json({ error: "Failed to read Mocktest JSON" });
  }
}

export default {
  getLibraryChapters,
  getLibraryFile,
  getLibraryAsset,
  getLibraryPYQ,
  getLibraryMockTest
};

