import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const postSchema = z.object({
  content: z.string().min(1).max(1000),
  isAnonymous: z.boolean().default(true),
});

// Get community posts (with pagination)
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { limit = '20', offset = '0' } = req.query;
  
  const stmt = db.prepare(`
    SELECT 
      cp.id,
      cp.content,
      cp.is_anonymous,
      cp.likes,
      cp.created_at,
      CASE WHEN cp.is_anonymous = 0 THEN u.display_name ELSE NULL END as author_name,
      CASE WHEN cp.is_anonymous = 1 THEN NULL ELSE u.level END as author_level,
      cp.user_id = ? as is_own_post
    FROM community_posts cp
    LEFT JOIN users u ON cp.user_id = u.id
    ORDER BY cp.created_at DESC
    LIMIT ? OFFSET ?
  `);
  
  const posts = stmt.all(req.user!.id, parseInt(limit as string), parseInt(offset as string));
  
  res.json({
    success: true,
    data: (posts as any[]).map((p) => ({
      id: p.id,
      content: p.content,
      isAnonymous: Boolean(p.is_anonymous),
      likes: p.likes,
      createdAt: p.created_at,
      authorName: p.author_name,
      authorLevel: p.author_level,
      isOwnPost: Boolean(p.is_own_post),
    })),
  });
}));

// Create post
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const data = postSchema.parse(req.body);
  
  const stmt = db.prepare(`
    INSERT INTO community_posts (user_id, content, is_anonymous)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(req.user!.id, data.content, data.isAnonymous ? 1 : 0);
  
  // Add XP for community participation
  const xpStmt = db.prepare('INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)');
  xpStmt.run(req.user!.id, 20, 'Community post created');
  
  const userStmt = db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
  userStmt.run(20, req.user!.id);
  
  res.status(201).json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      content: data.content,
      isAnonymous: data.isAnonymous,
      likes: 0,
      createdAt: new Date().toISOString(),
    },
    xpGained: 20,
  });
}));

// Get own posts
router.get('/my-posts', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare(`
    SELECT id, content, is_anonymous, likes, created_at
    FROM community_posts
    WHERE user_id = ?
    ORDER BY created_at DESC
  `);
  
  const posts = stmt.all(req.user!.id);
  
  res.json({
    success: true,
    data: (posts as any[]).map((p) => ({
      id: p.id,
      content: p.content,
      isAnonymous: Boolean(p.is_anonymous),
      likes: p.likes,
      createdAt: p.created_at,
    })),
  });
}));

// Delete own post
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare('DELETE FROM community_posts WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user!.id);
  
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'Post not found' } });
    return;
  }
  
  res.json({ success: true, message: 'Post deleted' });
}));

// Get random accountability partner (someone with similar streak)
router.get('/buddy', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userStmt = db.prepare('SELECT streak_days FROM users WHERE id = ?');
  const user = userStmt.get(req.user!.id) as any;
  
  // Find someone with similar streak (+/- 3 days)
  const buddyStmt = db.prepare(`
    SELECT id, streak_days, level
    FROM users
    WHERE id != ? 
      AND streak_days BETWEEN ? AND ?
    ORDER BY RANDOM()
    LIMIT 1
  `);
  
  const buddy = buddyStmt.get(
    req.user!.id,
    Math.max(0, user.streak_days - 3),
    user.streak_days + 3
  ) as any;
  
  if (!buddy) {
    // Fallback: just get any other user
    const fallbackStmt = db.prepare(`
      SELECT id, streak_days, level
      FROM users
      WHERE id != ?
      ORDER BY RANDOM()
      LIMIT 1
    `);
    const fallback = fallbackStmt.get(req.user!.id) as any;
    
    if (!fallback) {
      res.json({
        success: true,
        data: null,
        message: 'No accountability partners available yet. Check back later!',
      });
      return;
    }
    
    // Generate random 8-digit anonymous ID for fallback
    const randomId = Math.floor(10000000 + Math.random() * 90000000);
    const anonymousId = `uswaa[${randomId.toString().padStart(8, '0')}]`;
    
    res.json({
      success: true,
      data: {
        id: fallback.id,
        displayName: anonymousId,
        streakDays: fallback.streak_days,
        level: fallback.level,
      },
    });
    return;
  }
  
  // Generate random 8-digit anonymous ID
  const randomId = Math.floor(10000000 + Math.random() * 90000000);
  const anonymousId = `uswaa[${randomId.toString().padStart(8, '0')}]`;
  
  res.json({
    success: true,
    data: {
      id: buddy.id,
      displayName: anonymousId,
      streakDays: buddy.streak_days,
      level: buddy.level,
    },
  });
}));

export { router as communityRouter };
