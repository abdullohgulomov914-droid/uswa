import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { userRouter } from './routes/user.js';
import { journalRouter } from './routes/journal.js';
import { relapseRouter } from './routes/relapse.js';
import { communityRouter } from './routes/community.js';
import { emergencyRouter } from './routes/emergency.js';
import { adminRouter } from './routes/admin.js';
import { telegramRouter } from './routes/telegram.js';
import { chatRouter } from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initTelegramBot } from './services/telegramBot.js';
import { initDatabase } from './db/index.js';

dotenv.config();

// Initialize database
initDatabase();
console.log('✅ Database initialized');

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/journal', journalRouter);
app.use('/api/relapse', relapseRouter);
app.use('/api/community', communityRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/admin', adminRouter);
app.use('/api/telegram', telegramRouter);

app.use('/api/chat', chatRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize Telegram Bot (non-blocking)
  try {
    initTelegramBot();
  } catch (error) {
    console.warn('⚠️ Telegram bot init failed:', error);
  }
});
