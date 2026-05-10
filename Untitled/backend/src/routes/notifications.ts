import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get notifications for user
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const notifications = db.prepare(`
    SELECT id, title, body, type, is_read, created_at
    FROM notifications
    WHERE user_id = ? OR user_id IS NULL
    ORDER BY created_at DESC
    LIMIT 50
  `).all(req.user!.id) as any[];

  res.json({
    success: true,
    data: notifications.map(n => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      isRead: Boolean(n.is_read),
      createdAt: n.created_at,
    })),
  });
}));

// Mark all as read
router.post('/read-all', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  db.prepare(`
    UPDATE notifications SET is_read = 1
    WHERE user_id = ? OR user_id IS NULL
  `).run(req.user!.id);
  res.json({ success: true });
}));

// Get unread count
router.get('/unread', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM notifications
    WHERE (user_id = ? OR user_id IS NULL) AND is_read = 0
  `).get(req.user!.id) as any;
  res.json({ success: true, data: { count: row.count } });
}));

// Get weekly report
router.get('/weekly-report', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString();

  // User registered date
  const user = db.prepare('SELECT created_at, streak_days, longest_streak, xp, level, problem FROM users WHERE id = ?').get(userId) as any;
  if (!user) { res.status(404).json({ success: false }); return; }

  const daysSinceJoin = Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000);
  if (daysSinceJoin < 7) {
    res.json({ success: true, data: null, message: 'Haftalik hisobot uchun kamida 7 kun kerak' });
    return;
  }

  const triggers = db.prepare(`SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ? AND type = 'trigger' AND created_at > ?`).get(userId, sevenDaysAgoStr) as any;
  const tackles = db.prepare(`SELECT COUNT(*) as count FROM journal_entries WHERE user_id = ? AND type = 'tackle' AND created_at > ?`).get(userId, sevenDaysAgoStr) as any;
  const relapses = db.prepare(`SELECT COUNT(*) as count FROM relapses WHERE user_id = ? AND logged_at > ?`).get(userId, sevenDaysAgoStr) as any;
  const emergency = db.prepare(`SELECT COUNT(*) as total, SUM(CASE WHEN was_successful=1 THEN 1 ELSE 0 END) as success FROM emergency_sessions WHERE user_id = ? AND started_at > ?`).get(userId, sevenDaysAgoStr) as any;
  const xpGained = db.prepare(`SELECT SUM(amount) as total FROM xp_log WHERE user_id = ? AND created_at > ?`).get(userId, sevenDaysAgoStr) as any;

  // Streak change this week
  const prevStreak = Math.max(0, user.streak_days - 7);

  res.json({
    success: true,
    data: {
      weekNumber: Math.ceil(daysSinceJoin / 7),
      streakDays: user.streak_days,
      streakChange: user.streak_days - prevStreak,
      longestStreak: user.longest_streak,
      triggersLogged: triggers.count,
      tacklesLogged: tackles.count,
      relapsesThisWeek: relapses.count,
      emergencySessions: { total: emergency.total || 0, successful: emergency.success || 0 },
      xpGained: xpGained.total || 0,
      level: user.level,
      problem: user.problem,
    },
  });
}));

export { router as notificationsRouter };
