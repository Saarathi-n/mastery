
import express from 'express';
import { 
  getQuestions, 
  getDiagnosticQuestions, 
  getScreenTestQuestions 
} from '../../controllers/questionController.js';
import { authenticate, authenticateFlexible } from '../../middleware/auth.js';

const router = express.Router();

router.get('/', authenticate, getQuestions);
router.get('/diagnostic', authenticateFlexible, getDiagnosticQuestions);
router.get('/screentest', authenticateFlexible, getScreenTestQuestions);

export default router;

