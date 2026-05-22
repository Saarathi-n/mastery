
import express from 'express';
import { getScreenTestQuestions } from '../../controllers/questionController.js';
import { authenticateFlexible } from '../../middleware/auth.js';

const router = express.Router();

router.get('/questions', authenticateFlexible, getScreenTestQuestions);

export default router;

