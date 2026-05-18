import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const localPath = 'C:\\Users\\Saarathi N\\Downloads\\ncert ooks\\11th biology';
const cloudinaryFolder = 'mastery/ncert/11th biology';

async function uploadFolder(folderPath, targetFolder) {
  if (!fs.existsSync(folderPath)) {
    console.error('Folder not found:', folderPath);
    return;
  }

  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      await uploadFolder(fullPath, `${targetFolder}/${entry.name}`);
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      console.log('Uploading:', fullPath);
      try {
        const res = await cloudinary.uploader.upload(fullPath, {
          folder: targetFolder,
          resource_type: 'raw',
          public_id: path.parse(entry.name).name,
          use_filename: true,
          unique_filename: false,
        });
        console.log('✅', res.secure_url);
      } catch (err) {
        console.error('❌ Failed:', entry.name, err.message || err);
      }
    }
  }
}

async function main() {
  console.log('Uploading NCERT 11 Biology from', localPath);
  await uploadFolder(localPath, cloudinaryFolder);
  console.log('Done.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
