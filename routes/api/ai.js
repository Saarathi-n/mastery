
import express from 'express';
import { chatWithTutor } from '../../controllers/aiController.js';

const router = express.Router();

router.post('/tutor', chatWithTutor);

export default router;

