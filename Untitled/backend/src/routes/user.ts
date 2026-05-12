import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// XP log qo'shish uchun to'g'ri SQL
const xpStmt = db.prepare('INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)');

// Auto check-in endpoint
router.post('/auto-checkin', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if already checked in today
  const existingCheckin = db.prepare(`
    SELECT id FROM daily_checkins 
    WHERE user_id = ? AND DATE(checkin_date) = ?
  `).get(req.user!.id, today);
  
  if (existingCheckin) {
    return res.json({ success: false, error: { message: 'Already checked in today', code: 'ALREADY_CHECKED_IN' } });
  }
  
  // Get user data
  const user = db.prepare('SELECT streak_days, longest_streak, xp FROM users WHERE id = ?').get(req.user!.id) as any;
  
  // Calculate new streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const yesterdayCheckin = db.prepare(`
    SELECT id FROM daily_checkins 
    WHERE user_id = ? AND DATE(checkin_date) = ?
  `).get(req.user!.id, yesterdayStr);
  
  let newStreak = yesterdayCheckin ? user.streak_days + 1 : 1;
  let newLongest = Math.max(newStreak, user.longest_streak);
  
  // Calculate XP and level
  const xpGain = 10; // Daily check-in gives 10 XP
  const newXp = user.xp + xpGain;
  const newLevel = Math.floor(newXp / 500) + 1;
  
  // Update user
  const updateStmt = db.prepare(`
    UPDATE users 
    SET streak_days = ?, longest_streak = ?, xp = ?, level = ?
    WHERE id = ?
  `);
  updateStmt.run(newStreak, newLongest, newXp, newLevel, req.user!.id);
  
  // Log XP - TO'G'RI SQL
  xpStmt.run(req.user!.id, xpGain, 'Daily check-in');
  
  // Add check-in record
  db.prepare('INSERT INTO daily_checkins (user_id, checkin_date) VALUES (?, ?)').run(req.user!.id, today);
  
  res.json({
    success: true,
    data: {
      streakDays: newStreak,
      xpGained: xpGain,
      isNew: true
    }
  });
}));

export { router as userRouter };
