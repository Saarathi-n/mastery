import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

const pdfSchema = new mongoose.Schema({
  filename: String,
  cloudinary_public_id: String,
  cloudinary_url: String,
  cloudinary_folder: String,
  type: String
});

const PDF = mongoose.model('PDF_count_tmp', pdfSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const jeeCount = await PDF.countDocuments({ type: 'jee' });
  const pyqCount = await PDF.countDocuments({ type: 'pyq' });
  const pyqOrJeeInFolder = await PDF.countDocuments({ cloudinary_folder: { $regex: '(jee|pyq)', $options: 'i' } });

  console.log(`jee type count: ${jeeCount}`);
  console.log(`pyq type count: ${pyqCount}`);
  console.log(`entries with 'jee' or 'pyq' in cloudinary_folder: ${pyqOrJeeInFolder}`);

  const sampleJee = await PDF.find({ type: 'jee' }).limit(5).select('filename cloudinary_public_id cloudinary_url cloudinary_folder');
  const samplePyq = await PDF.find({ type: 'pyq' }).limit(5).select('filename cloudinary_public_id cloudinary_url cloudinary_folder');

  console.log('\nSample JEE entries:');
  console.log(JSON.stringify(sampleJee, null, 2));
  console.log('\nSample PYQ entries:');
  console.log(JSON.stringify(samplePyq, null, 2));

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
