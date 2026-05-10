import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateAdmin, logAdminAction } from '../middleware/admin.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Stats
router.get('/stats', authenticateAdmin, asyncHandler(async (_req, res) => {
  const userStats = db.prepare(`SELECT COUNT(*) as total_users, SUM(CASE WHEN telegram_id IS NOT NULL THEN 1 ELSE 0 END) as telegram_users, SUM(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as new_today, SUM(CASE WHEN is_banned = 1 THEN 1 ELSE 0 END) as banned_users FROM users`).get() as any;
  const activityStats = db.prepare(`SELECT COUNT(*) as total_entries, COUNT(DISTINCT user_id) as active_users FROM journal_entries WHERE created_at > datetime('now', '-7 days')`).get() as any;
  const relapseStats = db.prepare(`SELECT COUNT(*) as relapses_last_7_days FROM relapses WHERE logged_at > datetime('now', '-7 days')`).get() as any;
  const topStreaks = db.prepare(`SELECT display_name, telegram_username, streak_days, longest_streak FROM users ORDER BY streak_days DESC LIMIT 10`).all() as any[];
  res.json({ success: true, data: { users: { total: userStats.total_users, telegram: userStats.telegram_users, newToday: userStats.new_today, banned: userStats.banned_users }, activity: { journalEntriesLast7Days: activityStats.total_entries, activeUsersLast7Days: activityStats.active_users, relapsesLast7Days: relapseStats.relapses_last_7_days }, topStreaks: topStreaks.map(u => ({ displayName: u.display_name, telegramUsername: u.telegram_username, streakDays: u.streak_days, longestStreak: u.longest_streak })) } });
}));

// Users
router.get('/users', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', search = '' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  let query = `SELECT id, telegram_id, telegram_username, display_name, streak_days, longest_streak, xp, level, is_admin, is_banned, created_at FROM users WHERE 1=1`;
  const params: any[] = [];
  if (search) { query += ` AND (display_name LIKE ? OR telegram_username LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
  query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit as string), offset);
  const users = db.prepare(query).all(...params) as any[];
  const total = db.prepare(`SELECT COUNT(*) as total FROM users WHERE 1=1${search ? ' AND (display_name LIKE ? OR telegram_username LIKE ?)' : ''}`).get(...(search ? [`%${search}%`, `%${search}%`] : [])) as any;
  res.json({ success: true, data: { users: users.map(u => ({ id: u.id, telegramId: u.telegram_id, telegramUsername: u.telegram_username, displayName: u.display_name, streakDays: u.streak_days, longestStreak: u.longest_streak, xp: u.xp, level: u.level, isAdmin: Boolean(u.is_admin), isBanned: Boolean(u.is_banned), createdAt: u.created_at })), pagination: { total: total.total, page: parseInt(page as string), limit: parseInt(limit as string) } } });
}));

router.post('/users/:id/ban', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { banned, reason } = z.object({ banned: z.boolean(), reason: z.string().optional() }).parse(req.body);
  db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(banned ? 1 : 0, req.params.id);
  logAdminAction(req.user!.id, banned ? 'BAN_USER' : 'UNBAN_USER', parseInt(req.params.id), reason, req.ip);
  res.json({ success: true });
}));

router.post('/users/:id/admin', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { admin } = z.object({ admin: z.boolean() }).parse(req.body);
  db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(admin ? 1 : 0, req.params.id);
  logAdminAction(req.user!.id, admin ? 'MAKE_ADMIN' : 'REMOVE_ADMIN', parseInt(req.params.id), undefined, req.ip);
  res.json({ success: true });
}));

router.delete('/users/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  logAdminAction(req.user!.id, 'DELETE_USER', parseInt(req.params.id), 'deleted', req.ip);
  res.json({ success: true });
}));

// Community posts
router.get('/community', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { limit = '20', offset = '0' } = req.query;
  const posts = db.prepare(`SELECT cp.id, cp.content, cp.is_anonymous, cp.likes, cp.created_at, u.id as user_id, u.display_name, u.telegram_username FROM community_posts cp JOIN users u ON cp.user_id = u.id ORDER BY cp.created_at DESC LIMIT ? OFFSET ?`).all(parseInt(limit as string), parseInt(offset as string)) as any[];
  const total = db.prepare('SELECT COUNT(*) as total FROM community_posts').get() as any;
  res.json({ success: true, data: { posts: posts.map(p => ({ id: p.id, content: p.content, isAnonymous: Boolean(p.is_anonymous), likes: p.likes, createdAt: p.created_at, author: { id: p.user_id, displayName: p.display_name, telegramUsername: p.telegram_username } })), total: total.total } });
}));

router.delete('/community/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  db.prepare('DELETE FROM community_posts WHERE id = ?').run(req.params.id);
  logAdminAction(req.user!.id, 'DELETE_POST', undefined, `Post ${req.params.id} deleted`, req.ip);
  res.json({ success: true });
}));

// Logs
router.get('/logs', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { limit = '50', offset = '0' } = req.query;
  const logs = db.prepare(`SELECT al.id, al.action, al.details, al.ip_address, al.created_at, a.display_name as admin_name, t.display_name as target_name FROM admin_logs al JOIN users a ON al.admin_id = a.id LEFT JOIN users t ON al.target_user_id = t.id ORDER BY al.created_at DESC LIMIT ? OFFSET ?`).all(parseInt(limit as string), parseInt(offset as string)) as any[];
  res.json({ success: true, data: logs.map(l => ({ id: l.id, action: l.action, admin: l.admin_name, target: l.target_name, details: l.details, ipAddress: l.ip_address, createdAt: l.created_at })) });
}));

// Broadcast via Telegram
router.post('/broadcast', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { message } = z.object({ message: z.string().min(1).max(4096) }).parse(req.body);
  const users = db.prepare('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL AND is_banned = 0').all() as any[];
  db.prepare('INSERT INTO notifications (user_id, title, body, type) VALUES (NULL, ?, ?, ?)').run('Uswaa xabari', message, 'broadcast');
  let sent = 0;
  const { bot } = await import('../services/telegramBot.js');
  for (const u of users) {
    try { await bot.telegram.sendMessage(u.telegram_id, `📢 *Uswaa xabari*\n\n${message}`, { parse_mode: 'Markdown' }); sent++; } catch { /* blocked */ }
  }
  logAdminAction(req.user!.id, 'BROADCAST', undefined, `Sent to ${sent}/${users.length} users`, req.ip);
  res.json({ success: true, message: `${sent} ta foydalanuvchiga yuborildi` });
}));

// Notify (in-app)
router.post('/notify', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { title, body, userId, type } = z.object({ title: z.string().min(1), body: z.string().min(1), userId: z.number().optional(), type: z.string().default('admin') }).parse(req.body);
  db.prepare('INSERT INTO notifications (user_id, title, body, type) VALUES (?, ?, ?, ?)').run(userId || null, title, body, type);
  res.json({ success: true });
}));

// Articles
router.get('/articles', authenticateAdmin, asyncHandler(async (_req, res) => {
  res.json({ success: true, data: db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all() });
}));
router.post('/articles', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const data = z.object({ title: z.string().min(1), summary: z.string().min(1), content: z.string().min(1), problem_type: z.string().optional(), source: z.string().optional() }).parse(req.body);
  const result = db.prepare('INSERT INTO articles (title, summary, content, problem_type, source) VALUES (?, ?, ?, ?, ?)').run(data.title, data.summary, data.content, data.problem_type || null, data.source || null);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));
router.patch('/articles/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const data = z.object({ title: z.string().optional(), summary: z.string().optional(), content: z.string().optional(), problem_type: z.string().optional(), source: z.string().optional() }).parse(req.body);
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
  if (sets) db.prepare(`UPDATE articles SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...Object.values(data), req.params.id);
  res.json({ success: true });
}));
router.delete('/articles/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Glossary
router.get('/glossary', authenticateAdmin, asyncHandler(async (_req, res) => {
  res.json({ success: true, data: db.prepare('SELECT * FROM glossary ORDER BY term ASC').all() });
}));
router.post('/glossary', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const data = z.object({ term: z.string().min(1), definition: z.string().min(1), category: z.string().optional() }).parse(req.body);
  const result = db.prepare('INSERT INTO glossary (term, definition, category) VALUES (?, ?, ?)').run(data.term, data.definition, data.category || null);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));
router.patch('/glossary/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const data = z.object({ term: z.string().optional(), definition: z.string().optional(), category: z.string().optional() }).parse(req.body);
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
  if (sets) db.prepare(`UPDATE glossary SET ${sets}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...Object.values(data), req.params.id);
  res.json({ success: true });
}));
router.delete('/glossary/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM glossary WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Polls
router.get('/polls', authenticateAdmin, asyncHandler(async (_req, res) => {
  const polls = db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all() as any[];
  res.json({ success: true, data: polls.map(p => ({ ...p, options: JSON.parse(p.options) })) });
}));
router.post('/polls', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const data = z.object({ question: z.string().min(1), options: z.array(z.string().min(1)).min(2).max(6), problem_type: z.string().optional() }).parse(req.body);
  const result = db.prepare('INSERT INTO polls (question, options, problem_type) VALUES (?, ?, ?)').run(data.question, JSON.stringify(data.options), data.problem_type || null);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));
router.patch('/polls/:id', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const data = z.object({ is_active: z.boolean().optional(), question: z.string().optional() }).parse(req.body);
  if (data.is_active !== undefined) db.prepare('UPDATE polls SET is_active = ? WHERE id = ?').run(data.is_active ? 1 : 0, req.params.id);
  if (data.question) db.prepare('UPDATE polls SET question = ? WHERE id = ?').run(data.question, req.params.id);
  res.json({ success: true });
}));
router.delete('/polls/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM polls WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));

// Feedbacks
router.get('/feedbacks', authenticateAdmin, asyncHandler(async (_req, res) => {
  const feedbacks = db.prepare('SELECT uf.*, fr.reply_text FROM user_feedback uf LEFT JOIN feedback_replies fr ON uf.id = fr.feedback_id ORDER BY uf.created_at DESC LIMIT 100').all() as any[];
  res.json({ success: true, data: feedbacks });
}));

// Feedback requests
router.get('/feedback-requests', authenticateAdmin, asyncHandler(async (_req, res) => {
  const requests = db.prepare('SELECT * FROM feedback_requests ORDER BY created_at DESC').all() as any[];
  const result = requests.map(r => {
    const answers = db.prepare('SELECT fa.answer, fa.created_at, u.display_name FROM feedback_answers fa JOIN users u ON fa.user_id = u.id WHERE fa.request_id = ?').all(r.id) as any[];
    return { ...r, answerCount: answers.length, answers };
  });
  res.json({ success: true, data: result });
}));
router.post('/feedback-requests', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const { question } = z.object({ question: z.string().min(1) }).parse(req.body);
  const result = db.prepare('INSERT INTO feedback_requests (question) VALUES (?)').run(question);
  db.prepare('INSERT INTO notifications (user_id, title, body, type) VALUES (NULL, ?, ?, ?)').run("Platformadan so'rov", question, 'feedback_request');
  const users = db.prepare('SELECT telegram_id FROM users WHERE telegram_id IS NOT NULL AND is_banned = 0').all() as any[];
  const { bot } = await import('../services/telegramBot.js');
  for (const u of users) {
    try { await bot.telegram.sendMessage(u.telegram_id, `💬 *Uswaa platformasidan so'rov:*\n\n${question}\n\n_Ilovani oching va fikringizni bildiring_`, { parse_mode: 'Markdown' }); } catch { /* blocked */ }
  }
  logAdminAction(req.user!.id, 'FEEDBACK_REQUEST', undefined, question.substring(0, 100), req.ip);
  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));
router.delete('/feedback-requests/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  db.prepare('DELETE FROM feedback_requests WHERE id = ?').run(req.params.id);
  res.json({ success: true });
}));
router.get('/feedback-requests/:id/export', authenticateAdmin, asyncHandler(async (req, res) => {
  const request = db.prepare('SELECT * FROM feedback_requests WHERE id = ?').get(req.params.id) as any;
  if (!request) { res.status(404).json({ success: false }); return; }
  const answers = db.prepare('SELECT fa.answer, fa.created_at, u.display_name FROM feedback_answers fa JOIN users u ON fa.user_id = u.id WHERE fa.request_id = ? ORDER BY fa.created_at DESC').all(req.params.id) as any[];
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="feedback_${req.params.id}.json"`);
  res.json({ question: request.question, answers, exportedAt: new Date().toISOString() });
}));

export { router as adminRouter };
