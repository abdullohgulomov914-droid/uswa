import type { Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { authenticateToken, type AuthRequest } from './auth.js';

const ADMIN_TELEGRAM_ID = process.env.TELEGRAM_ADMIN_ID;

// Middleware to check if user is admin
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
    return;
  }

  const stmt = db.prepare('SELECT is_admin, telegram_id FROM users WHERE id = ?');
  const user = stmt.get(req.user.id) as any;

  if (!user || !user.is_admin) {
    // Also check if telegram_id matches admin id
    if (user?.telegram_id !== ADMIN_TELEGRAM_ID) {
      res.status(403).json({ success: false, error: { message: 'Admin access required', code: 'FORBIDDEN' } });
      return;
    }
  }

  next();
}

// Combined middleware: auth + admin
export function authenticateAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  authenticateToken(req, res, () => {
    requireAdmin(req, res, next);
  });
}

// Log admin action
export function logAdminAction(
  adminId: number,
  action: string,
  targetUserId?: number,
  details?: string,
  ipAddress?: string
): void {
  const stmt = db.prepare(`
    INSERT INTO admin_logs (admin_id, action, target_user_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(adminId, action, targetUserId || null, details || null, ipAddress || null);
}
