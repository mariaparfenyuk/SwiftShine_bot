require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { getCurrentDate } = require('./utils/getCurrentDate');
const { getTodayTask } = require('./utils/getTodayTask');
const { messages } = require('./messages');

const BOT_TOKEN = process.env.BOT_TOKEN || 'ВАШ_ТОКЕН_ЗДЕСЬ';
const bot = new Telegraf(BOT_TOKEN);

function getFlyLadyWeek() {
  const now = new Date();
  const currentDay = now.getDate();
  let weekCount = 1;

  for (let i = 1; i < currentDay; i++) {
    const checkDate = new Date(now.getFullYear(), now.getMonth(), i);
    if (checkDate.getDay() === 1) {
      weekCount++;
    }
  }

  return weekCount > 5 ? 5 : weekCount;
}

// --- КЛАВИАТУРЫ ---

const mainKeyboard = Markup.inlineKeyboard([
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

const backKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback(messages.BACK, 'go_to_main')]
]);

bot.start((ctx) => {
  ctx.reply(
    messages.HELLO,
    mainKeyboard
  );
});

bot.help((ctx) => {
  ctx.reply(messages.HELP_MESSAGE, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

bot.action('get_everyday_task', async (ctx) => {
  await ctx.answerCbQuery();
  let task = getTodayTask();

  if (!task) {
    task = {
      zone: messages.ALL_HOME,
      text: messages.BUGY_27
    };
  }

  const message = `📅 *Задание на сегодня*\n📍 *Зона:* ${task.zone}\n──────────────────\n\n${task.text}`;
  await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: backKeyboard });
});

bot.action('get_zone_checklist', async (ctx) => {
  await ctx.answerCbQuery();
  try {
    const filePath = path.join(__dirname, 'monthTasks.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const monthTasks = JSON.parse(rawData);

    const currentWeek = getFlyLadyWeek();
    const weekData = monthTasks.find(item => item.week === currentWeek);

    if (!weekData) {
      await ctx.reply(
        `🧹 *Чек-лист по зонам*\n\nНа этой неделе (Неделя ${currentWeek}) план уборки отдыхает. Расслабься!`,
        { parse_mode: 'Markdown', reply_markup: backKeyboard }
      );
      return;
    }

    const tasksList = weekData.tasks.map((task, index) => `${index + 1}. ◽️ ${task}`).join('\n');
    const message = `${weekData.emoji} *Неделя ${weekData.week}: Зона «${weekData.zone}»*\n⚠️ *Твой чек-лист на эти 7 дней:*\nВыбирай по 1-2 пункта в день, ставь таймер на 15 минут и действуй!\n\n${tasksList}`;

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: backKeyboard });
  } catch (error) {
    console.error(error);
    await ctx.reply(messages.CHECK_LIST_ERROR, backKeyboard);
  }
});

bot.action('get_express_clean', async (ctx) => {
  await ctx.answerCbQuery();
  try {
    const filePath = path.join(__dirname, 'expressCheckList.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(rawData);

    const formattedSteps = data.steps.map(s => `⏱ *Шаг ${s.step} [${s.time}]: ${s.action}*\n${s.description}`).join('\n\n');
    const message = `${data.title}\n\n${data.intro}\n\n──────────────────\n\n${formattedSteps}\n\n──────────────────\n\n✨ *${data.outro}*`;

    await ctx.reply(message, { parse_mode: 'Markdown', reply_markup: backKeyboard });
  } catch (error) {
    console.error(error);
    await ctx.reply(messages.EXPRESS_ERROR, backKeyboard);
  }
});
bot.action('go_to_donate', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(messages.DONATE_MESSAGE, { parse_mode: 'Markdown', reply_markup: donateKeyboard });
});

bot.action('go_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(messages.MAIN_MENU, mainKeyboard);
});

bot.catch((err, ctx) => {
  console.error(err);
  ctx.reply(messages.ERROR, mainKeyboard);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));