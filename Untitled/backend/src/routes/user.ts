import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare(`
    SELECT id, username, email, display_name, streak_days, longest_streak, 
           last_relapse_date, start_date, xp, level, is_admin, created_at
    FROM users WHERE id = ?
  `);
  const user = stmt.get(req.user!.id) as any;
  
  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }
  
  // Calculate brain stats based on streak
  const brainStats = calculateBrainStats(user.streak_days);
  
  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      streakDays: user.streak_days,
      longestStreak: user.longest_streak,
      lastRelapseDate: user.last_relapse_date,
      startDate: user.start_date,
      xp: user.xp,
      level: user.level,
      progressPercent: Math.min((user.streak_days / 90) * 100, 100),
      isAdmin: Boolean(user.is_admin),
      brainStats,
    },
  });
}));

// Update user profile
router.patch('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const updateSchema = z.object({
    displayName: z.string().min(1).max(50).optional(),
    age: z.number().min(13).max(100).optional(),
    problem: z.string().min(1).max(100).optional(),
  });
  
  const data = updateSchema.parse(req.body);
  
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.displayName !== undefined) {
    updates.push('display_name = ?');
    values.push(data.displayName);
  }
  
  if (data.age !== undefined) {
    updates.push('age = ?');
    values.push(data.age);
  }
  
  if (data.problem !== undefined) {
    updates.push('problem = ?');
    values.push(data.problem);
  }
  
  if (updates.length > 0) {
    values.push(req.user!.id);
    const stmt = db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }
  
  res.json({ success: true, message: 'Profile updated' });
}));

// Get dashboard stats
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userStmt = db.prepare('SELECT streak_days, xp, level FROM users WHERE id = ?');
  const user = userStmt.get(req.user!.id) as any;
  
  const entryCountStmt = db.prepare('SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ?');
  const entryCount = entryCountStmt.get(req.user!.id) as any;
  
  const relapseCountStmt = db.prepare('SELECT COUNT(*) as count FROM relapses WHERE user_id = ?');
  const relapseCount = relapseCountStmt.get(req.user!.id) as any;
  
  const sessionStmt = db.prepare(`
    SELECT COUNT(*) as total, SUM(CASE WHEN was_successful = 1 THEN 1 ELSE 0 END) as successful
    FROM emergency_sessions WHERE user_id = ?
  `);
  const sessions = sessionStmt.get(req.user!.id) as any;
  
  res.json({
    success: true,
    data: {
      streakDays: user.streak_days,
      xp: user.xp,
      level: user.level,
      progressPercent: Math.min((user.streak_days / 90) * 100, 100),
      journalEntries: entryCount.count,
      relapsesLogged: relapseCount.count,
      emergencySessions: {
        total: sessions.total || 0,
        successful: sessions.successful || 0,
      },
    },
  });
}));

// Record relapse (reset streak)
router.post('/relapse', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const now = new Date().toISOString();
  
  // Get current streak before resetting
  const userStmt = db.prepare('SELECT streak_days, longest_streak FROM users WHERE id = ?');
  const user = userStmt.get(req.user!.id) as any;
  
  // Update longest streak if applicable
  const newLongest = Math.max(user.streak_days, user.longest_streak);
  
  // Reset streak
  const updateStmt = db.prepare(`
    UPDATE users 
    SET streak_days = 0, last_relapse_date = ?, longest_streak = ?
    WHERE id = ?
  `);
  updateStmt.run(now, newLongest, req.user!.id);
  
  res.json({
    success: true,
    message: 'Streak reset. Stay strong - this is just one battle, not the war.',
    data: {
      previousStreak: user.streak_days,
      longestStreak: newLongest,
    },
  });
}));

// Calculate daily streak increment (call this daily via cron or frontend)
router.post('/check-in', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userStmt = db.prepare('SELECT streak_days, longest_streak FROM users WHERE id = ?');
  const user = userStmt.get(req.user!.id) as any;
  
  const newStreak = user.streak_days + 1;
  const newLongest = Math.max(newStreak, user.longest_streak);
  
  // Add XP for check-in
  const xpGain = 10;
  const newXp = calculateLevelUp(user.xp + xpGain);
  
  const updateStmt = db.prepare(`
    UPDATE users 
    SET streak_days = ?, longest_streak = ?, xp = ?, level = ?
    WHERE id = ?
  `);
  updateStmt.run(newStreak, newLongest, newXp.xp, newXp.level, req.user!.id);
  
  // Log XP
  const xpStmt = db.prepare('INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)');
  xpStmt.run(req.user!.id, xpGain, 'Daily check-in');
  
  res.json({
    success: true,
    data: {
      streakDays: newStreak,
      longestStreak: newLongest,
      xpGained: xpGain,
      xp: newXp.xp,
      level: newXp.level,
      leveledUp: newXp.leveledUp,
    },
  });
}));

// Helper functions
function calculateBrainStats(streakDays: number) {
  // Simulate dopamine and prefrontal cortex recovery based on streak
  // Dopamine normalizes over ~90 days, prefrontal strengthens
  const dopamine = Math.max(100, 200 - (streakDays * 1.1));
  const prefrontal = Math.min(100, 30 + (streakDays * 0.78));
  
  return {
    dopamineSensitivity: Math.round(dopamine),
    prefrontalStrength: Math.round(prefrontal),
    recoveryPercent: Math.min(100, Math.round((streakDays / 90) * 100)),
  };
}

function calculateLevelUp(xp: number) {
  // Simple level formula: level = floor(xp / 500) + 1
  const level = Math.floor(xp / 500) + 1;
  const prevLevel = Math.floor((xp - 10) / 500) + 1;
  
  return {
    xp,
    level,
    leveledUp: level > prevLevel,
    xpToNextLevel: level * 500 - xp,
  };
}

// Update user profile (alias for /me PATCH)
router.patch('/profile', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const updateSchema = z.object({
    displayName: z.string().min(1).max(50).optional(),
    age: z.number().min(13).max(100).optional(),
    problem: z.string().min(1).max(100).optional(),
  });
  const data = updateSchema.parse(req.body);
  const updates: string[] = [];
  const values: any[] = [];
  if (data.displayName !== undefined) { updates.push('display_name = ?'); values.push(data.displayName); }
  if (data.age !== undefined) { updates.push('age = ?'); values.push(data.age); }
  if (data.problem !== undefined) { updates.push('problem = ?'); values.push(data.problem); }
  if (updates.length > 0) {
    values.push(req.user!.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }
  res.json({ success: true, message: 'Profile updated' });
}));

// Submit feedback answer
router.post('/feedback-answer', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { requestId, answer } = z.object({ requestId: z.number(), answer: z.string().min(1) }).parse(req.body);
  const request = db.prepare('SELECT id FROM feedback_requests WHERE id = ? AND is_active = 1').get(requestId);
  if (!request) { res.status(404).json({ success: false }); return; }
  // Prevent duplicate
  const existing = db.prepare('SELECT id FROM feedback_answers WHERE request_id = ? AND user_id = ?').get(requestId, req.user!.id);
  if (existing) { res.json({ success: true, message: 'Already answered' }); return; }
  db.prepare('INSERT INTO feedback_answers (request_id, user_id, answer) VALUES (?, ?, ?)').run(requestId, req.user!.id, answer);
  res.json({ success: true });
}));

// Get active feedback request for user
router.get('/feedback-request/active', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const request = db.prepare('SELECT * FROM feedback_requests WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1').get() as any;
  if (!request) { res.json({ success: true, data: null }); return; }
  const answered = db.prepare('SELECT id FROM feedback_answers WHERE request_id = ? AND user_id = ?').get(request.id, req.user!.id);
  res.json({ success: true, data: answered ? null : request });
}));

// Auto daily check-in (call on app open)
router.post('/auto-checkin', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const today = new Date().toISOString().split('T')[0];
  try {
    db.prepare('INSERT INTO daily_checkins (user_id, checkin_date) VALUES (?, ?)').run(req.user!.id, today);
    // New day — increment streak
    const user = db.prepare('SELECT streak_days, longest_streak, xp FROM users WHERE id = ?').get(req.user!.id) as any;
    const newStreak = user.streak_days + 1;
    const newLongest = Math.max(newStreak, user.longest_streak);
    const xpGain = 10;
    const newXp = user.xp + xpGain;
    const newLevel = Math.floor(newXp / 500) + 1;
    db.prepare('UPDATE users SET streak_days=?, longest_streak=?, xp=?, level=? WHERE id=?').run(newStreak, newLongest, newXp, newLevel, req.user!.id);
    db.prepare('INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)').run(req.user!.id, xpGain, 'Daily check-in');
    res.json({ success: true, data: { streakDays: newStreak, xpGained: xpGain, isNew: true } });
  } catch {
    // Already checked in today
    res.json({ success: true, data: { isNew: false } });
  }
}));

export { router as userRouter };
