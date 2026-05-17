const fs = require('fs');
const path = require('path');

function trackStats() {
  const filePath = path.join(__dirname, '..', 'stats.txt');

  try {
    let count = 0;

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8').trim();
      count = parseInt(data, 10) || 0;
    }

    count += 1;

    fs.writeFileSync(filePath, count.toString(), 'utf-8');
  } catch (error) {
    console.error('[STATS ERROR] Не удалось обновить статистику:', error);
  }
}

module.exports = { trackStats };