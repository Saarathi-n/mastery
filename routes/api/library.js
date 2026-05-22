
import express from 'express';
import { 
  getLibraryChapters, 
  getLibraryFile, 
  getLibraryAsset, 
  getLibraryPYQ, 
  getLibraryMockTest 
} from '../../controllers/libraryController.js';
import { authenticate, authenticateFlexible } from '../../middleware/auth.js';

const router = express.Router();

router.get('/chapters', authenticate, getLibraryChapters);
router.get('/file', authenticateFlexible, getLibraryFile);
router.get('/asset', authenticate, getLibraryAsset);
router.get('/pyq', authenticate, getLibraryPYQ);
router.get('/mocktest', authenticate, getLibraryMockTest);

export default router;

