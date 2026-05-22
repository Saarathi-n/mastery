
import dotenv from 'dotenv';

dotenv.config();

export default {
  server: {
    port: Number(process.env.PORT) || 5001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mastery',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-key-saarathi',
    expiresIn: '7d',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    defaultFolder: process.env.CLOUDINARY_DEFAULT_FOLDER || 'mastery',
    useCloudinary: process.env.USE_CLOUDINARY === 'true',
  },
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    nvidiaApiKey: process.env.NVIDIA_API_KEY || '',
  },
  paths: {
    libraryRoot: process.env.LIBRARY_ROOT || '',
    pyqRoot: process.env.PYQ_ROOT || '',
  },
  folders: {
    ncert: 'ncert',
    pyq: 'pyq',
    mocktest: 'mocktest',
    screentest: 'screentest',
    neetScreentest: 'neet-screentest',
  }
};

