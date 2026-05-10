import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export interface UserPayload {
  id: number;
  username: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ success: false, error: { message: 'Access token required', code: 'NO_TOKEN' } });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; email: string };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' } });
  }
}

export function generateToken(payload: { id: number; username: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
