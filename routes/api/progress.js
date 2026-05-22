
import express from 'express';
import { getProgressSummary } from '../../controllers/progressController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.get('/summary', authenticate, getProgressSummary);

export default router;

