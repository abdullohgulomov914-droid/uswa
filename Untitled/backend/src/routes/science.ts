import { Router } from 'express';
import { db } from '../db/index.js';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/articles', authenticateToken, asyncHandler(async (_req, res) => {
  const articles = db.prepare(
    'SELECT id, title, summary, problem_type, source, created_at FROM articles ORDER BY created_at DESC'
  ).all();
  res.json({ success: true, data: articles });
}));

router.get('/articles/:id', authenticateToken, asyncHandler(async (req, res) => {
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article) { res.status(404).json({ success: false }); return; }
  res.json({ success: true, data: article });
}));

router.get('/glossary', authenticateToken, asyncHandler(async (_req, res) => {
  const terms = db.prepare('SELECT * FROM glossary ORDER BY term ASC').all();
  res.json({ success: true, data: terms });
}));

export { router as scienceRouter };
