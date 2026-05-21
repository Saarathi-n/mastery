
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fetchQuestionsJSON() {
  try {
    const publicId = 'mastery/ncert/11th physics/01 Units and Measurements/pyq practice/questions';
    
    const url = cloudinary.utils.private_download_url(
      publicId, 
      'json', 
      { resource_type: 'raw' }
    );
    
    console.log('Questions JSON URL:', url);
  } catch (err) {
    console.error('Error:', err);
  }
}

fetchQuestionsJSON();

