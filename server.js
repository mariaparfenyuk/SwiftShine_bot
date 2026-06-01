import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/feedback', async (req, res) => {
  try {
    const { rating, user, text } = req.body;

    if (!rating) {
      return res.status(400).json({ error: 'Оценка обязательна' });
    }

    const botToken = process.env.BOT_TOKEN;
    const adminChatId = process.env.ADMIN_CHAT_ID;

    if (!botToken || !adminChatId) {
      console.error('Ошибка бэкенда: Секретные ключи BOT_TOKEN или ADMIN_CHAT_ID не найдены в .env');
      return res.status(500).json({ error: 'Ошибка конфигурации сервера' });
    }

    const userData = user || { id: 'Неизвестно', first_name: 'Пользователь', username: '' };
    const textReview = text ? text.trim() : 'Без текстового отзыва';

    const message = `⭐️ *НОВЫЙ ОТЗЫВ!*\n\n` +
      `• *Оценка:* ${rating}/5\n` +
      `• *Пользователь:* [${userData.first_name}](tg://user?id=${userData.id}) ${userData.username ? '@' + userData.username : ''}\n` +
      `• *ID:* \`${userData.id}\`\n` +
      `• *Текст:* "${textReview}"`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: adminChatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    if (telegramResponse.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errData = await telegramResponse.json();
      console.error('Ошибка Telegram API:', errData);
      return res.status(502).json({ error: 'Ошибка при отправке в Telegram' });
    }

  } catch (error) {
    console.error('Критическая ошибка сервера:', error);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

app.listen(PORT, () => {
  console.log(`Сервер безопасности запущен на порту ${PORT}`);
});