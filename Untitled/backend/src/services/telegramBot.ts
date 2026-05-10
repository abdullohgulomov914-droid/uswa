import { Telegraf, Markup } from 'telegraf';
import { db } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID || '';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://your-frontend-url.com';

export const bot = new Telegraf(BOT_TOKEN);

// Initialize bot commands and handlers
export function initTelegramBot() {
  if (!BOT_TOKEN) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not set, bot will not start');
    return;
  }

  // Start command
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id.toString();
    const username = ctx.from?.username;
    const firstName = ctx.from?.first_name;
    const lastName = ctx.from?.last_name;
    const photoUrl = (ctx.from as any)?.photo_url;

    if (!telegramId) {
      return ctx.reply('Xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.');
    }

    // Send greeting message
    const greetingMessage = `🌟 *Identity Shift ga xush kelibsiz, ${firstName || 'Foydalanuvchi'}!*

🛡️ *Sizning maxfiyligingiz biz uchun muhim*
• Barcha ma'lumotlaringiz shifrlangan
• Haqiqiy ismingiz hech kimga ko'rsatilmaydi
• Faqat anonim *uswaa[xxxxxxxx]* identifikatori

🚀 *Boshlash uchun:*
1. Quyidagi tugmani bosing
2. Onboardingni to'liqing
3. PIN kod yarating
4. Sog'lom hayot sari qadam qo'ying!`;

    await ctx.reply(greetingMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: "🚀 Identity Shiftni ochish", web_app: { url: process.env.TELEGRAM_WEB_APP_URL || 'https://uswa.vercel.app' } }
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
        `Identity Shift ilovasiga ro'yxatdan o'tdingiz.\n` +
        `Sizga omad tilaymiz! 💪`,
        getMainKeyboard()
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
        getMainKeyboard()
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
        Markup.button.webApp('🚀 Identity Shift', WEB_APP_URL)
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

    await ctx.reply(message, getMainKeyboard());
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
      getMainKeyboard()
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
    
    // Check if user exists
    const telegramId = ctx.from?.id.toString();
    if (!telegramId) return;

    const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
    const user = stmt.get(telegramId) as any;

    if (!user) {
      return ctx.reply('Iltimos, avval /start buyrug\'ini yuboring.');
    }

    // Handle menu buttons
    switch (text) {
      case '📊 Statistika':
        return ctx.reply('/stats');
      case '✅ Tekshiruv':
        return ctx.reply('/checkin');
      case '🆘 Yordam':
        return ctx.reply('/emergency');
      case '📱 Ilova':
        return ctx.reply('/app');
      default:
        // Log journal entry as trigger
        const journalStmt = db.prepare(`
          INSERT INTO journal_entries (user_id, type, content, created_at)
          VALUES (?, ?, ?, ?)
        `);
        journalStmt.run(user.id, 'trigger', text, new Date().toISOString());
        
        await ctx.reply(
          `📝 Qayd etildi: "${text}"\n\n` +
          `Bu trigger sizning jurnalingizga qo'shildi.\n` +
          `STAR+ tizimida uni tahlil qilishingiz mumkin.`,
          getMainKeyboard()
        );
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
function getMainKeyboard() {
  return Markup.keyboard([
    ['📊 Statistika', '✅ Tekshiruv'],
    ['🆘 Yordam', '📱 Ilova']
  ]).resize();
}

// Validate Telegram Web App data
export function validateTelegramData(initData: string): { valid: boolean; user?: any } {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    // Check auth_date not too old (24 hours)
    const authDate = parseInt(params.get('auth_date') || '0');
    if (Date.now() / 1000 - authDate > 86400) {
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

    if (checkHash !== hash) {
      return { valid: false };
    }

    const user = JSON.parse(params.get('user') || '{}');
    return { valid: true, user };
  } catch (error) {
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
