
import mongoose from 'mongoose';

const mockTestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  subject: String,
  chapter: String,
  class: String,
  questions: mongoose.Schema.Types.Mixed,
  score: Number,
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('MockTest', mockTestSchema);

