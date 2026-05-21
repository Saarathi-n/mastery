
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function listCloudinaryAssets() {
  try {
    console.log('Listing all assets in Cloudinary...\n');
    
    const result = await cloudinary.search
      .expression('folder:mastery/*')
      .sort_by('public_id', 'desc')
      .max_results(500)
      .execute();

    console.log(`Found ${result.resources.length} total assets in mastery folder:`);
    
    result.resources.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.public_id} (${resource.resource_type})`);
    });
  } catch (err) {
    console.error('Error fetching assets:', err);
  }
}

listCloudinaryAssets();

