
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.js';

dotenv.config();

async function checkQuestions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const allQuestions = await Question.find();
    console.log('Total questions in DB:', allQuestions.length);
    
    const diagnosticQuestions = await Question.find({ type: 'diagnostic' });
    console.log('Diagnostic questions in DB:', diagnosticQuestions.length);
    
    if (diagnosticQuestions.length > 0) {
      console.log('Sample diagnostic question:', JSON.stringify(diagnosticQuestions[0], null, 2));
    } else {
      console.log('No diagnostic questions found!');
    }

    const allTypes = [...new Set(allQuestions.map(q => q.type))];
    console.log('All question types:', allTypes);
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkQuestions();

