const fs = require('fs');
const path = require('path');

const statsPath = path.join(__dirname, 'stats.json');

function updateUsersStats(user) {
  if (!user || !user.id) return;

  try {
    let users = {};
    if (fs.existsSync(statsPath)) {
      users = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    }

    const userId = String(user.id);
    const now = new Date().toISOString();

    if (!users[userId]) {
      users[userId] = {
        username: user.username || null,
        first_name: user.first_name || 'Anonymous',
        first_start: now,
        last_seen: now,
        is_premium: false,
        premium_until: null
      };
    } else {
      users[userId].username = user.username || users[userId].username;
      users[userId].first_name = user.first_name || users[userId].first_name;
      users[userId].last_seen = now;
    }

    fs.writeFileSync(statsPath, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error('Ошибка записи статистики в JSON:', error);
  }
}

module.exports = {
  updateUsersStats,
  statsPath
};