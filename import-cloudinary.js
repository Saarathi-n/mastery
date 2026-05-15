import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

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

const PDF = mongoose.model('PDF', pdfSchema);

function inferTypeFromFolder(folder) {
  if (!folder) return 'other';
  const low = folder.toLowerCase();
  if (low.includes('/ncert') || low.endsWith('/ncert') || low.includes('ncert')) return 'ncert';
  if (low.includes('/pyq') || low.includes('pyq')) return 'pyq';
  if (low.includes('/mocktest') || low.includes('mocktest')) return 'mocktest';
  if (low.includes('/jee') || low.includes('jee')) return 'jee';
  return 'other';
}

async function importAll() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const expr = 'folder:mastery/* AND resource_type:raw';
  let nextCursor = null;
  let total = 0;
  let upserted = 0;

  try {
    do {
      let builder = cloudinary.search.expression(expr).max_results(500);
      if (nextCursor) builder = builder.next_cursor(nextCursor);
      const res = await builder.execute();
      nextCursor = res.next_cursor;

      const resources = res.resources || [];
      for (const r of resources) {
        total++;
        const publicId = r.public_id;
        const folder = r.folder || (publicId.includes('/') ? publicId.substring(0, publicId.lastIndexOf('/')) : '');
        const type = inferTypeFromFolder(folder);
        const filename = (r.original_filename && r.format) ? `${r.original_filename}.${r.format}` : `${path.basename(publicId)}.${r.format || 'pdf'}`;

        const exists = await PDF.findOne({ cloudinary_public_id: publicId });
        if (exists) continue;

        const pdfDoc = {
          filename,
          cloudinary_public_id: publicId,
          cloudinary_url: r.secure_url || r.url,
          cloudinary_folder: folder,
          type,
          fileSize: r.bytes || 0
        };

        await PDF.create(pdfDoc);
        upserted++;
      }
    } while (nextCursor);

    console.log(`Scanned ${total} resources, created ${upserted} PDF records.`);
  } catch (err) {
    console.error('Error during import:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  importAll().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export default importAll;
