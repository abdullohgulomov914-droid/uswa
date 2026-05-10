import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Get conversation with a buddy
router.get('/:buddyId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const buddyId = parseInt(req.params.buddyId);
  const myId = req.user!.id;

  const stmt = db.prepare(`
    SELECT id, sender_id, receiver_id, content, is_read, created_at
    FROM buddy_messages
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
    LIMIT 100
  `);
  const messages = stmt.all(myId, buddyId, buddyId, myId);

  // Mark received messages as read
  db.prepare(`
    UPDATE buddy_messages SET is_read = 1
    WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
  `).run(buddyId, myId);

  res.json({
    success: true,
    data: (messages as any[]).map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      content: m.content,
      isRead: Boolean(m.is_read),
      createdAt: m.created_at,
      isOwn: m.sender_id === myId,
    })),
  });
}));

// Send message to buddy
router.post('/:buddyId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { content } = z.object({ content: z.string().min(1).max(500) }).parse(req.body);
  const buddyId = parseInt(req.params.buddyId);
  const myId = req.user!.id;

  // Verify buddy exists
  const buddy = db.prepare('SELECT id FROM users WHERE id = ?').get(buddyId);
  if (!buddy) {
    res.status(404).json({ success: false, error: { message: 'Buddy not found' } });
    return;
  }

  const result = db.prepare(`
    INSERT INTO buddy_messages (sender_id, receiver_id, content) VALUES (?, ?, ?)
  `).run(myId, buddyId, content);

  res.status(201).json({
    success: true,
    data: {
      id: result.lastInsertRowid,
      senderId: myId,
      content,
      isRead: false,
      createdAt: new Date().toISOString(),
      isOwn: true,
    },
  });
}));

// Get unread count
router.get('/unread/count', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const row = db.prepare(`
    SELECT COUNT(*) as count FROM buddy_messages
    WHERE receiver_id = ? AND is_read = 0
  `).get(req.user!.id) as any;

  res.json({ success: true, data: { count: row.count } });
}));

export { router as chatRouter };
