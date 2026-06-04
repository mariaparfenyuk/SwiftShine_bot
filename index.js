require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const express = require('express');

const { getTodayTask } = require('./utils/getTodayTask');
const { updateBotDateCache } = require('./utils/updateBotDateCache');
const { trackStats } = require('./utils/trackStats');
const { messages } = require('./messages');

const APP_URL = 'https://swift-shine-bot-mariia-parfeniuks-projects.vercel.app/';
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('CRITICAL: BOT_TOKEN is missing in environment variables!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

const loadJson = (fileName) => JSON.parse(fs.readFileSync(path.join(__dirname, fileName), 'utf-8'));
const everydayTasksData = loadJson('everydayTasks.json');
const monthTasksData = loadJson('monthTasks.json');
const expressCheckListData = loadJson('expressCheckList.json');

const keyboards = {
  main: Markup.inlineKeyboard([
    [Markup.button.webApp('✨ Открыть Помощник Уборки', APP_URL)],
    [Markup.button.callback(messages.EVERYDAY_TASK, 'get_everyday_task')],
    [Markup.button.callback(messages.CHECK_LIST, 'get_zone_checklist')],
    [Markup.button.callback(messages.EXPRESS, 'get_express_clean')],
    [Markup.button.callback('⭐ Оценить бота', 'start_feedback')],
    [Markup.button.callback(messages.DONATE, 'go_to_donate')]
  ]),

  navigation: Markup.inlineKeyboard([
    [Markup.button.callback(messages.BACK, 'go_to_main')],
    [Markup.button.callback(messages.DONATE, 'go_to_donate')]
  ]),

  donate: Markup.inlineKeyboard([
    [Markup.button.url(messages.PAYPAL, 'https://paypal.me/MParfeniuk100')],
    [Markup.button.url(messages.BOOSTY, 'https://boosty.to/parfeniuk/donate')],
    [Markup.button.callback(messages.BACK, 'go_to_main')]
  ]),

  stars: Markup.inlineKeyboard([
    [
      Markup.button.callback('⭐', 'rate_1'),
      Markup.button.callback('⭐⭐', 'rate_2'),
      Markup.button.callback('⭐⭐⭐', 'rate_3'),
      Markup.button.callback('⭐⭐⭐⭐', 'rate_4'),
      Markup.button.callback('⭐⭐⭐⭐⭐', 'rate_5')
    ],
    [Markup.button.callback(messages.BACK, 'go_to_main')]
  ]),
};

function getFreshBotDate() {
  return updateBotDateCache();
}

bot.start((ctx) => {
  trackStats();
  ctx.reply(messages.HELLO, keyboards.main);
});

bot.help((ctx) => {
  ctx.reply(messages.HELP_MESSAGE, { parse_mode: 'Markdown', reply_markup: keyboards.main });
});

bot.action('get_everyday_task', async (ctx) => {
  await ctx.answerCbQuery();
  const currentDate = getFreshBotDate();
  let task = getTodayTask(everydayTasksData, currentDate.day, currentDate.month);

  if (!task) {
    task = { zone: messages.ALL_HOME, text: messages.BUGY_27 };
  }

  const message = `📅 *Задание на сегодня*\n📍 *Зона:* ${task.zone}\n──────────────────\n\n${task.text}`;
  await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboards.navigation });
});
bot.on('web_app_data', async (ctx) => {
  try {
    const rawData = ctx.message?.web_app_data?.data;
    if (!rawData) return;

    const data = JSON.parse(rawData);

    if (data.action === 'user_feedback') {
      const user = ctx.from;
      const username = user.username ? `@${user.username}` : user.first_name;
      const stars = '⭐'.repeat(data.rating);

      const adminMessage = `🔔 *Новый отзыв!*\n\n` +
        `👤 *От:* ${username} (ID: \`${user.id}\`)\n` +
        `📊 *Оценка:* ${stars} (${data.rating}/5)\n` +
        `✍️ *Текст:* ${data.text || '_Без текста_'}`;
      if (process.env.ADMIN_CHAT_ID) {
        await ctx.telegram.sendMessage(Number(process.env.ADMIN_CHAT_ID), adminMessage, { parse_mode: 'Markdown' });
      } else {
        console.error('Ошибка: Переменная ADMIN_CHAT_ID не найдена в .env');
      }

      await ctx.reply(`Спасибо! Твой отзыв (${data.rating}/5) успешно получен. Мы ценим твою обратную связь! ❤️`);
    }
  } catch (error) {
    console.error('Ошибка при обработке web_app_data:', error);
  }
});

bot.action('get_zone_checklist', async (ctx) => {
  await ctx.answerCbQuery();
  try {
    const currentWeek = getFreshBotDate().flyLadyWeek;
    const weekData = monthTasksData.find(item => item.week === currentWeek);

    if (!weekData) {
      const emptyMessage = `🧹 *Чек-лист по зонам*\n\nНа этой неделе (Неделя ${currentWeek}) план уборки отдыхает. Расслабься!`;
      return ctx.reply(emptyMessage, { parse_mode: 'Markdown', reply_markup: keyboards.navigation });
    }

    const tasksList = weekData.tasks.map((task, index) => `${index + 1}. ◽️ ${task}`).join('\n');
    const message = `${weekData.emoji} *Неделя ${weekData.week}: Зона «${weekData.zone}»*\n⚠️ *Твой чек-лист на эти 7 дней:*\nВыбирай по 1-2 пункта в день, ставь таймер на 15 минут и действуй!\n\n${tasksList}`;

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboards.navigation });
  } catch (error) {
    console.error('Checklist Error:', error);
    await ctx.reply(messages.CHECK_LIST_ERROR, keyboards.navigation);
  }
});

bot.action('get_express_clean', async (ctx) => {
  await ctx.answerCbQuery();
  try {
    const formattedSteps = expressCheckListData.steps
      .map(s => `⏱ *Шаг ${s.step} [${s.time}]: ${s.action}*\n${s.description}`)
      .join('\n\n');

    const message = `${expressCheckListData.title}\n\n${expressCheckListData.intro}\n\n──────────────────\n\n${formattedSteps}\n\n──────────────────\n\n✨ *${expressCheckListData.outro}*`;

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboards.navigation });
  } catch (error) {
    console.error('Express Clean Error:', error);
    await ctx.reply(messages.EXPRESS_ERROR, keyboards.navigation);
  }
});

bot.action('go_to_donate', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(messages.DONATE_MESSAGE, { parse_mode: 'Markdown', reply_markup: keyboards.donate });
});

bot.action('go_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(messages.MAIN_MENU, keyboards.main);
});

const feedbackState = new Map();

bot.action('start_feedback', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Пожалуйста, выберите оценку для нашего помощника уборки: 🥰', keyboards.stars);
});

bot.action(/^rate_([1-5])$/, async (ctx) => {
  await ctx.answerCbQuery();
  const rating = parseInt(ctx.match[1], 10);

  feedbackState.set(ctx.from.id, { rating: rating });

  if (rating === 5) {
    await ctx.reply('Ух ты, спасибо за высшую оценку! 🥳 Напишите пару добрых слов (или отправьте любой текст), чтобы завершить отзыв:');
  } else {
    await ctx.reply(`Спасибо за честную оценку (${rating}/5)! ✍️ Напишите, пожалуйста, что мы можем улучшить в боте или приложении? (Минимум 10 символов):`);
  }
});

bot.on('text', async (ctx, next) => {
  const userId = ctx.from.id;

  if (!feedbackState.has(userId)) {
    return next();
  }

  const state = feedbackState.get(userId);
  const text = ctx.message.text.trim();

  if (state.rating < 5 && text.length < 10) {
    return ctx.reply('Пожалуйста, напишите чуть подробнее (не менее 10 символов), чтобы мы поняли, как стать лучше! ❤️');
  }

  const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
  const starsString = '⭐'.repeat(state.rating);

  const adminMessage = `🔔 *Новый отзыв из меню!*\n\n` +
    `👤 *От:* ${username} (ID: \`${ctx.from.id}\`)\n` +
    `📊 *Оценка:* ${starsString} (${state.rating}/5)\n` +
    `✍️ *Текст:* ${text}`;

  if (process.env.ADMIN_CHAT_ID) {
    await ctx.telegram.sendMessage(Number(process.env.ADMIN_CHAT_ID), adminMessage, { parse_mode: 'Markdown' });
  }

  feedbackState.delete(userId);
  await ctx.reply('Спасибо! Ваш отзыв успешно отправлен разработчикам. Вы помогаете нам расти! ✨', keyboards.main);
});

bot.catch((err, ctx) => {
  console.error(`Telegraf caught an error: ${err.message}`);
  ctx.reply(messages.ERROR, keyboards.main);
});
const app = express();

app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.includes(path.join(__dirname, 'img'))) {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      res.set('Cache-Control', 'no-cache');
    }
  }
}));

app.get('/api/month-tasks', (req, res) => {
  res.json(monthTasksData);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

bot.launch().then(() => {
  console.log('[Bot] Telegram бот успешно запущен');
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`[Web App] Сервер статики успешно запущен на порту ${PORT}`);
});

const handleShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  bot.stop(signal);
  server.close(() => {
    process.exit(0);
  });
};

process.once('SIGINT', () => handleShutdown('SIGINT'));
process.once('SIGTERM', () => handleShutdown('SIGTERM'));