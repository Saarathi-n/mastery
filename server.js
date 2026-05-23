
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
          subject: "Physics", chapter: "Kinematics", class: "11", type: "diagnostic", exam: "JEE",
          question: "A particle starts from rest and accelerates constantly. What is the ratio of distances covered in 1st, 2nd, and 3rd seconds?",
          options: ["1:1:1", "1:3:5", "1:2:3", "1:4:9"],
          correctAnswer: "1:3:5",
          explanation: "Using Galileo's law of odd numbers, distance covered in nth second is proportional to 2n - 1."
        },
        {
          subject: "Chemistry", chapter: "Atomic Structure", class: "11", type: "diagnostic", exam: "JEE",
          question: "The number of protons, neutrons and electrons in a species are equal to 11, 12 and 10 respectively. The species is",
          options: ["Na⁺", "Na", "Mg²⁺", "Mg"],
          correctAnswer: "Na⁺",
          explanation: "Sodium has atomic number 11, so 11 protons. 10 electrons means it's a cation with +1 charge."
        },
        {
          subject: "Mathematics", chapter: "Sets", class: "11", type: "diagnostic", exam: "JEE",
          question: "If A = {1, 2, 3, 4}, B = {3, 4, 5, 6}, then A ∩ B is",
          options: ["{1, 2}", "{3, 4}", "{5, 6}", "{1, 2, 3, 4, 5, 6}"],
          correctAnswer: "{3, 4}",
          explanation: "Intersection of two sets contains elements common to both."
        },
        {
          subject: "Physics", chapter: "Kinematics", class: "11", type: "diagnostic", exam: "NEET",
          question: "A car moving with a speed of 50 km/h can be stopped by brakes after at least 6 m. If the same car is moving at a speed of 100 km/h, the minimum stopping distance is",
          options: ["12 m", "18 m", "24 m", "6 m"],
          correctAnswer: "24 m",
          explanation: "Stopping distance is proportional to the square of initial speed (v²). So doubling speed quadruples distance: 6×4=24m."
        },
        {
          subject: "Chemistry", chapter: "Atomic Structure", class: "11", type: "diagnostic", exam: "NEET",
          question: "Which of the following describes the shape of a p-orbital?",
          options: ["Spherical", "Dumbbell", "Double Dumbbell", "Complex"],
          correctAnswer: "Dumbbell",
          explanation: "p-orbitals have a dumbbell shape."
        },
        {
          subject: "Biology", chapter: "The Living World", class: "11", type: "diagnostic", exam: "NEET",
          question: "The scientific name of mango is written as",
          options: ["Mangifera indica", "Mangifera Indica", "mangifera indica", "Mangifera indica Linn"],
          correctAnswer: "Mangifera indica",
          explanation: "Binomial nomenclature: genus name starts with capital letter, species epithet starts with lowercase, both italicized."
        },
        {
          subject: "Biology", chapter: "Biological Classification", class: "11", type: "diagnostic", exam: "NEET",
          question: "Which of the following is a prokaryote?",
          options: ["Amoeba", "Paramecium", "Bacteria", "Yeast"],
          correctAnswer: "Bacteria",
          explanation: "Bacteria are prokaryotic; Amoeba, Paramecium, Yeast are eukaryotic."
        },
        {
          subject: "Physics", chapter: "Laws of Motion", class: "11", type: "diagnostic", exam: "NEET",
          question: "Newton's second law of motion gives the measure of",
          options: ["Force", "Acceleration", "Momentum", "Impulse"],
          correctAnswer: "Force",
          explanation: "F = ma, Newton's second law defines force."
        },
        {
          subject: "Chemistry", chapter: "Some Basic Concepts of Chemistry", class: "11", type: "diagnostic", exam: "NEET",
          question: "The number of moles in 52 g of He is",
          options: ["1", "13", "26", "52"],
          correctAnswer: "13",
          explanation: "Molar mass of He is 4 g/mol, so moles = 52/4 = 13."
        },
        {
          subject: "Mathematics", chapter: "Trigonometry", class: "11", type: "diagnostic", exam: "JEE",
          question: "The value of sin 60° cos 30° + sin 30° cos 60° is",
          options: ["0", "1/2", "1", "2"],
          correctAnswer: "1",
          explanation: "Using sin(A+B) = sinA cosB + cosA sinB, so sin(60+30) = sin90° = 1."
        },
        {
          subject: "Physics", chapter: "Work, Energy and Power", class: "11", type: "diagnostic", exam: "JEE",
          question: "Kinetic energy of a body is 100 J. If its mass is doubled and speed is halved, new kinetic energy is",
          options: ["25 J", "50 J", "100 J", "200 J"],
          correctAnswer: "50 J",
          explanation: "KE = (1/2)mv². New KE = (1/2)(2m)(v/2)² = (1/2)(2m)(v²/4) = (1/2)mv² / 2 = 100/2 = 50 J."
        },
        {
          subject: "Chemistry", chapter: "Chemical Bonding", class: "11", type: "diagnostic", exam: "JEE",
          question: "The bond angle in water molecule is approximately",
          options: ["180°", "120°", "109.5°", "104.5°"],
          correctAnswer: "104.5°",
          explanation: "Water has bent shape with bond angle ~104.5° due to lone pair repulsion."
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

