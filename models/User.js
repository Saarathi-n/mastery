
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  grade: String,
  stream: String,
  currentLevel: String,
  diagnosticTestCleared: { type: Boolean, default: false },
  screeningTestTaken: { type: Boolean, default: false },
  screeningTestScore: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema);

