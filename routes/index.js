
import express from 'express';
import authRoutes from './api/auth.js';
import userRoutes from './api/user.js';
import questionRoutes from './api/questions.js';
import pdfRoutes from './api/pdfs.js';
import aiRoutes from './api/ai.js';
import mocktestRoutes from './api/mocktests.js';
import progressRoutes from './api/progress.js';
import libraryRoutes from './api/library.js';
import screentestRoutes from './api/screentest.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/questions', questionRoutes);
router.use('/pdfs', pdfRoutes);
router.use('/ai', aiRoutes);
router.use('/mocktests', mocktestRoutes);
router.use('/progress', progressRoutes);
router.use('/library', libraryRoutes);
router.use('/screentest', screentestRoutes);

export default router;

