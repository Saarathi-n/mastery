import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fsp from "fs/promises";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import multer from "multer";
import { GridFSBucket } from "mongodb";

dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIBRARY_ROOT = process.env.LIBRARY_ROOT || path.join(process.cwd(), "..", "ncert ooks"); // Fallback or env
const PYQ_ROOT = process.env.PYQ_ROOT || path.join(process.cwd(), "..", "pyq"); // Adjust if pyq has a separate folder
const SECTION_FOLDERS = {
  ncert: "ncert pdf",
  pyq: "pyq practice",
  mocktest: "mocktest"
};
const SUBJECT_FOLDER_MAP = {
  Mathematics: "Maths",
  Math: "Maths",
  Physics: "physics",
  Chemistry: "chemistry"
};

const CLOUDINARY_LIBRARY_ROOT = "mastery/ncert";
const CLOUDINARY_PYQ_ROOT = "mastery/pyq";
const CLOUDINARY_MOCKTEST_ROOT = "mastery/mocktest";

function normalizeClassFolder(classLevel) {
  const match = String(classLevel || "").match(/\d+/);
  if (!match) return "";
  return `${match[0]}th`;
}

function resolveSubjectFolder(classLevel, subject) {
  const normalizedClass = normalizeClassFolder(classLevel);
  const mappedSubject = SUBJECT_FOLDER_MAP[subject] || subject;
  if (!normalizedClass || !mappedSubject) return null;
  return path.join(LIBRARY_ROOT, `${normalizedClass} ${mappedSubject}`);
}

function resolveCloudinarySubjectPrefix(classLevel, subject) {
  const normalizedClass = normalizeClassFolder(classLevel);
  const mappedSubject = SUBJECT_FOLDER_MAP[subject] || subject;
  if (!normalizedClass || !mappedSubject) return null;
  return `${CLOUDINARY_LIBRARY_ROOT}/${normalizedClass} ${mappedSubject}`;
}

function splitCloudinaryFolder(folder) {
  return String(folder || "")
    .split("/")
    .filter(Boolean);
}

function escapeCloudinaryFolderSegment(segment) {
  return String(segment || "").replace(/ /g, "\\ ");
}

function escapeCloudinaryFolderPath(folderPath) {
  return splitCloudinaryFolder(folderPath).map(escapeCloudinaryFolderSegment).join("/");
}

function resourceFolder(resource) {
  if (resource?.folder) return resource.folder;
  if (resource?.public_id) return path.posix.dirname(resource.public_id);
  return "";
}

async function searchCloudinaryRawResources(folderPrefix) {
  const resources = [];
  let nextCursor = null;
  const expression = `folder:${escapeCloudinaryFolderPath(folderPrefix)}/* AND resource_type:raw`;

  do {
    let builder = cloudinary.search.expression(expression).max_results(500);
    if (nextCursor) builder = builder.next_cursor(nextCursor);
    const result = await builder.execute();
    resources.push(...(result.resources || []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources;
}

function resourceName(resource) {
  return resource?.display_name || resource?.filename || path.posix.basename(resource?.public_id || "") || resource?.public_id || "";
}

function resourceDownloadUrl(resource) {
  return cloudinary.utils.private_download_url(resource.public_id, resource.format || "bin", {
    resource_type: "raw",
    type: "upload"
  });
}

function resourceMatchesFile(resource, fileName) {
  const target = String(fileName || "").toLowerCase();
  const candidates = [
    resourceName(resource),
    resource.public_id,
    path.parse(resourceName(resource)).name
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return candidates.includes(target) || candidates.includes(path.parse(target).name);
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function chapterMatchesResource(resource, chapter, subject) {
  const haystack = normalizeSearchText(`${resource.public_id} ${resourceName(resource)}`);
  const chapterTerms = normalizeSearchText(chapter).split(/\s+/).filter(Boolean);
  const subjectAliasMap = {
    physics: ["physics", "phy"],
    chemistry: ["chemistry", "chem"],
    mathematics: ["mathematics", "maths", "math"],
    math: ["math", "maths"],
    biology: ["biology", "bio"]
  };

  const subjectKey = normalizeSearchText(subject).replace(/\s+/g, "");
  const subjectTerms = subjectAliasMap[subjectKey] || normalizeSearchText(subject).split(/\s+/).filter(Boolean);

  const chapterMatch = chapterTerms.some((term) => term.length > 2 && haystack.includes(term));
  const subjectMatch = subjectTerms.length === 0 || subjectTerms.some((term) => haystack.includes(term));
  return chapterMatch && subjectMatch;
}

function isPathInside(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return !!relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

const MONGO_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-2204";

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.error("Please check your MONGODB_URI in .env and ensure Atlas IP whitelist/DNS is configured.");
  });

// Schemas
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  grade: String,
  stream: String,
  currentLevel: String,
  diagnosticTestCleared: { type: Boolean, default: false }
});

const questionSchema = new mongoose.Schema({
  subject: String,
  chapter: String,
  class: String,
  type: String,
  exam: String,
  question: String,
  options: [String],
  correctAnswer: String,
  explanation: String
});

const mockTestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  subject: String,
  chapter: String,
  class: String,
  questions: mongoose.Schema.Types.Mixed,
  score: Number,
  completedAt: { type: Date, default: Date.now }
});

const pdfSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  // GridFS file id (when stored in Mongo GridFS)
  fileId: { type: mongoose.Schema.Types.ObjectId },
  // Cloudinary info (when stored in Cloudinary)
  cloudinary_public_id: String,
  cloudinary_url: String,
  cloudinary_folder: String,
  type: { type: String, required: true }, // 'ncert', 'neet', 'jee'
  subject: String,
  chapter: String,
  class: String,
  year: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileSize: Number
});

const User = mongoose.model("User", userSchema);
const Question = mongoose.model("Question", questionSchema);
const MockTest = mongoose.model("MockTest", mockTestSchema);
const PDF = mongoose.model("PDF", pdfSchema);

// Seed questions
Question.countDocuments().then((count) => {
  if (count === 0) {
    const sampleQuestions = [
      {
        subject: "Physics", chapter: "Kinematics", class: "11", type: "PYQ", exam: "JEE",
        question: "A particle starts from rest and accelerates constantly. What is the ratio of distances covered in 1st, 2nd, and 3rd seconds?",
        options: ["1:1:1", "1:3:5", "1:2:3", "1:4:9"],
        correctAnswer: "1:3:5",
        explanation: "Using Galileo's law of odd numbers, distance covered in nth second is proportional to 2n - 1."
      },
      {
        subject: "Chemistry", chapter: "Atomic Structure", class: "11", type: "diagnostic", exam: "NEET",
        question: "Which of the following describes the shape of a p-orbital?",
        options: ["Spherical", "Dumbbell", "Double Dumbbell", "Complex"],
        correctAnswer: "Dumbbell",
        explanation: "p-orbitals have a dumbbell shape."
      }
    ];
    Question.insertMany(sampleQuestions).then(() => console.log("Seeded questions"));
  }
});

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 5001;

  app.use(cors());
  app.use(express.json());

  // Multer setup for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
  });

  const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token" });
        req.user = user;
        next();
      });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  };

  const authenticateFlexible = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1] || req.query.token;
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(400).json({ error: "Email already taken" });
        return;
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword });
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }
      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          grade: user.grade,
          stream: user.stream,
          currentLevel: user.currentLevel,
          diagnosticTestCleared: user.diagnosticTestCleared
        }
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/user/:id", authenticate, async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (user) {
        res.json({ ...user.toObject(), id: user._id });
      } else {
        res.status(404).json({ error: "Not found" });
      }
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/user/:id/grade-stream", authenticate, async (req, res) => {
    try {
      const { grade, stream, currentLevel } = req.body;
      await User.findByIdAndUpdate(req.params.id, { grade, stream, currentLevel: currentLevel || grade });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/user/:id/diagnostic", authenticate, async (req, res) => {
    try {
      const { passed, nextLevel } = req.body;
      await User.findByIdAndUpdate(req.params.id, { diagnosticTestCleared: !!passed, currentLevel: nextLevel });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/questions", authenticate, async (req, res) => {
    try {
      const { subject, class: _class, type, exam } = req.query;
      const filter = {};
      if (subject) filter.subject = subject;
      if (_class) filter.class = _class;
      if (type) filter.type = type;
      if (exam) filter.exam = exam;

      const questions = await Question.find(filter);
      res.json(questions.map((q) => ({ ...q.toObject(), id: q._id })));
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/mocktests/submit", authenticate, async (req, res) => {
    try {
      const { userId, type, subject, chapter, class: _class, score, questions } = req.body;
      const mockTest = await MockTest.create({
        userId, type, subject, chapter, class: _class, questions, score
      });
      res.json({ id: mockTest._id, score });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/progress/summary", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const classLevel = req.query.class || "11";

      // Map: display name (used in DB + frontend) → folder name (used in resolveSubjectFolder)
      const subjectMap = {
        "Physics": "Physics",
        "Chemistry": "Chemistry",
        "Mathematics": "Math",      // resolveSubjectFolder maps Math→Maths
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
  });

  // PDF Upload Endpoint
  app.post("/api/pdfs/upload", authenticate, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      const { type, subject, chapter, class: _class, year } = req.body;
      // Optionally upload to Cloudinary instead of GridFS
      const useCloud = process.env.USE_CLOUDINARY === 'true';
      if (useCloud) {
        const pubId = path.parse(req.file.originalname).name;
        const folder = req.body.cloudinaryFolder || process.env.CLOUDINARY_DEFAULT_FOLDER || 'mastery';

        const stream = cloudinary.uploader.upload_stream({
          resource_type: 'raw',
          folder,
          public_id: pubId,
          use_filename: true,
          unique_filename: false
        }, async (error, result) => {
          if (error) {
            return res.status(500).json({ error: 'Cloud upload failed', details: error.message });
          }

          const pdf = await PDF.create({
            filename: req.file.originalname,
            cloudinary_public_id: result.public_id,
            cloudinary_url: result.secure_url,
            cloudinary_folder: folder,
            type,
            subject,
            chapter,
            class: _class,
            year,
            uploadedBy: req.user.id,
            fileSize: req.file.size
          });

          res.json({
            id: pdf._id,
            fileId: null,
            filename: pdf.filename,
            cloudinary_url: result.secure_url,
            message: 'PDF uploaded successfully'
          });
        });

        stream.end(req.file.buffer);
      } else {
        // Get GridFSBucket from mongoose connection
        const db = mongoose.connection.getClient().db(mongoose.connection.name);
        const bucket = new GridFSBucket(db);

        // Create upload stream
        const uploadStream = bucket.openUploadStream(req.file.originalname, {
          contentType: 'application/pdf'
        });

        uploadStream.end(req.file.buffer);

        uploadStream.on('finish', async () => {
          // Save metadata to PDF collection
          const pdf = await PDF.create({
            filename: req.file.originalname,
            fileId: uploadStream.id,
            type,
            subject,
            chapter,
            class: _class,
            year,
            uploadedBy: req.user.id,
            fileSize: req.file.size
          });

          res.json({
            id: pdf._id,
            fileId: uploadStream.id,
            filename: req.file.originalname,
            message: "PDF uploaded successfully"
          });
        });

        uploadStream.on('error', (err) => {
          res.status(500).json({ error: "Upload failed", details: err.message });
        });
      }
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  });

  // Get PDF List Endpoint
  app.get("/api/pdfs", authenticate, async (req, res) => {
    try {
      const { type, subject, class: _class } = req.query;
      const filter = {};
      if (type) filter.type = type;
      if (subject) filter.subject = subject;
      if (_class) filter.class = _class;

      const pdfs = await PDF.find(filter).select("filename type subject chapter class year uploadedAt fileSize cloudinary_url cloudinary_public_id fileId");
      res.json(pdfs.map(p => {
        const obj = p.toObject();
        obj.id = obj._id;
        obj.fileId = obj.cloudinary_url ? String(obj._id) : obj.fileId;
        return obj;
      }));
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });
  // Download PDF Endpoint (supports GridFS and Cloudinary)
  app.get("/api/pdfs/download/:fileId", authenticate, async (req, res) => {
    try {
      const param = req.params.fileId;
      let pdf = null;

      if (mongoose.Types.ObjectId.isValid(param)) {
        const objId = new mongoose.Types.ObjectId(param);
        pdf = await PDF.findOne({ $or: [{ fileId: objId }, { _id: objId }] });
      }

      if (!pdf) {
        // Try matching by cloudinary_public_id
        pdf = await PDF.findOne({ cloudinary_public_id: param });
      }

      if (!pdf) {
        res.status(404).json({ error: "PDF not found" });
        return;
      }

      // If stored on Cloudinary, redirect to a signed download URL
      if (pdf.cloudinary_url) {
        res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
        res.redirect(resourceDownloadUrl({ public_id: pdf.cloudinary_public_id, format: path.extname(pdf.filename).replace('.', '') || 'pdf' }));
        return;
      }

      // Fallback to GridFS
      if (!pdf.fileId) {
        res.status(404).json({ error: 'No file stored on server for this PDF' });
        return;
      }

      const db = mongoose.connection.getClient().db(mongoose.connection.name);
      const bucket = new GridFSBucket(db);
      const downloadStream = bucket.openDownloadStream(pdf.fileId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
      downloadStream.pipe(res);

      downloadStream.on('error', () => {
        res.status(404).json({ error: "File not found" });
      });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  });

  // Cloudinary-backed library endpoints
  app.get("/api/library/chapters", authenticate, async (req, res) => {
    try {
      const { subject, class: classLevel } = req.query;
      if (!subject || !classLevel) {
        res.status(400).json({ error: "subject and class are required" });
        return;
      }

      const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
      if (!subjectPrefix) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const resources = await searchCloudinaryRawResources(subjectPrefix);
      const subjectParts = splitCloudinaryFolder(subjectPrefix);
      const chapterMap = new Map();

      for (const resource of resources) {
        const relativeParts = splitCloudinaryFolder(resourceFolder(resource)).slice(subjectParts.length);
        const chapterName = relativeParts[0];
        const sectionName = relativeParts[1];
        const fileName = resourceName(resource);

        if (!chapterName || !sectionName) continue;
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

      res.json({
        subject,
        class: classLevel,
        chapters
      });
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  });

  app.get("/api/library/file", authenticateFlexible, async (req, res) => {
    try {
      const { subject, class: classLevel, chapter, section, file } = req.query;
      if (!subject || !classLevel || !chapter || !section || !file) {
        res.status(400).json({ error: "Missing required parameters" });
        return;
      }

      const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
      if (!subjectPrefix) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}/${section}`);
      const resource = resources.find((item) => resourceMatchesFile(item, file));
      if (!resource) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      res.setHeader("Cache-Control", "no-store");
      res.redirect(resourceDownloadUrl(resource));
    } catch (err) {
      res.status(500).json({ error: "Server error", details: err.message });
    }
  });

  app.get("/api/library/asset", authenticate, async (req, res) => {
    try {
      const { subject, class: classLevel, chapter, section, file } = req.query;
      if (!subject || !classLevel || !chapter || !section || !file) {
        res.status(400).json({ error: "subject, class, chapter, section, and file are required" });
        return;
      }

      const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
      if (!subjectPrefix) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}/${section}`);
      const resource = resources.find((item) => resourceMatchesFile(item, file));
      if (!resource) {
        res.status(404).json({ error: "File not found" });
        return;
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
  });

  app.get("/api/library/pyq", authenticate, async (req, res) => {
    try {
      const { subject, class: classLevel, chapter } = req.query;
      if (!subject || !classLevel || !chapter) {
        res.status(400).json({ error: "subject, class, and chapter are required" });
        return;
      }

      const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
      if (!subjectPrefix) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const files = [];

      const resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}/${SECTION_FOLDERS.pyq}`);
      const resource = resources.find((item) => resourceMatchesFile(item, "questions.json")) || resources[0];
      if (!resource) {
        // Continue and fall back to Cloudinary PYQ docs below.
      } else {
        const fetchRes = await fetch(resourceDownloadUrl(resource));
        if (!fetchRes.ok) {
          res.status(502).json({ error: "Failed to fetch PYQ from Cloudinary" });
          return;
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

          res.json({
            chapter,
            subject,
            class: classLevel,
            type: data.type || "PYQ",
            exam: data.exam || "JEE",
            questions: data.questions || data,
            files
          });
          return;
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
    } catch (error) {
      console.error("Error reading PYQ JSON:", error);
      res.status(500).json({ error: "Failed to read PYQ JSON" });
    }
  });

  app.get("/api/library/mocktest", authenticate, async (req, res) => {
    try {
      const { subject, class: classLevel, chapter } = req.query;
      if (!subject || !classLevel || !chapter) {
        res.status(400).json({ error: "subject, class, and chapter are required" });
        return;
      }

      const subjectPrefix = resolveCloudinarySubjectPrefix(classLevel, subject);
      if (!subjectPrefix) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const files = [];

      const resources = await searchCloudinaryRawResources(`${subjectPrefix}/${chapter}/${SECTION_FOLDERS.mocktest}`);
      const resource = resources.find((item) => resourceMatchesFile(item, "questions.json")) || resources[0];
      if (!resource) {
        // Fall through to Cloudinary mocktest docs below.
      } else {
        const fetchRes = await fetch(resourceDownloadUrl(resource));
        if (!fetchRes.ok) {
          res.status(502).json({ error: "Failed to fetch Mocktest from Cloudinary" });
          return;
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

          res.json({
            questions: data.questions || data,
            files
          });
          return;
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
    } catch (error) {
      console.error("Error reading Mocktest JSON:", error);
      res.status(500).json({ error: "Failed to read Mocktest JSON" });
    }
  });

  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on http://localhost:" + PORT);
  });
}

startServer().catch(console.error);
