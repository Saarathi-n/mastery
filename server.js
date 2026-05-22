
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './utils/db.js';
import config from './config/index.js';
import setupSecurity from './middleware/security.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';
import Question from './models/Question.js';

// Complete refactoring: split server.js into modular structure

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

setupSecurity(app);
app.use(express.json());

async function seedQuestions() {
  try {
    const count = await Question.countDocuments();
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
      await Question.insertMany(sampleQuestions);
      console.log("Seeded questions");
    }
  } catch (err) {
    console.error("Error seeding questions:", err);
  }
}

app.use('/api', apiRoutes);

if (config.server.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await connectDB();
    await seedQuestions();
    
    app.listen(config.server.port, () => {
      console.log(`Server running on http://localhost:${config.server.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;

