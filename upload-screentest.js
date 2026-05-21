import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGO_URI = process.env.MONGODB_URI;

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
});

const PDF = mongoose.models.PDF || mongoose.model('PDF', pdfSchema);

const localPath = 'C:\\\\Users\\\\Saarathi N\\\\Downloads\\\\jee pyq\\\\screen test';
const cloudinaryFolder = 'mastery/screentest';

async function uploadFolder(dirPath, cloudFolder) {
  if (!fs.existsSync(dirPath)) {
    console.log(\Folder not found, skipping: \\);
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await uploadFolder(fullPath, \\/\\);
    } else if (
      entry.name.toLowerCase().endsWith('.pdf') ||
      entry.name.toLowerCase().endsWith('.json') ||
      entry.name.toLowerCase().endsWith('.docx') ||
      entry.name.toLowerCase().endsWith('.doc') ||
      entry.name.toLowerCase().endsWith('.png') ||
      entry.name.toLowerCase().endsWith('.jpg') ||
      entry.name.toLowerCase().endsWith('.jpeg')
    ) {
      console.log(\Uploading: \\);
      try {
        const result = await cloudinary.uploader.upload(fullPath, {
          folder: cloudFolder,
          resource_type: entry.name.toLowerCase().match(/\.(png|jpg|jpeg)$/) ? 'image' : 'raw',
          public_id: path.parse(entry.name).name,
          use_filename: true,
          unique_filename: false,
        });
        
        console.log(\Uploaded to Cloudinary: \\);
        
        // Save to MongoDB
        const publicId = result.public_id;
        const exists = await PDF.findOne({ cloudinary_public_id: publicId });
        if (!exists) {
          await PDF.create({
            filename: entry.name,
            cloudinary_public_id: publicId,
            cloudinary_url: result.secure_url,
            cloudinary_folder: cloudFolder,
            type: 'screentest',
            fileSize: result.bytes || 0
          });
          console.log(\Saved to MongoDB.\);
        } else {
            console.log(\Already exists in MongoDB.\);
        }
      } catch (err) {
        console.error(\Error uploading \:\, err);
      }
    }
  }
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log(\Uploading screen test folder to Cloudinary & DB...\);
  await uploadFolder(localPath, cloudinaryFolder);
  console.log('\\nScreen test uploads complete!');
  await mongoose.disconnect();
}

run().catch(console.error);
