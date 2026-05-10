import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateToken, generateToken, type AuthRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateTelegramData, generateTelegramToken } from '../services/telegramBot.js';

const router = Router();

// Auth via Telegram Mini App (Web App)
router.post('/auth', asyncHandler(async (req, res) => {
  const schema = z.object({ initData: z.string() });
  const { initData } = schema.parse(req.body);

  // Validate Telegram Web App data
  const validation = validateTelegramData(initData);

  if (!validation.valid || !validation.user) {
    res.status(401).json({ success: false, error: { message: 'Invalid Telegram data', code: 'INVALID_TELEGRAM_DATA' } });
    return;
  }

  const telegramUser = validation.user;

  // Generate or get user
  const token = generateTelegramToken(telegramUser);

  // Get user details
  const userStmt = db.prepare(`
    SELECT id, telegram_id, telegram_username, display_name, 
           streak_days, longest_streak, xp, level, is_admin
    FROM users WHERE telegram_id = ?
  `);
  const user = userStmt.get(telegramUser.id.toString()) as any;

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        telegramUsername: user.telegram_username,
        displayName: user.display_name,
        streakDays: user.streak_days,
        longestStreak: user.longest_streak,
        xp: user.xp,
        level: user.level,
        isAdmin: Boolean(user.is_admin),
      },
    },
  });
}));

// Link existing account to Telegram
router.post('/link', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const schema = z.object({ initData: z.string() });
  const { initData } = schema.parse(req.body);

  const validation = validateTelegramData(initData);

  if (!validation.valid || !validation.user) {
    res.status(401).json({ success: false, error: { message: 'Invalid Telegram data', code: 'INVALID_TELEGRAM_DATA' } });
    return;
  }

  const telegramUser = validation.user;

  // Check if Telegram account already linked to another user
  const existingStmt = db.prepare('SELECT id FROM users WHERE telegram_id = ? AND id != ?');
  const existing = existingStmt.get(telegramUser.id.toString(), req.user!.id) as any;

  if (existing) {
    res.status(409).json({ success: false, error: { message: 'Telegram account already linked to another user', code: 'ALREADY_LINKED' } });
    return;
  }

  // Update user with Telegram info
  const updateStmt = db.prepare(`
    UPDATE users 
    SET telegram_id = ?, telegram_username = ?, telegram_photo_url = ?
    WHERE id = ?
  `);
  updateStmt.run(
    telegramUser.id.toString(),
    telegramUser.username || null,
    telegramUser.photo_url || null,
    req.user!.id
  );

  res.json({
    success: true,
    message: 'Telegram account linked successfully',
    data: {
      telegramId: telegramUser.id.toString(),
      telegramUsername: telegramUser.username,
    },
  });
}));

// Unlink Telegram account
router.post('/unlink', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare(`
    UPDATE users 
    SET telegram_id = NULL, telegram_username = NULL, telegram_photo_url = NULL
    WHERE id = ?
  `);
  stmt.run(req.user!.id);

  res.json({ success: true, message: 'Telegram account unlinked' });
}));

// Get Telegram connection status
router.get('/status', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const stmt = db.prepare(`
    SELECT telegram_id, telegram_username, telegram_photo_url
    FROM users WHERE id = ?
  `);
  const user = stmt.get(req.user!.id) as any;

  res.json({
    success: true,
    data: {
      connected: !!user?.telegram_id,
      telegramId: user?.telegram_id,
      telegramUsername: user?.telegram_username,
      telegramPhotoUrl: user?.telegram_photo_url,
    },
  });
}));

// Get bot info (for Mini App)
router.get('/bot-info', asyncHandler(async (_req, res) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  const botUsername = botToken.split(':')[0]; // Extract bot ID

  res.json({
    success: true,
    data: {
      botUsername: `uswaaabot`,
      botLink: `https://t.me/uswaaabot`,
    },
  });
}));

export { router as telegramRouter };
