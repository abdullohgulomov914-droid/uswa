import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Register
router.post('/register', asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);
  
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  try {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password, display_name, start_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      data.username,
      data.email,
      hashedPassword,
      data.displayName || data.username,
      new Date().toISOString()
    );
    
    const userId = result.lastInsertRowid as number;
    const token = generateToken({
      id: userId,
      username: data.username,
      email: data.email,
      isAdmin: false,
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: userId,
        username: data.username,
        email: data.email,
        displayName: data.displayName || data.username,
        token,
      },
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({
        success: false,
        error: { message: 'Username or email already exists', code: 'DUPLICATE_USER' },
      });
      return;
    }
    throw error;
  }
}));

// Login
router.post('/login', asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?');
  const user = stmt.get(data.username, data.username) as any;
  
  if (!user) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
    });
    return;
  }
  
  const isValid = await bcrypt.compare(data.password, user.password);
  
  if (!isValid) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
    });
    return;
  }
  
  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: Boolean(user.is_admin),
  });
  
  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      streakDays: user.streak_days,
      longestStreak: user.longest_streak,
      xp: user.xp,
      level: user.level,
      startDate: user.start_date,
      token,
    },
  });
}));

export { router as authRouter };
