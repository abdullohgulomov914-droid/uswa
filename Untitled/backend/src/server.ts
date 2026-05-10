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
import { errorHandler } from './middleware/errorHandler.js';
import { initTelegramBot } from './services/telegramBot.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Initialize Telegram Bot
  initTelegramBot();
});
