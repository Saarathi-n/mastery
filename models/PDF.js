
import mongoose from 'mongoose';

const pdfSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId },
  cloudinary_public_id: String,
  cloudinary_url: String,
  cloudinary_folder: String,
  type: { type: String, required: true },
  subject: String,
  chapter: String,
  class: String,
  year: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileSize: Number
}, { timestamps: true });

export default mongoose.model('PDF', pdfSchema);

