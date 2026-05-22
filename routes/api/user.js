
import express from 'express';
import { 
  getUser, 
  updateGradeStream, 
  updateScreeningTest, 
  updateDiagnosticTest 
} from '../../controllers/userController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.get('/:id', authenticate, getUser);
router.put('/:id/grade-stream', authenticate, updateGradeStream);
router.put('/:id/screening', authenticate, updateScreeningTest);
router.put('/:id/diagnostic', authenticate, updateDiagnosticTest);

export default router;

