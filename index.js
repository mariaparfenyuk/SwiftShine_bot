require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { getCurrentDate } = require('./utils/getCurrentDate');
const { getTodayTask } = require('./utils/getTodayTask');

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

const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📅 Задание на сегодня', 'get_everyday_task')],
  [Markup.button.callback('🧹 Чек-лист по зонам', 'get_zone_checklist')],
  [Markup.button.callback('🚨 SOS: Гости на пороге!', 'get_express_clean')],
  [Markup.button.callback('💖 Поддержать автора', 'go_to_donate')]
]);

const donateKeyboard = Markup.inlineKeyboard([
  [Markup.button.url('🌍 PayPal', 'https://paypal.me/MParfeniuk100')],
  [Markup.button.url('🇷🇺 Boosty', 'https://boosty.to/parfeniuk/donate')],
]);

const backKeyboard = Markup.inlineKeyboard([
  Markup.button.callback('⬅️ В главное меню', 'go_to_main')
]);

bot.start((ctx) => {
  ctx.reply(
    'Привет! Я твой карманный помощник по дому. Помогаю убираться за 15 минут в день без стресса. Выбирай кнопку ниже! 👇',
    mainKeyboard
  );
});

bot.help((ctx) => {
  ctx.reply(
    'Я помогу тебе держать дом в чистоте, тратя всего 15 минут в день.\n\nЖми /start, чтобы открыть главное меню и выбрать нужный режим уборки!',
    mainKeyboard
  );
});

bot.action('get_everyday_task', async (ctx) => {
  await ctx.answerCbQuery();
  const task = getTodayTask();

  if (!task) {
    await ctx.reply(
      '📅 *Задание на сегодня*\n\nОтличные новости! На сегодня специальных заданий нет. Отдохни или повтори то, что не успела вчера! ✨',
      { parse_mode: 'Markdown', reply_markup: backKeyboard }
    );
    return;
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
    await ctx.reply('Не удалось загрузить чек-лист зон. Попробуй позже.', backKeyboard);
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
    await ctx.reply('Не удалось загрузить экстренный чек-лист. Но ты все равно справишься! Главное — спрячь хлам! 🔥', backKeyboard);
  }
});

bot.action('go_to_donate', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Выбери удобный способ для поддержки проекта: 👇', donateKeyboard);
});

bot.action('go_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply('Выбирай режим, никуда не спеши. 15 минут и готово! 👇', mainKeyboard);
});

bot.on('text', (ctx) => {
  const text = ctx.message.text;
  if (!/^[а-яА-ЯёЁ\s]+$/u.test(text)) {
    ctx.reply('Пожалуйста, отправьте сообщение только на русском языке.', mainKeyboard);
    return;
  }
  ctx.reply(`Вы написали: "${text}"`, mainKeyboard);
});

bot.on(['sticker', 'photo', 'video', 'voice', 'audio', 'document', 'animation', 'video_note', 'contact', 'location', 'venue', 'dice', 'game', 'poll'], (ctx) => {
  ctx.reply('Пожалуйста, отправьте обычный текст на русском языке.', mainKeyboard);
});

bot.help((ctx) => {
  const helpMessage =
    `🤖 *Я БыстроЧисто — твой помощник по уборке на лайте!*\n` +
    `Помогаю держать дом в чистоте без изнуряющих генеральных уборок, тратя всего 10–15 минут в день.\n\n` +
    `*Чем я полезен и как со мной работать:*\n\n` +
    `📅 *Задание на день (Микро-шаги)*\n` +
    `Точечная задача в конкретной зоне на сегодня. Включай таймер на 15 минут, делай одно быстрое действие и отдыхай! Задания чередуются по четным/нечетным месяцам, чтобы не было рутины.\n\n` +
    `📋 *Чек-лист на неделю (Фокус-зоны)*\n` +
    `Каждую неделю фокус смещается на одну из 5 макро-зон дома:\n` +
    `• Неделя 1: Прихожая и Коридор 🚪\n` +
    `• Неделя 2: Кухня 🍳\n` +
    `• Неделя 3: Ванная и Туалет 🧼\n` +
    `• Неделя 4: Спальня и Гостиная 🛌\n` +
    `• Неделя 5: Балкон и Хобби-зоны 📦\n` +
    `Запрашивай список задач, чтобы видеть общую картину недели.\n\n` +
    `🚨 *Экстренная уборка (План-перехват)*\n` +
    `Друзья или родственники уже на пороге? Без паники! Это пошаговый 15-минутный SOS-гид, который поможет быстро замаскировать бардак и создать идеальную иллюзию порядка в ключевых зонах.\n\n` +
    `Жми /start, чтобы открыть главное меню! 👇`;

  ctx.reply(helpMessage, { parse_mode: 'Markdown', reply_markup: mainKeyboard });
});

bot.catch((err, ctx) => {
  console.error(err);
  ctx.reply('Произошла ошибка. Попробуйте еще раз.', mainKeyboard);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));