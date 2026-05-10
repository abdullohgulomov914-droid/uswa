import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const entrySchema = z.object({
  type: z.enum(['trigger', 'tackle', 'account', 'reward']),
  title: z.string().optional(),
  content: z.string().min(1),
  triggerTime: z.string().optional(),
  triggerLocation: z.string().optional(),
  triggerFeeling: z.string().optional(),
  isResolved: z.boolean().optional(),
});

// Get all entries for user
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { type } = req.query;
  
  let query = `
    SELECT id, type, title, content, trigger_time, trigger_location, trigger_feeling,
           is_resolved, created_at
    FROM journal_entries 
    WHERE user_id = ?
  `;
  const params: any[] = [req.user!.id];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const stmt = db.prepare(query);
  const entries = stmt.all(...params);
  
  res.json({
    success: true,
    data: entries.map((e: any) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      content: e.content,
      triggerTime: e.trigger_time,
      triggerLocation: e.trigger_location,
      triggerFeeling: e.trigger_feeling,
      isResolved: Boolean(e.is_resolved),
      createdAt: e.created_at,
    })),
  });
}));

// Create entry
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const data = entrySchema.parse(req.body);
  
  const stmt = db.prepare(`
    INSERT INTO journal_entries 
    (user_id, type, title, content, trigger_time, trigger_location, trigger_feeling, is_resolved)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    req.user!.id,
    data.type,
    data.title || null,
    data.content,
    data.triggerTime || null,
    data.triggerLocation || null,
    data.triggerFeeling || null,
    data.isResolved ? 1 : 0
  );
  
  // Add XP for journaling
  addXP(req.user!.id, 10, 'Journal entry created');
  
  res.status(201).json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      ...data,
      createdAt: new Date().toISOString(),
    },
    xpGained: 10,
  });
}));

// Get entry by ID
router.get('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare(`
    SELECT id, type, title, content, trigger_time, trigger_location, trigger_feeling,
           is_resolved, created_at
    FROM journal_entries WHERE id = ? AND user_id = ?
  `);
  const entry = stmt.get(req.params.id, req.user!.id) as any;
  
  if (!entry) {
    res.status(404).json({ success: false, error: { message: 'Entry not found' } });
    return;
  }
  
  res.json({
    success: true,
    data: {
      id: entry.id,
      type: entry.type,
      title: entry.title,
      content: entry.content,
      triggerTime: entry.trigger_time,
      triggerLocation: entry.trigger_location,
      triggerFeeling: entry.trigger_feeling,
      isResolved: Boolean(entry.is_resolved),
      createdAt: entry.created_at,
    },
  });
}));

// Update entry
router.patch('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const updateSchema = entrySchema.partial();
  const data = updateSchema.parse(req.body);
  
  const sets: string[] = [];
  const values: any[] = [];
  
  if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
  if (data.content !== undefined) { sets.push('content = ?'); values.push(data.content); }
  if (data.triggerTime !== undefined) { sets.push('trigger_time = ?'); values.push(data.triggerTime); }
  if (data.triggerLocation !== undefined) { sets.push('trigger_location = ?'); values.push(data.triggerLocation); }
  if (data.triggerFeeling !== undefined) { sets.push('trigger_feeling = ?'); values.push(data.triggerFeeling); }
  if (data.isResolved !== undefined) { sets.push('is_resolved = ?'); values.push(data.isResolved ? 1 : 0); }
  
  if (sets.length === 0) {
    res.status(400).json({ success: false, error: { message: 'No fields to update' } });
    return;
  }
  
  values.push(req.params.id, req.user!.id);
  
  const stmt = db.prepare(`
    UPDATE journal_entries SET ${sets.join(', ')} WHERE id = ? AND user_id = ?
  `);
  const result = stmt.run(...values);
  
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'Entry not found' } });
    return;
  }
  
  res.json({ success: true, message: 'Entry updated' });
}));

// Delete entry
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare('DELETE FROM journal_entries WHERE id = ? AND user_id = ?');
  const result = stmt.run(req.params.id, req.user!.id);
  
  if (result.changes === 0) {
    res.status(404).json({ success: false, error: { message: 'Entry not found' } });
    return;
  }
  
  res.json({ success: true, message: 'Entry deleted' });
}));

// Get trigger stats (most common triggers)
router.get('/stats/triggers', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare(`
    SELECT trigger_feeling, COUNT(*) as count
    FROM journal_entries
    WHERE user_id = ? AND type = 'trigger' AND trigger_feeling IS NOT NULL
    GROUP BY trigger_feeling
    ORDER BY count DESC
    LIMIT 5
  `);
  const triggers = stmt.all(req.user!.id);
  
  res.json({ success: true, data: triggers });
}));

// Helper to add XP
function addXP(userId: number, amount: number, reason: string) {
  const xpStmt = db.prepare('INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)');
  xpStmt.run(userId, amount, reason);
  
  const userStmt = db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?');
  userStmt.run(amount, userId);
}

export { router as journalRouter };
