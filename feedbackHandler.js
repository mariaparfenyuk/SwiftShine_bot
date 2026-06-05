const { keyboards } = require('./keyboards');

const feedbackState = new Map();

function setupFeedbackHandlers(bot) {
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
}

module.exports = {
  setupFeedbackHandlers
};