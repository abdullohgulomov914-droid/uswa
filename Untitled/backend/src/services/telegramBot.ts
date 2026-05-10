import { Telegraf, Markup } from 'telegraf';
import { db } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://uswa-delta.vercel.app';

// Bot username (verified: @Uswaabot)
const BOT_USERNAME = 'Uswaabot';

export const bot = new Telegraf(BOT_TOKEN);

// Initialize bot commands and handlers
export function initTelegramBot() {
  if (!BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not set, bot will not start');
    return;
  }

  // Start command
  bot.command('start', async (ctx) => {
    console.log('🚀 /start command received');
    console.log('User data:', ctx.from);
    
    const telegramId = ctx.from?.id.toString();
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    const lastName = ctx.from?.last_name;
    const photoUrl = (ctx.from as any)?.photo_url;

    if (!telegramId) {
      console.log('❌ No telegramId found');
      return ctx.reply('Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
    }

    // Send greeting message
    const greetingMessage = `🌟 *USWA ga xush kelibsiz, ${firstName || 'Foydalanuvchi'}!*

🛡️ *Sizning maxfiyligingiz biz uchun muhim*
• Barcha ma'lumotlaringiz shifrlangan
• Haqiqiy ismingiz hech kimga ko'rsatilmaydi
• Faqat anonim *uswaa[xxxxxxxx]* identifikatori

🚀 *Boshlash uchun:*
1. Quyidagi tugmani bosing
2. Onboardingni to'liqing
3. PIN kod yarating
4. Sog'lom hayot sari qadam qo'ying!`;

    const webAppUrl = process.env.TELEGRAM_WEB_APP_URL || WEB_APP_URL;
    await ctx.reply(greetingMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: "🚀 USWA'ni ochish", web_app: { url: webAppUrl } }
        ]]
      }
    });

    // Check if user exists
    const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    let user = stmt.get(telegramId) as any;

    if (!user) {
      // Create new user from Telegram
      const insertStmt = db.prepare(`
        INSERT INTO users (telegram_id, telegram_username, telegram_photo_url, display_name, start_date, is_admin)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const isAdmin = telegramId === ADMIN_ID ? 1 : 0;
      const displayName = firstName || username || 'User';
      
      const result = insertStmt.run(
        telegramId,
        username || null,
        photoUrl || null,
        displayName,
        new Date().toISOString(),
        isAdmin
      );
      
      const userId = result.lastInsertRowid as number;
      
      // Fetch the newly created user
      user = { 
        id: userId, 
        telegram_id: telegramId, 
        display_name: displayName,
        is_admin: isAdmin,
        streak_days: 0,
        xp: 0,
        level: 1
      };
      
      await ctx.reply(
        `🎉 Xush kelibsiz, ${displayName}!\n\n` +
        `USWA ilovasiga ro'yxatdan o'tdingiz.\n` +
        `Sizga omad tilaymiz! 💪`,
        getFeedbackKeyboard()
      );
    } else {
      // Check if banned
      if (user.is_banned) {
        return ctx.reply('❌ Sizning profilingiz bloklangan. Administrator bilan bog\'laning.');
      }

      await ctx.reply(
        `Qaytganingizdan xursandmiz, ${user.display_name}! 👋\n\n` +
        `Zanjiringiz: ${user.streak_days} kun\n` +
        `Daraja: ${user.level} | XP: ${user.xp}`,
        getFeedbackKeyboard()
      );
    }

    // Log admin login
    if (telegramId === ADMIN_ID) {
      console.log(`🔔 Admin logged in via Telegram: ${username} (${telegramId})`);
    }
  });

  // Web App button command
  bot.command('app', (ctx) => {
    return ctx.reply(
      '📱 Ilovani ochish:',
      Markup.inlineKeyboard([
        Markup.button.webApp('🚀 USWA', WEB_APP_URL)
      ])
    );
  });

  // Stats command
  bot.command('stats', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    const user = stmt.get(telegramId) as any;

    if (!user) {
      return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');
    }

    const progress = Math.min((user.streak_days / 90) * 100, 100);
    
    const message = 
      `📊 Sizning statistikangiz:\n\n` +
      `🔥 Zanjir: ${user.streak_days} kun\n` +
      `🏆 Eng uzun zanjir: ${user.longest_streak} kun\n` +
      `⭐ XP: ${user.xp}\n` +
      `🎯 Daraja: ${user.level}\n` +
      `📈 Tiklanish: ${Math.round(progress)}%`;

    await ctx.reply(message, getFeedbackKeyboard());
  });

  // Check-in command
  bot.command('checkin', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    const user = stmt.get(telegramId) as any;

    if (!user) {
      return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');
    }

    const newStreak = user.streak_days + 1;
    const newLongest = Math.max(newStreak, user.longest_streak);
    const xpGain = 10;
    const newXp = user.xp + xpGain;
    const newLevel = Math.floor(newXp / 500) + 1;

    const updateStmt = db.prepare(`
      UPDATE users 
      SET streak_days = ?, longest_streak = ?, xp = ?, level = ?
      WHERE telegram_id = ?
    `);
    updateStmt.run(newStreak, newLongest, newXp, newLevel, telegramId);

    // Log XP
    const xpStmt = db.prepare('INSERT INTO xp_log (user_id, amount, reason) VALUES (?, ?, ?)');
    xpStmt.run(user.id, xpGain, 'Telegram check-in');

    await ctx.reply(
      `✅ Kunlik tekshiruv muvaffaqiyatli!\n\n` +
      `+${xpGain} XP olishdingiz!\n` +
      `🔥 Zanjir: ${newStreak} kun`,
      getFeedbackKeyboard()
    );
  });

  // Emergency command - urge surfing
  bot.command('emergency', async (ctx) => {
    await ctx.reply(
      `🆘 *Tezkor yordam*\n\n` +
      `Istak keldimi? Bu shunchaki miyadagi to'lqin.\n` +
      `15 daqiqadan so'ng o'tib ketadi.\n\n` +
      `Quyidagi amallarni bajaring:\n` +
      `• 4-7-8 nafas olish (4 sekund nafas oling, 7 sekund ushlang, 8 sekund chiqaring)\n` +
      `• Bir stakan suv iching\n` +
      `• 10 marta otjimaniya qiling\n` +
      `• Do'stingizga qo'ng'iroq qiling`,
      { parse_mode: 'Markdown' }
    );

    // Start emergency session in database
    const telegramId = ctx.from?.id.toString();
    if (telegramId) {
      const userStmt = db.prepare('SELECT id FROM users WHERE telegram_id = ?');
      const user = userStmt.get(telegramId) as any;
      
      if (user) {
        const sessionStmt = db.prepare(`
          INSERT INTO emergency_sessions (user_id, started_at, technique_used)
          VALUES (?, ?, ?)
        `);
        sessionStmt.run(user.id, new Date().toISOString(), 'Telegram emergency command');
      }
    }
  });

  // Admin commands
  bot.command('admin', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    
    if (telegramId !== ADMIN_ID) {
      return ctx.reply('❌ Sizda admin huquqlari yo\'q.');
    }

    const userStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const userCount = userStmt.get() as any;

    const postStmt = db.prepare('SELECT COUNT(*) as count FROM community_posts WHERE created_at > datetime("now", "-24 hours")');
    const postsToday = postStmt.get() as any;

    const message = 
      `👨‍💼 *Admin Panel*\n\n` +
      `📊 Umumiy statistika:\n` +
      `• Foydalanuvchilar: ${userCount.count}\n` +
      `• Bugun postlar: ${postsToday.count}\n\n` +
      `Admin buyruqlari:\n` +
      `/users - Foydalanuvchilar ro'yxati\n` +
      `/broadcast - Xabar yuborish\n` +
      `/ban - Foydalanuvchini bloklash`;

    await ctx.reply(message, { parse_mode: 'Markdown' });
  });

  // Admin: Users list
  bot.command('users', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    
    if (telegramId !== ADMIN_ID) {
      return ctx.reply('❌ Sizda admin huquqlari yo\'q.');
    }

    const stmt = db.prepare(`
      SELECT telegram_id, telegram_username, display_name, streak_days, is_banned
      FROM users 
      WHERE telegram_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `);
    const users = stmt.all() as any[];

    let message = '👥 Foydalanuvchilar:\n\n';
    users.forEach((u, i) => {
      const status = u.is_banned ? '❌' : '✅';
      message += `${i + 1}. ${status} ${u.display_name} (@${u.telegram_username || 'n/a'}) - ${u.streak_days} kun\n`;
    });

    await ctx.reply(message);
  });

  // Handle text messages
  bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    // Admin reply to feedback (reply to forwarded message)
    if (telegramId === ADMIN_ID && ctx.message.reply_to_message) {
      const replyToText = (ctx.message.reply_to_message as any).text || '';
      // Extract feedback_id from forwarded message caption
      const match = replyToText.match(/#feedback_(\d+)/);
      if (match) {
        const feedbackId = parseInt(match[1]);
        const feedback = db.prepare('SELECT * FROM user_feedback WHERE id = ?').get(feedbackId) as any;
        if (feedback) {
          // Save reply
          db.prepare('INSERT INTO feedback_replies (feedback_id, reply_text) VALUES (?, ?)').run(feedbackId, text);
          // Send reply to user via bot
          try {
            await bot.telegram.sendMessage(
              feedback.telegram_id,
              `💬 *Uswaa jamoasidan javob:*\n\n${text}`,
              { parse_mode: 'Markdown' }
            );
            await ctx.reply('✅ Javob foydalanuvchiga yuborildi.');
          } catch {
            await ctx.reply('❌ Foydalanuvchiga yuborib bo\'lmadi (bot bloklangan bo\'lishi mumkin).');
          }
          return;
        }
      }
    }

    const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    const user = stmt.get(telegramId) as any;

    if (!user) {
      return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');
    }

    if (text === '💭 Fikr va Mulohaza') {
      return ctx.reply('✍️ Iltimos, fikr va mulohazalaringizni yozing. Biz ularni o\'qib o\'rganamiz va tizimni yaxshilash uchun ishlatamiz. Barcha fikrlar anonim saqlanadi.');
    }

    // Save feedback and forward to admin
    try {
      const result = db.prepare(
        'INSERT INTO user_feedback (telegram_id, feedback_text, feedback_type) VALUES (?, ?, ?)'
      ).run(telegramId, text, 'general');
      const feedbackId = result.lastInsertRowid;

      // Forward to admin with feedback_id tag for reply tracking
      if (ADMIN_ID) {
        const adminMsg =
          `📩 *Yangi fikr #feedback_${feedbackId}*\n` +
          `👤 @${user.telegram_username || 'anonim'} (ID: ${telegramId})\n` +
          `📅 ${new Date().toLocaleString('uz-UZ')}\n\n` +
          `💬 ${text}\n\n` +
          `_Reply qiling — javob foydalanuvchiga yuboriladi_`;
        try {
          await bot.telegram.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'Markdown' });
        } catch { /* admin blocked */ }
      }

      return ctx.reply('✅ Rahmat! Fikringiz saqlandi.', getFeedbackKeyboard());
    } catch {
      return ctx.reply('✅ Rahmat!', getFeedbackKeyboard());
    }
  });

  // Launch bot
  bot.launch()
    .then(() => console.log('🤖 Telegram bot started'))
    .catch(err => console.error('❌ Bot launch failed:', err));

  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// Keyboard helper
function getFeedbackKeyboard() {
  return Markup.keyboard([
    ['💭 Fikr va Mulohaza']
  ]).resize();
}

// Validate Telegram Web App data
export function validateTelegramData(initData: string): { valid: boolean; user?: any } {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // In development, skip strict validation if no bot token
    if (!BOT_TOKEN) {
      const user = JSON.parse(params.get('user') || '{}');
      return { valid: true, user };
    }

    // Check auth_date not too old (48 hours to be safe)
    const authDate = parseInt(params.get('auth_date') || '0');
    if (authDate > 0 && Date.now() / 1000 - authDate > 172800) {
      console.warn('⚠️ auth_date too old:', authDate);
      return { valid: false };
    }

    // Validate hash
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    const checkHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    console.log('🔐 Hash check:', { expected: checkHash, received: hash, match: checkHash === hash });

    if (checkHash !== hash) {
      return { valid: false };
    }

    const user = JSON.parse(params.get('user') || '{}');
    return { valid: true, user };
  } catch (error) {
    console.error('❌ validateTelegramData error:', error);
    return { valid: false };
  }
}

// Generate JWT for Telegram user
export function generateTelegramToken(telegramUser: any): string {
  const userStmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
  let user = userStmt.get(telegramUser.id.toString()) as any;

  if (!user) {
    // Create user if not exists
    const insertStmt = db.prepare(`
      INSERT INTO users (telegram_id, telegram_username, telegram_photo_url, display_name, start_date, is_admin)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const isAdmin = telegramUser.id.toString() === ADMIN_ID ? 1 : 0;
    const displayName = telegramUser.first_name || telegramUser.username || 'User';
    
    const result = insertStmt.run(
      telegramUser.id.toString(),
      telegramUser.username || null,
      telegramUser.photo_url || null,
      displayName,
      new Date().toISOString(),
      isAdmin
    );
    
    user = {
      id: result.lastInsertRowid,
      telegram_id: telegramUser.id.toString(),
      display_name: displayName,
      is_admin: isAdmin
    };
  }

  return generateToken({
    id: user.id,
    username: user.telegram_username || `tg_${user.telegram_id}`,
    email: user.email || `${user.telegram_id}@telegram.user`,
    isAdmin: Boolean(user.is_admin),
  });
}
