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

const FOLDERS = [
  {
    local: 'C:\\Users\\Saarathi N\\Downloads\\ncert ooks',
    cloudinary: 'mastery/ncert'
  },
  {
    local: 'C:\\Users\\Saarathi N\\Downloads\\jee pyq\\practice',
    cloudinary: 'mastery/pyq'
  },
  {
    local: 'C:\\Users\\Saarathi N\\Downloads\\jee pyq\\mocktest',
    cloudinary: 'mastery/mocktest'
  }
];

async function uploadFolder(localPath, cloudinaryFolder) {
  if (!fs.existsSync(localPath)) {
    console.log(`⚠️ Folder not found, skipping: ${localPath}`);
    return;
  }

  const entries = fs.readdirSync(localPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(localPath, entry.name);

    if (entry.isDirectory()) {
      await uploadFolder(fullPath, `${cloudinaryFolder}/${entry.name}`);
    } else if (
      entry.name.toLowerCase().endsWith('.pdf') ||
      entry.name.toLowerCase().endsWith('.json') ||
      entry.name.toLowerCase().endsWith('.docx') ||
      entry.name.toLowerCase().endsWith('.doc')
    ) {
      console.log(`Uploading: ${fullPath}`);
      try {
        const result = await cloudinary.uploader.upload(fullPath, {
          folder: cloudinaryFolder,
          resource_type: 'raw',
          public_id: path.parse(entry.name).name,
          use_filename: true,
          unique_filename: false,
        });
        console.log(`✅ ${result.secure_url}`);
      } catch (err) {
        console.error(`❌ Failed: ${entry.name}`, err.message);
      }
    }
  }
}

async function uploadAll() {
  for (const folder of FOLDERS) {
    console.log(`\n📁 Uploading: ${folder.cloudinary}`);
    await uploadFolder(folder.local, folder.cloudinary);
  }
  console.log('\n🎉 All uploads complete!');
}

uploadAll().catch(console.error);