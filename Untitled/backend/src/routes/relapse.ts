import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const relapseSchema = z.object({
  trigger: z.string().min(1),
  notes: z.string().optional(),
  mood: z.string().optional(),
});

// Get all relapses for user
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare(`
    SELECT id, trigger, notes, mood, logged_at
    FROM relapses 
    WHERE user_id = ?
    ORDER BY logged_at DESC
  `);
  const relapses = stmt.all(req.user!.id);
  
  res.json({
    success: true,
    data: (relapses as any[]).map((r) => ({
      id: r.id,
      trigger: r.trigger,
      notes: r.notes,
      mood: r.mood,
      loggedAt: r.logged_at,
    })),
  });
}));

// Log a relapse
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const data = relapseSchema.parse(req.body);
  
  const now = new Date().toISOString();
  
  // Insert relapse record
  const relapseStmt = db.prepare(`
    INSERT INTO relapses (user_id, trigger, notes, mood, logged_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = relapseStmt.run(
    req.user!.id,
    data.trigger,
    data.notes || null,
    data.mood || null,
    now
  );
  
  // Get current stats for response
  const userStmt = db.prepare('SELECT streak_days, longest_streak FROM users WHERE id = ?');
  const user = userStmt.get(req.user!.id) as any;
  
  const newLongest = Math.max(user.streak_days, user.longest_streak);
  
  // Reset streak in users table (but preserve longest)
  const updateStmt = db.prepare(`
    UPDATE users 
    SET streak_days = 0, last_relapse_date = ?, longest_streak = ?
    WHERE id = ?
  `);
  updateStmt.run(now, newLongest, req.user!.id);
  
  res.status(201).json({
    success: true,
    message: 'Relapse logged. This is not defeat - it is data for your next victory.',
    data: {
      id: result.lastInsertRowid,
      trigger: data.trigger,
      notes: data.notes,
      mood: data.mood,
      loggedAt: now,
      previousStreak: user.streak_days,
      longestStreak: newLongest,
    },
  });
}));

// Get relapse stats
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  // Total count
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM relapses WHERE user_id = ?');
  const count = countStmt.get(req.user!.id) as any;
  
  // Most common triggers
  const triggersStmt = db.prepare(`
    SELECT trigger, COUNT(*) as count
    FROM relapses
    WHERE user_id = ?
    GROUP BY trigger
    ORDER BY count DESC
    LIMIT 5
  `);
  const triggers = triggersStmt.all(req.user!.id);
  
  // Recent trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentStmt = db.prepare(`
    SELECT COUNT(*) as count FROM relapses 
    WHERE user_id = ? AND logged_at > ?
  `);
  const recent = recentStmt.get(req.user!.id, thirtyDaysAgo.toISOString()) as any;
  
  res.json({
    success: true,
    data: {
      totalRelapses: count.count,
      recent30Days: recent.count,
      commonTriggers: triggers,
    },
  });
}));

// Delete relapse record
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare('DELETE FROM relapses WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user!.id);
  
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'Relapse record not found' } });
    return;
  }
  
  res.json({ success: true, message: 'Relapse record deleted' });
}));

export { router as relapseRouter };
