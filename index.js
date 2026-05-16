const { Telegraf, Markup } = require('telegraf');

const BOT_TOKEN = 'ВАШ_ТОКЕН_ЗДЕСЬ';
const bot = new Telegraf(BOT_TOKEN);

const donateKeyboard = Markup.inlineKeyboard([
  Markup.button.url('💸 Донат', 'https://www.donationalerts.com/')
]);

bot.start((ctx) => {
  ctx.reply(
    'Привет! Я базовый бот.\n\nДоступные команды:\n/start — приветствие\n/help — помощь',
    donateKeyboard
  );
});

bot.help((ctx) => {
  ctx.reply(
    'Я могу:\n- Приветствовать тебя\n- Показывать кнопку для доната\n- Отвечать на команды /start и /help\n\nПросто напиши мне что-нибудь!',
    donateKeyboard
  );
});


bot.on('text', (ctx) => {
  const text = ctx.message.text;

  if (!/^[а-яА-ЯёЁ\s]+$/u.test(text)) {
    ctx.reply('Пожалуйста, отправьте сообщение только на русском языке (без латиницы, цифр, эмоджи или спецсимволов).', donateKeyboard);
    return;
  }

  ctx.reply(`Вы написали: "${text}"`, donateKeyboard);
});

bot.on(['sticker', 'photo', 'video', 'voice', 'audio', 'document', 'animation', 'video_note', 'contact', 'location', 'venue', 'dice', 'game', 'poll'], (ctx) => {
  ctx.reply('Пожалуйста, отправьте обычный текст на русском языке.', donateKeyboard);
});

bot.catch((err, ctx) => {
  console.error(`Ошибка для ${ctx.updateType}`, err);
  ctx.reply('Произошла ошибка. Попробуйте еще раз.', donateKeyboard);
});

bot.launch();
console.log('Бот запущен!');
