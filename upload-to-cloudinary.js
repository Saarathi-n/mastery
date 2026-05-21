
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LIBRARY_ROOT = "C:\\Users\\Saarathi N\\Downloads\\ncert ooks";

console.log("Starting Cloudinary NCERT PDF upload...");
console.log("Library root:", LIBRARY_ROOT);

const SUBJECT_MAP = {
  "maths": "Mathematics",
  "math": "Mathematics",
  "physics": "Physics",
  "chemisty": "Chemistry",
  "chemistry": "Chemistry",
  "biology": "Biology"
};

const CLASS_MAP = {
  "11th": "11th",
  "12th": "12th",
  "11": "11th",
  "12": "12th"
};

async function uploadPdf(filePath, cloudinaryFolder) {
  try {
    console.log(`Uploading ${path.basename(filePath)} to ${cloudinaryFolder}...`);
    const result = await cloudinary.uploader.upload(filePath, {
      folder: cloudinaryFolder,
      resource_type: "raw",
      overwrite: true
    });
    console.log(`✓ Uploaded successfully: ${result.public_id}`);
    return result;
  } catch (err) {
    console.error(`✗ Failed to upload ${path.basename(filePath)}:`, err.message);
    return null;
  }
}

function findAllPdfs(dir, baseCloudinaryFolder = "mastery/ncert") {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    console.error("Directory does not exist:", dir);
    return results;
  }

  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      let dirName = item.toLowerCase();
      let classLevel = null;
      let subject = null;

      for (const [key, value] of Object.entries(CLASS_MAP)) {
        if (dirName.includes(key)) {
          classLevel = value;
          break;
        }
      }

      for (const [key, value] of Object.entries(SUBJECT_MAP)) {
        if (dirName.includes(key)) {
          subject = value;
          break;
        }
      }

      let subFolder = baseCloudinaryFolder;
      if (classLevel && subject) {
        subFolder = `${baseCloudinaryFolder}/${classLevel} ${subject}`;
      } else if (classLevel) {
        subFolder = `${baseCloudinaryFolder}/${classLevel}`;
      } else if (subject) {
        subFolder = `${baseCloudinaryFolder}/${subject}`;
      }

      const subResults = findAllPdfs(fullPath, subFolder);
      results.push(...subResults);
    } else if (stat.isFile() && item.toLowerCase().endsWith(".pdf")) {
      results.push({ filePath: fullPath, cloudinaryFolder: baseCloudinaryFolder });
    }
  }

  return results;
}

async function main() {
  const pdfFiles = findAllPdfs(LIBRARY_ROOT);
  console.log(`Found ${pdfFiles.length} PDF files to upload`);
  
  let successCount = 0;
  let failCount = 0;

  for (const pdf of pdfFiles) {
    const result = await uploadPdf(pdf.filePath, pdf.cloudinaryFolder);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log("\nUpload complete!");
  console.log(`Successfully uploaded: ${successCount}`);
  console.log(`Failed to upload: ${failCount}`);
}

main().catch(console.error);

