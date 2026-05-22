
import mongoose from 'mongoose';

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
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);

