
import express from 'express';
import { 
  uploadPDF, 
  getPDFs, 
  downloadPDF, 
  upload 
} from '../../controllers/pdfController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.post('/upload', authenticate, upload.single('file'), uploadPDF);
router.get('/', authenticate, getPDFs);
router.get('/download/:fileId', authenticate, downloadPDF);

export default router;

