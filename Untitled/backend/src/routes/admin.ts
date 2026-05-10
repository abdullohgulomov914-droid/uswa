import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateAdmin, logAdminAction, requireAdmin } from '../middleware/admin.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get admin dashboard stats
router.get('/stats', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  // User stats
  const userStats = db.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN telegram_id IS NOT NULL THEN 1 ELSE 0 END) as telegram_users,
      SUM(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as new_today,
      SUM(CASE WHEN is_banned = 1 THEN 1 ELSE 0 END) as banned_users
    FROM users
  `).get() as any;

  // Activity stats (last 7 days)
  const activityStats = db.prepare(`
    SELECT 
      COUNT(*) as total_entries,
      COUNT(DISTINCT user_id) as active_users
    FROM journal_entries
    WHERE created_at > datetime('now', '-7 days')
  `).get() as any;

  // Relapse stats (last 7 days)
  const relapseStats = db.prepare(`
    SELECT COUNT(*) as relapses_last_7_days
    FROM relapses
    WHERE logged_at > datetime('now', '-7 days')
  `).get() as any;

  // Top streaks
  const topStreaks = db.prepare(`
    SELECT display_name, telegram_username, streak_days, longest_streak
    FROM users
    ORDER BY streak_days DESC
    LIMIT 10
  `).all() as any[];

  res.json({
    success: true,
    data: {
      users: {
        total: userStats.total_users,
        telegram: userStats.telegram_users,
        newToday: userStats.new_today,
        banned: userStats.banned_users,
      },
      activity: {
        journalEntriesLast7Days: activityStats.total_entries,
        activeUsersLast7Days: activityStats.active_users,
        relapsesLast7Days: relapseStats.relapses_last_7_days,
      },
      topStreaks: topStreaks.map(u => ({
        displayName: u.display_name,
        telegramUsername: u.telegram_username,
        streakDays: u.streak_days,
        longestStreak: u.longest_streak,
      })),
    },
  });
}));

// Get all users (paginated)
router.get('/users', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', search = '' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = `
    SELECT id, telegram_id, telegram_username, username, email, display_name, 
           streak_days, longest_streak, xp, level, is_admin, is_banned, created_at
    FROM users
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    query += ` AND (display_name LIKE ? OR telegram_username LIKE ? OR username LIKE ? OR email LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }

  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit as string), offset);

  const users = db.prepare(query).all(...params) as any[];

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const countParams: any[] = [];
  if (search) {
    countQuery += ` AND (display_name LIKE ? OR telegram_username LIKE ? OR username LIKE ? OR email LIKE ?)`;
    const searchPattern = `%${search}%`;
    countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
  }
  const total = db.prepare(countQuery).get(...countParams) as any;

  res.json({
    success: true,
    data: {
      users: users.map(u => ({
        id: u.id,
        telegramId: u.telegram_id,
        telegramUsername: u.telegram_username,
        username: u.username,
        email: u.email,
        displayName: u.display_name,
        streakDays: u.streak_days,
        longestStreak: u.longest_streak,
        xp: u.xp,
        level: u.level,
        isAdmin: Boolean(u.is_admin),
        isBanned: Boolean(u.is_banned),
        createdAt: u.created_at,
      })),
      pagination: {
        total: total.total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total.total / parseInt(limit as string)),
      },
    },
  });
}));

// Get user details
router.get('/users/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const user = db.prepare(`
    SELECT id, telegram_id, telegram_username, username, email, display_name,
           streak_days, longest_streak, last_relapse_date, xp, level,
           is_admin, is_banned, created_at
    FROM users WHERE id = ?
  `).get(req.params.id) as any;

  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }

  // Get user's journal entries count
  const journalStats = db.prepare(`
    SELECT COUNT(*) as total, 
           COUNT(CASE WHEN type = 'trigger' THEN 1 END) as triggers,
           COUNT(CASE WHEN type = 'tackle' THEN 1 END) as tackles
    FROM journal_entries WHERE user_id = ?
  `).get(req.params.id) as any;

  // Get relapse count
  const relapseCount = db.prepare(`
    SELECT COUNT(*) as total FROM relapses WHERE user_id = ?
  `).get(req.params.id) as any;

  // Get recent activity
  const recentEntries = db.prepare(`
    SELECT id, type, content, created_at
    FROM journal_entries
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 5
  `).all(req.params.id) as any[];

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        telegramUsername: user.telegram_username,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        streakDays: user.streak_days,
        longestStreak: user.longest_streak,
        lastRelapseDate: user.last_relapse_date,
        xp: user.xp,
        level: user.level,
        isAdmin: Boolean(user.is_admin),
        isBanned: Boolean(user.is_banned),
        createdAt: user.created_at,
      },
      stats: {
        journalEntries: journalStats.total,
        triggersLogged: journalStats.triggers,
        tacklesLogged: journalStats.tackles,
        relapses: relapseCount.total,
      },
      recentActivity: recentEntries.map(e => ({
        id: e.id,
        type: e.type,
        content: e.content.substring(0, 100),
        createdAt: e.created_at,
      })),
    },
  });
}));

// Ban/unban user
router.post('/users/:id/ban', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({ banned: z.boolean(), reason: z.string().optional() });
  const data = schema.parse(req.body);

  const stmt = db.prepare('UPDATE users SET is_banned = ? WHERE id = ?');
  const result = stmt.run(data.banned ? 1 : 0, req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }

  // Log admin action
  logAdminAction(
    req.user!.id,
    data.banned ? 'BAN_USER' : 'UNBAN_USER',
    parseInt(req.params.id),
    data.reason || `User ${data.banned ? 'banned' : 'unbanned'} by admin`,
    req.ip
  );

  res.json({
    success: true,
    message: data.banned ? 'User banned' : 'User unbanned',
  });
}));

// Make user admin
router.post('/users/:id/admin', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({ admin: z.boolean() });
  const data = schema.parse(req.body);

  const stmt = db.prepare('UPDATE users SET is_admin = ? WHERE id = ?');
  const result = stmt.run(data.admin ? 1 : 0, req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }

  // Log admin action
  logAdminAction(
    req.user!.id,
    data.admin ? 'MAKE_ADMIN' : 'REMOVE_ADMIN',
    parseInt(req.params.id),
    `Admin status ${data.admin ? 'granted' : 'removed'}`,
    req.ip
  );

  res.json({
    success: true,
    message: data.admin ? 'User promoted to admin' : 'Admin rights removed',
  });
}));

// Delete user
router.delete('/users/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }

  // Log admin action
  logAdminAction(req.user!.id, 'DELETE_USER', parseInt(req.params.id), 'User permanently deleted', req.ip);

  res.json({ success: true, message: 'User deleted' });
}));

// Get community posts (admin view - includes non-anonymous author info)
router.get('/community', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const posts = db.prepare(`
    SELECT 
      cp.id, cp.content, cp.is_anonymous, cp.likes, cp.created_at,
      u.id as user_id, u.display_name, u.telegram_username
    FROM community_posts cp
    JOIN users u ON cp.user_id = u.id
    ORDER BY cp.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit as string), offset) as any[];

  const total = db.prepare('SELECT COUNT(*) as total FROM community_posts').get() as any;

  res.json({
    success: true,
    data: {
      posts: posts.map(p => ({
        id: p.id,
        content: p.content,
        isAnonymous: Boolean(p.is_anonymous),
        likes: p.likes,
        createdAt: p.created_at,
        author: {
          id: p.user_id,
          displayName: p.display_name,
          telegramUsername: p.telegram_username,
        },
      })),
      pagination: {
        total: total.total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(total.total / parseInt(limit as string)),
      },
    },
  });
}));

// Delete community post
router.delete('/community/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare('DELETE FROM community_posts WHERE id = ?');
  const result = stmt.run(req.params.id);

  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'Post not found' } });
    return;
  }

  // Log admin action
  logAdminAction(req.user!.id, 'DELETE_POST', undefined, `Post ${req.params.id} deleted`, req.ip);

  res.json({ success: true, message: 'Post deleted' });
}));

// Get admin logs
router.get('/logs', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '50' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const logs = db.prepare(`
    SELECT 
      al.id, al.action, al.details, al.ip_address, al.created_at,
      a.display_name as admin_name,
      t.display_name as target_name
    FROM admin_logs al
    JOIN users a ON al.admin_id = a.id
    LEFT JOIN users t ON al.target_user_id = t.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit as string), offset) as any[];

  res.json({
    success: true,
    data: logs.map(l => ({
      id: l.id,
      action: l.action,
      admin: l.admin_name,
      target: l.target_name,
      details: l.details,
      ipAddress: l.ip_address,
      createdAt: l.created_at,
    })),
  });
}));

// Send broadcast message to all users (admin only)
router.post('/broadcast', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({ message: z.string().min(1).max(4096) });
  const data = schema.parse(req.body);

  // Get all Telegram users
  const users = db.prepare(`
    SELECT telegram_id FROM users 
    WHERE telegram_id IS NOT NULL AND is_banned = 0
  `).all() as any[];

  // Note: In production, you'd use a queue for this
  // For now, just log the broadcast
  logAdminAction(
    req.user!.id,
    'BROADCAST',
    undefined,
    `Message sent to ${users.length} users: ${data.message.substring(0, 100)}`,
    req.ip
  );

  res.json({
    success: true,
    message: `Broadcast queued for ${users.length} users`,
  });
}));

// Export user data (admin can export any user, user can export themselves)
router.get('/export/:userId?', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const targetUserId = req.params.userId ? parseInt(req.params.userId as string) : req.user!.id;
  const isAdmin = req.user!.isAdmin;
  
  // Non-admin can only export their own data
  if (!isAdmin && targetUserId !== req.user!.id) {
    res.status(403).json({ success: false, error: { message: 'Access denied' } });
    return;
  }

  // Get user data (exclude sensitive/problem field from admin view)
  const user = db.prepare(`
    SELECT id, telegram_id, telegram_username, username, email, display_name,
           streak_days, longest_streak, last_relapse_date, xp, level,
           is_admin, is_banned, created_at, updated_at
    FROM users WHERE id = ?
  `).get(targetUserId) as any;

  if (!user) {
    res.status(404).json({ success: false, error: { message: 'User not found' } });
    return;
  }

  // Get journal entries
  const journalEntries = db.prepare(`
    SELECT id, type, title, content, trigger_time, trigger_location, trigger_feeling, created_at
    FROM journal_entries WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(targetUserId) as any[];

  // Get relapses
  const relapses = db.prepare(`
    SELECT id, trigger, notes, mood, logged_at
    FROM relapses WHERE user_id = ?
    ORDER BY logged_at DESC
  `).all(targetUserId) as any[];

  // Get emergency sessions
  const emergencySessions = db.prepare(`
    SELECT id, technique, was_successful, duration_seconds, started_at, completed_at
    FROM emergency_sessions WHERE user_id = ?
    ORDER BY started_at DESC
  `).all(targetUserId) as any[];

  // Get check-ins
  const checkIns = db.prepare(`
    SELECT id, check_in_date, xp_earned, created_at
    FROM check_ins WHERE user_id = ?
    ORDER BY check_in_date DESC
  `).all(targetUserId) as any[];

  // Compile export data
  const exportData = {
    user: {
      id: user.id,
      telegramId: user.telegram_id,
      telegramUsername: user.telegram_username,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      streakDays: user.streak_days,
      longestStreak: user.longest_streak,
      lastRelapseDate: user.last_relapse_date,
      xp: user.xp,
      level: user.level,
      isAdmin: Boolean(user.is_admin),
      isBanned: Boolean(user.is_banned),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
    journalEntries: journalEntries.map(e => ({
      id: e.id,
      type: e.type,
      title: e.title,
      content: e.content,
      triggerTime: e.trigger_time,
      triggerLocation: e.trigger_location,
      triggerFeeling: e.trigger_feeling,
      createdAt: e.created_at,
    })),
    relapses: relapses.map(r => ({
      id: r.id,
      trigger: r.trigger,
      notes: r.notes,
      mood: r.mood,
      loggedAt: r.logged_at,
    })),
    emergencySessions: emergencySessions.map(s => ({
      id: s.id,
      technique: s.technique,
      wasSuccessful: Boolean(s.was_successful),
      durationSeconds: s.duration_seconds,
      startedAt: s.started_at,
      completedAt: s.completed_at,
    })),
    checkIns: checkIns.map(c => ({
      id: c.id,
      checkInDate: c.check_in_date,
      xpEarned: c.xp_earned,
      createdAt: c.created_at,
    })),
    exportMetadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user!.id,
      isAdminExport: isAdmin && targetUserId !== req.user!.id,
    },
  };

  // Set headers for JSON download
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="user_${targetUserId}_export_${new Date().toISOString().split('T')[0]}.json"`);
  
  res.json({
    success: true,
    data: exportData,
  });
}));

// Articles CRUD (admin)
router.get('/articles', authenticateAdmin, asyncHandler(async (_req, res) => {
  const articles = db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all();
  res.json({ success: true, data: articles });
}));

router.post('/articles', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    content: z.string().min(1),
    problem_type: z.string().optional(),
    source: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const result = db.prepare(
    'INSERT INTO articles (title, summary, content, problem_type, source) VALUES (?, ?, ?, ?, ?)'
  ).run(data.title, data.summary, data.content, data.problem_type || null, data.source || null);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, ...data } });
}));

router.patch('/articles/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(1).optional(),
    summary: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    problem_type: z.string().optional(),
    source: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), req.params.id];
  db.prepare(`UPDATE articles SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  res.json({ success: true });
}));

router.delete('/articles/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Glossary CRUD (admin)
router.get('/glossary', authenticateAdmin, asyncHandler(async (_req, res) => {
  const terms = db.prepare('SELECT * FROM glossary ORDER BY term ASC').all();
  res.json({ success: true, data: terms });
}));

router.post('/glossary', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    term: z.string().min(1),
    definition: z.string().min(1),
    category: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const result = db.prepare(
    'INSERT INTO glossary (term, definition, category) VALUES (?, ?, ?)'
  ).run(data.term, data.definition, data.category || null);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, ...data } });
}));

router.patch('/glossary/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    term: z.string().min(1).optional(),
    definition: z.string().min(1).optional(),
    category: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), req.params.id];
  db.prepare(`UPDATE glossary SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
  res.json({ success: true });
}));

router.delete('/glossary/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  db.prepare('DELETE FROM glossary WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Real broadcast via Telegram bot
router.post('/broadcast', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({ message: z.string().min(1).max(4096) });
  const data = schema.parse(req.body);

  const users = db.prepare(`SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL AND is_banned = 0`).all() as any[];

  // Save as global notification
  db.prepare('INSERT INTO notifications (user_id, title, body, type) VALUES (NULL, ?, ?, ?)').run(
    'Uswaa xabari', data.message, 'broadcast'
  );

  // Send via Telegram bot
  let sent = 0;
  const { bot } = await import('../services/telegramBot.js');
  for (const u of users) {
    try {
      await bot.telegram.sendMessage(u.telegram_id, `📢 *Uswaa xabari*\n\n${data.message}`, { parse_mode: 'Markdown' });
      sent++;
    } catch { /* user blocked bot */ }
  }

  logAdminAction(req.user!.id, 'BROADCAST', undefined, `Sent to ${sent}/${users.length} users`, req.ip);
  res.json({ success: true, message: `${sent} ta foydalanuvchiga yuborildi` });
}));

// Polls CRUD (admin)
router.get('/polls', authenticateAdmin, asyncHandler(async (_req, res) => {
  const polls = db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all() as any[];
  res.json({
    success: true,
    data: polls.map(p => ({ ...p, options: JSON.parse(p.options) })),
  });
}));

router.post('/polls', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(6),
    problem_type: z.string().optional(),
  });
  const data = schema.parse(req.body);
  const result = db.prepare(
    'INSERT INTO polls (question, options, problem_type) VALUES (?, ?, ?)'
  ).run(data.question, JSON.stringify(data.options), data.problem_type || null);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));

router.patch('/polls/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({ is_active: z.boolean().optional(), question: z.string().optional() });
  const data = schema.parse(req.body);
  if (data.is_active !== undefined) {
    db.prepare('UPDATE polls SET is_active = ? WHERE id = ?').run(data.is_active ? 1 : 0, req.params.id);
  }
  if (data.question) {
    db.prepare('UPDATE polls SET question = ? WHERE id = ?').run(data.question, req.params.id);
  }
  res.json({ success: true });
}));

router.delete('/polls/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  db.prepare('DELETE FROM polls WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Send notification to specific user or all
router.post('/notify', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    userId: z.number().optional(),
    type: z.string().default('admin'),
  });
  const data = schema.parse(req.body);
  db.prepare('INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)').run(
    data.userId || null, data.title, data.body, data.type
  );
  res.json({ success: true });
}));

export { router as adminRouter };
