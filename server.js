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
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
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
        const subjectFolder = resolveSubjectFolder(classLevel, lookupName);
        let totalChapters = 0;

        if (subjectFolder && fs.existsSync(subjectFolder)) {
          const entries = await fsp.readdir(subjectFolder, { withFileTypes: true });
          totalChapters = entries.filter((e) => e.isDirectory()).length;
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

      const pdfs = await PDF.find(filter).select("filename type subject chapter class year uploadedAt fileSize");
      res.json(pdfs.map(p => ({ ...p.toObject(), id: p._id })));
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Download PDF Endpoint
  app.get("/api/pdfs/download/:fileId", authenticate, async (req, res) => {
    try {
      const db = mongoose.connection.getClient().db(mongoose.connection.name);
      const bucket = new GridFSBucket(db);

      const fileId = new mongoose.Types.ObjectId(req.params.fileId);

      // Get metadata
      const pdf = await PDF.findOne({ fileId });
      if (!pdf) {
        res.status(404).json({ error: "PDF not found" });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);

      const downloadStream = bucket.openDownloadStream(fileId);
      downloadStream.pipe(res);

      downloadStream.on('error', () => {
        res.status(404).json({ error: "File not found" });
      });
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Local library endpoints (filesystem-based)
  app.get("/api/library/chapters", authenticate, async (req, res) => {
    try {
      const { subject, class: classLevel } = req.query;
      if (!subject || !classLevel) {
        res.status(400).json({ error: "subject and class are required" });
        return;
      }

      const subjectFolder = resolveSubjectFolder(classLevel, subject);
      if (!subjectFolder) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const folderExists = fs.existsSync(subjectFolder);
      if (!folderExists) {
        res.status(404).json({ error: "Subject folder not found" });
        return;
      }

      const entries = await fsp.readdir(subjectFolder, { withFileTypes: true });
      const chapterDirs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

      const chapters = [];
      for (const chapterName of chapterDirs) {
        const chapterPath = path.join(subjectFolder, chapterName);
        const sections = {};

        for (const [key, folderName] of Object.entries(SECTION_FOLDERS)) {
          const sectionPath = path.join(chapterPath, folderName);
          if (!fs.existsSync(sectionPath)) {
            sections[key] = [];
            continue;
          }

          const files = (await fsp.readdir(sectionPath))
            .filter((file) => file.toLowerCase().endsWith(".pdf"))
            .sort();

          sections[key] = files.map((file) => {
            const params = new URLSearchParams({
              subject,
              class: classLevel,
              chapter: chapterName,
              section: folderName,
              file
            });
            return {
              name: file,
              url: `/api/library/file?${params.toString()}`
            };
          });
        }

        chapters.push({ name: chapterName, sections });
      }

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

      const subjectFolder = resolveSubjectFolder(classLevel, subject);
      if (!subjectFolder) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const filePath = path.join(subjectFolder, chapter, section, file);
      if (!isPathInside(subjectFolder, filePath)) {
        res.status(400).json({ error: "Invalid file path" });
        return;
      }

      const stat = await fsp.stat(filePath).catch(() => null);
      if (!stat || !stat.isFile()) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "no-store");

      const stream = fs.createReadStream(filePath);
      stream.on("error", () => res.status(404).end());
      stream.pipe(res);
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

      const subjectFolder = resolveSubjectFolder(classLevel, subject);
      if (!subjectFolder) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const filePath = path.join(subjectFolder, chapter, section, file);
      if (!isPathInside(subjectFolder, filePath)) {
        res.status(400).json({ error: "Invalid file path" });
        return;
      }

      const stat = await fsp.stat(filePath).catch(() => null);
      if (!stat || !stat.isFile()) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType =
        ext === ".png" ? "image/png" :
          ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
            ext === ".webp" ? "image/webp" :
              "application/octet-stream";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Length", stat.size);
      res.setHeader("Cache-Control", "no-store");

      const stream = fs.createReadStream(filePath);
      stream.on("error", () => res.status(404).end());
      stream.pipe(res);
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

      const subjectFolder = resolveSubjectFolder(classLevel, subject);
      if (!subjectFolder) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const filePath = path.join(subjectFolder, chapter, SECTION_FOLDERS.pyq, "questions.json");
      if (!isPathInside(subjectFolder, filePath)) {
        res.status(400).json({ error: "Invalid file path" });
        return;
      }

      const exists = await fsp.stat(filePath).catch(() => null);
      if (!exists || !exists.isFile()) {
        res.status(404).json({ error: "PYQ file not found" });
        return;
      }

      const data = await fsp.readFile(filePath, "utf-8");
      res.json(JSON.parse(data));
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

      const subjectFolder = resolveSubjectFolder(classLevel, subject);
      if (!subjectFolder) {
        res.status(400).json({ error: "Invalid subject or class" });
        return;
      }

      const filePath = path.join(subjectFolder, chapter, SECTION_FOLDERS.mocktest, "questions.json");
      if (!isPathInside(subjectFolder, filePath)) {
        res.status(400).json({ error: "Invalid file path" });
        return;
      }

      const exists = await fsp.stat(filePath).catch(() => null);
      if (!exists || !exists.isFile()) {
        res.status(404).json({ error: "Mocktest file not found" });
        return;
      }

      const data = await fsp.readFile(filePath, "utf-8");
      res.json({ questions: JSON.parse(data) });
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
