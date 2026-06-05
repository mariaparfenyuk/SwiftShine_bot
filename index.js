require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const path = require('path');

const { keyboards } = require('./keyboards');
const { messages } = require('./messages');
const { updateUsersStats } = require('./statsService');
const { setupFeedbackHandlers } = require('./feedbackHandler');
const { setupActionsHandlers, monthTasksData } = require('./actionsHandler');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('CRITICAL: BOT_TOKEN is missing in environment variables!');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.use(async (ctx, next) => {
  if (ctx.from) {
    updateUsersStats(ctx.from);
  }
  return next();
});

setupActionsHandlers(bot);
setupFeedbackHandlers(bot);

bot.on('web_app_data', async (ctx) => { /* твой старый пустой или резервный обработчик, если нужен */ });

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