const fs = require('fs');
const path = require('path');
const { keyboards } = require('./keyboards');
const { messages } = require('./messages');

const loadJson = (fileName) => JSON.parse(fs.readFileSync(path.join(__dirname, fileName), 'utf-8'));
const everydayTasksData = loadJson('everydayTasks.json');
const monthTasksData = loadJson('monthTasks.json');
const expressCheckListData = loadJson('expressCheckList.json');

const { getTodayTask } = require('./utils/getTodayTask');
const { updateBotDateCache } = require('./utils/updateBotDateCache');
const { trackStats } = require('./utils/trackStats');

function getFreshBotDate() {
  return updateBotDateCache();
}

function setupActionsHandlers(bot) {
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

    await ctx.reply(message, {
      parse_mode: 'Markdown',
      ...keyboards.navigation
    });
  });

  bot.action('get_zone_checklist', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const currentWeek = getFreshBotDate().flyLadyWeek;
      const weekData = monthTasksData.find(item => item.week === currentWeek);

      if (!weekData) {
        const emptyMessage = `🧹 *Чек-лист по зонам*\n\nНа этой неделе (Неделя ${currentWeek}) план уборки отдыхает. Расслабься!`;
        return ctx.reply(emptyMessage, {
          parse_mode: 'Markdown',
          ...keyboards.navigation
        });
      }

      const tasksList = weekData.tasks.map((task, index) => `${index + 1}. ◽️ ${task}`).join('\n');
      const message = `${weekData.emoji} *Неделя ${weekData.week}: Зона «${weekData.zone}»*\n⚠️ *Твой чек-лист на эти 7 дней:*\nВыбирай по 1-2 пункта в день, ставь таймер на 15 минут и действуй!\n\n${tasksList}`;

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...keyboards.navigation
      });
    } catch (error) {
      console.error('Checklist Error:', error);
      await ctx.reply(messages.CHECK_LIST_ERROR, { ...keyboards.navigation });
    }
  });

  bot.action('get_express_clean', async (ctx) => {
    await ctx.answerCbQuery();
    try {
      const formattedSteps = expressCheckListData.steps
        .map(s => `⏱ *Шаг ${s.step} [${s.time}]: ${s.action}*\n${s.description}`)
        .join('\n\n');

      const message = `${expressCheckListData.title}\n\n${expressCheckListData.intro}\n\n──────────────────\n\n${formattedSteps}\n\n──────────────────\n\n✨ *${expressCheckListData.outro}*`;

      await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...keyboards.navigation
      });
    } catch (error) {
      console.error('Express Clean Error:', error);
      await ctx.reply(messages.EXPRESS_ERROR, {
        ...keyboards.navigation
      });
    }
  });

  bot.action('go_to_donate', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(messages.DONATE_MESSAGE, {
      parse_mode: 'Markdown',
      ...keyboards.donate
    });
  });

  bot.action('go_to_main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply(messages.MAIN_MENU, keyboards.main);
  });

  bot.command('admin_stats', async (ctx) => {
    const userId = ctx.from.id;
    const adminId = Number(process.env.ADMIN_CHAT_ID);

    if (userId !== adminId) return;

    try {
      const statsPath = path.join(__dirname, 'stats.json');
      if (!fs.existsSync(statsPath)) {
        return ctx.reply('📊 Статистика пуста. Файл stats.json еще не создан.');
      }

      const users = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
      const totalUsers = Object.keys(users).length;

      let premiumCount = 0;
      const now = new Date();

      Object.values(users).forEach(user => {
        if (user.is_premium) {
          premiumCount++;
        } else if (user.premium_until && new Date(user.premium_until) > now) {
          premiumCount++;
        }
      });

      const report = `📊 *Текущая статистика бота:*\n\n` +
        `👥 Всего пользователей в базе: *${totalUsers}*\n` +
        `👑 С активным Premium: *${premiumCount}*\n` +
        `🆓 На бесплатном триале: *${totalUsers - premiumCount}*`;

      await ctx.reply(report, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Ошибка при чтении статистики для админа:', error);
      await ctx.reply('❌ Ошибка при сборке статистики.');
    }
  });
}

module.exports = {
  setupActionsHandlers,
  monthTasksData
};