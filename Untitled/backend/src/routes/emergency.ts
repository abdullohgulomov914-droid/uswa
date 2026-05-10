import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const startSessionSchema = z.object({
  technique: z.string().default('4-7-8 breathing'),
});

const endSessionSchema = z.object({
  wasSuccessful: z.boolean(),
  durationSeconds: z.number().min(0),
});

// Start emergency session
router.post('/start', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const data = startSessionSchema.parse(req.body);
  
  const stmt = db.prepare(`
    INSERT INTO emergency_sessions (user_id, started_at, technique_used)
    VALUES (?, ?, ?)
  `);
  
  const now = new Date().toISOString();
  const result = stmt.run(req.user!.id, now, data.technique);
  
  res.status(201).json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      startedAt: now,
      technique: data.technique,
    },
  });
}));

// Complete emergency session
router.post('/complete/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const data = endSessionSchema.parse(req.body);
  
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE emergency_sessions
    SET completed_at = ?, was_successful = ?, duration_seconds = ?
    WHERE id = ? AND user_id = ?
  `);
  
  const result = stmt.run(
    now,
    data.wasSuccessful ? 1 : 0,
    data.durationSeconds,
    req.params.id,
    req.user!.id
  );
  
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'Session not found' } });
    return;
  }
  
  // Add XP for completing session
  const xpAmount = data.wasSuccessful ? 50 : 10;
  
  const xpStmt = db.prepare('INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)');
  xpStmt.run(req.user!.id, xpAmount, `Emergency session ${data.wasSuccessful ? 'success' : 'attempt'}`);
  
  const userStmt = db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
  userStmt.run(xpAmount, req.user!.id);
  
  res.json({
    success: true,
    message: data.wasSuccessful 
      ? 'Qoyilmaqom! You surfed the urge.' 
      : 'Even trying counts. You are building strength.',
    data: {
      completedAt: now,
      wasSuccessful: data.wasSuccessful,
      xpGained: xpAmount,
    },
  });
}));

// Get session stats
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const totalStmt = db.prepare(`
    SELECT 
      COUNT(*) as total_sessions,
      SUM(CASE WHEN was_successful = 1 THEN 1 ELSE 0 END) as successful_sessions,
      AVG(duration_seconds) as avg_duration
    FROM emergency_sessions 
    WHERE user_id = ?
  `);
  const stats = totalStmt.get(req.user!.id) as any;
  
  // Recent sessions
  const recentStmt = db.prepare(`
    SELECT id, started_at, completed_at, duration_seconds, was_successful, technique_used
    FROM emergency_sessions
    WHERE user_id = ? AND completed_at IS NOT NULL
    ORDER BY completed_at DESC
    LIMIT 10
  `);
  const recent = recentStmt.all(req.user!.id);
  
  res.json({
    success: true,
    data: {
      totalSessions: stats.total_sessions || 0,
      successfulSessions: stats.successful_sessions || 0,
      successRate: stats.total_sessions > 0 
        ? Math.round((stats.successful_sessions / stats.total_sessions) * 100) 
        : 0,
      averageDurationSeconds: Math.round(stats.avg_duration || 0),
      recentSessions: (recent as any[]).map((s) => ({
        id: s.id,
        startedAt: s.started_at,
        completedAt: s.completed_at,
        durationSeconds: s.duration_seconds,
        wasSuccessful: Boolean(s.was_successful),
        technique: s.technique_used,
      })),
    },
  });
}));

// Get quick actions/tips for emergency
router.get('/tips', authenticateToken, asyncHandler(async (_req: AuthRequest, res) => {
  const tips = [
    { icon: 'Droplets', text: 'Bir stakan suv ichish', action: 'drink_water' },
    { icon: 'Heart', text: '10 marta otjimaniya', action: 'pushups' },
    { icon: 'PhoneCall', text: "Do'stga qo'ng'iroq qilish", action: 'call_friend' },
    { icon: 'Wind', text: '5 daqiqalik sayr', action: 'walk' },
    { icon: 'Brain', text: 'Muz bilan yuzni sirqatish', action: 'cold_water' },
    { icon: 'Music', text: 'Energetik musiqa eshitish', action: 'music' },
  ];
  
  res.json({ success: true, data: tips });
}));

export { router as emergencyRouter };
