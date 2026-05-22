
import express from 'express';
import { submitMockTest } from '../../controllers/mocktestController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.post('/submit', authenticate, submitMockTest);

export default router;

