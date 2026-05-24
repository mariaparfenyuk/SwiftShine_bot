require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { getCurrentDate } = require('./utils/getCurrentDate');
const { getTodayTask } = require('./utils/getTodayTask');
const { messages } = require('./messages');
const { updateBotDateCache } = require('./utils/updateBotDateCache');
const { trackStats } = require('./utils/trackStats');

const APP_URL = 'https://swift-shine-6xh18lhey-mariia-parfeniuks-projects.vercel.app';

const BOT_TOKEN = process.env.BOT_TOKEN || 'ВАШ_ТОКЕН_ЗДЕСЬ';
const bot = new Telegraf(BOT_TOKEN);

const everydayTasksData = JSON.parse(fs.readFileSync(path.join(__dirname, 'everydayTasks.json'), 'utf-8'));
const monthTasksData = JSON.parse(fs.readFileSync(path.join(__dirname, 'monthTasks.json'), 'utf-8'));
const expressCheckListData = JSON.parse(fs.readFileSync(path.join(__dirname, 'expressCheckList.json'), 'utf-8'));

const navigationKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback(messages.BACK, 'go_to_main')],
  [Markup.button.callback(messages.DONATE, 'go_to_donate')]
]);

let currentBotDate = {
  day: 1,
  month: 1,
  flyLadyWeek: 1
};

function refreshDateCache() {
  currentBotDate = updateBotDateCache();
}

refreshDateCache();

setInterval(refreshDateCache, 24 * 60 * 60 * 1000);

const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.webApp('⏱ Запустить таймер 15 минут', APP_URL)],
  [Markup.button.webApp('🎰 Матрица Чистоты', 'https://apart-exhibitions-highly-dakota.trycloudflare.com/')],
  [Markup.button.callback(messages.EVERYDAY_TASK, 'get_everyday_task')],
  [Markup.button.callback(messages.CHECK_LIST, 'get_zone_checklist')],
  [Markup.button.callback(messages.EXPRESS, 'get_express_clean')],
  [Markup.button.callback(messages.DONATE, 'go_to_donate')]
]);

const donateKeyboard = Markup.inlineKeyboard([
  [Markup.button.url(messages.PAYPAL, 'https://paypal.me/MParfeniuk100')],
  [Markup.button.url(messages.BOOSTY, 'https://boosty.to/parfeniuk/donate')],
  [Markup.button.callback(messages.BACK, 'go_to_main')]
]);

bot.start((ctx) => {
  trackStats();
  ctx.reply(messages.HELLO, mainKeyboard);
});

bot.help((ctx) => {
  ctx.reply(messages.HELP_MESSAGE, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

bot.action('get_everyday_task', async (ctx) => {
  await ctx.answerCbQuery();
  let task = getTodayTask(everydayTasksData, currentBotDate.day, currentBotDate.month);

  if (!task) {
    task = { zone: messages.ALL_HOME, text: messages.BUGY_27 };
  }

  const message = `📅 *Задание на сегодня*\n📍 *Зона:* ${task.zone}\n──────────────────\n\n${task.text}`;

  await ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: navigationKeyboard.reply_markup
  });
});

bot.action('get_zone_checklist', async (ctx) => {
  await ctx.answerCbQuery();
  try {
    const currentWeek = currentBotDate.flyLadyWeek;
    const weekData = monthTasksData.find(item => item.week === currentWeek);

    if (!weekData) {
      await ctx.reply(
        `🧹 *Чек-лист по зонам*\n\nНа этой неделе (Неделя ${currentWeek}) план уборки отдыхает. Расслабься!`,
        { parse_mode: 'Markdown', reply_markup: navigationKeyboard.reply_markup }
      );
      return;
    }

    const tasksList = weekData.tasks.map((task, index) => `${index + 1}. ◽️ ${task}`).join('\n');
    const message = `${weekData.emoji} *Неделя ${weekData.week}: Зона «${weekData.zone}»*\n⚠️ *Твой чек-лист на эти 7 дней:*\nВыбирай по 1-2 пункта в день, ставь таймер на 15 минут и действуй!\n\n${tasksList}`;

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: navigationKeyboard.reply_markup });
  } catch (error) {
    console.error(error);
    await ctx.reply(messages.CHECK_LIST_ERROR, { reply_markup: navigationKeyboard.reply_markup });
  }
});

bot.action('get_express_clean', async (ctx) => {
  await ctx.answerCbQuery();
  try {
    const formattedSteps = expressCheckListData.steps.map(s => `⏱ *Шаг ${s.step} [${s.time}]: ${s.action}*\n${s.description}`).join('\n\n');
    const message = `${expressCheckListData.title}\n\n${expressCheckListData.intro}\n\n──────────────────\n\n${formattedSteps}\n\n──────────────────\n\n✨ *${expressCheckListData.outro}*`;

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: navigationKeyboard.reply_markup });
  } catch (error) {
    console.error(error);
    await ctx.reply(messages.EXPRESS_ERROR, { reply_markup: navigationKeyboard.reply_markup });
  }
});

bot.action('go_to_donate', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(messages.DONATE_MESSAGE, {
    parse_mode: 'Markdown',
    reply_markup: donateKeyboard.reply_markup
  });
});

bot.action('go_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(messages.MAIN_MENU, mainKeyboard);
});

bot.catch((err, ctx) => {
  console.error(err);
  ctx.reply(messages.ERROR, mainKeyboard);
});

// Подключаем express (он у вас уже установлен)
const express = require('express');
const app = express();

// Указываем папку public для раздачи статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Дополнительно страхуем корневой роут: если кто-то перейдет по главной ссылке туннеля,
// его автоматически перенаправит на roulette.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'roulette.html'));
});

// Запуск бота
bot.launch().then(() => {
  console.log('[Bot] Telegram бот успешно запущен');
});

// Запуск Express-сервера на порту 3000 для Cloudflare
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`[Web App] Сервер статики успешно запущен на порту ${PORT}`);
});

// Корректное завершение работы при перезапуске PM2
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});