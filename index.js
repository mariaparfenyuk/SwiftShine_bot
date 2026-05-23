require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { getCurrentDate } = require('./utils/getCurrentDate');
const { getTodayTask } = require('./utils/getTodayTask');
const { messages } = require('./messages');
const { updateBotDateCache } = require('./utils/updateBotDateCache');
const { trackStats } = require('./utils/trackStats');

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

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
  [Markup.button.webApp('🎰 Матрица Чистоты', `${APP_URL}/roulette.html`)],
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

const server = http.createServer((req, res) => {
  // Находим чистый путь без параметров (например, /roulette.html)
  const urlPath = req.url.split('?')[0];

  // Если запрашивают главную страницу, отдаем index.html
  let fileName = urlPath === '/' ? 'index.html' : urlPath;

  // Если запрашивают файлы рулетки, берем их прямо из папки public
  let filePath = path.join(__dirname, 'public', fileName);

  // Проверяем, что файл вообще существует
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Файл не найден');
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';

  if (extname === '.js') contentType = 'text/javascript';
  if (extname === '.css') contentType = 'text/css';
  if (extname === '.json') contentType = 'application/json; charset=utf-8';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(500);
      res.end(`Ошибка сервера: ${error.code}`);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Web App] Сервер статически раздается на порту ${PORT}`);
});

bot.launch();

process.once('SIGINT', () => {
  bot.stop('SIGINT');
  server.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  server.close();
});