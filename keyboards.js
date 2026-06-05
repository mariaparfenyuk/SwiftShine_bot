const { Markup } = require('telegraf');
const { messages } = require('./messages');

const APP_URL = 'https://swift-shine-bot-mariia-parfeniuks-projects.vercel.app/';

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
      Markup.button.callback('1️⃣ ⭐', 'rate_1'),
      Markup.button.callback('2️⃣ ⭐⭐', 'rate_2'),
      Markup.button.callback('3️⃣ ⭐⭐⭐', 'rate_3')
    ],
    [
      Markup.button.callback('4️⃣ ⭐⭐⭐⭐', 'rate_4'),
      Markup.button.callback('5️⃣ ⭐⭐⭐⭐⭐', 'rate_5')
    ],
    [Markup.button.callback(messages.BACK, 'go_to_main')]
  ]),
};

module.exports = {
  APP_URL,
  keyboards
};