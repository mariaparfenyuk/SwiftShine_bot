(function () {
  'use strict';

  const tg = window.Telegram?.WebApp;

  const RANKS = [
    { min: 0, max: 100, name: "Уставший кабачок 🥬" },
    { min: 101, max: 300, name: "Энергичный сурикат 🐒" },
    { min: 301, max: 600, name: "Хозяйственный енот 🦝" },
    { min: 601, max: Infinity, name: "Магистр порядка 🧙✨" }
  ];

  const STORAGE_KEY = 'app_user_xp';

  function getXP() {
    return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
  }

  function setXP(amount) {
    localStorage.setItem(STORAGE_KEY, amount.toString());
  }

  function getRankInfo(xp) {
    const currentRankIndex = RANKS.findIndex(r => xp >= r.min && xp <= r.max);
    const current = RANKS[currentRankIndex] || RANKS[0];
    const next = RANKS[currentRankIndex + 1] || null;

    return {
      level: currentRankIndex + 1,
      name: current.name,
      min: current.min,
      max: current.max === Infinity ? current.min + 500 : current.max,
      isMax: current.max === Infinity
    };
  }

  function _checkLevelUp(oldXp, newXp) {
    const oldRank = getRankInfo(oldXp);
    const newRank = getRankInfo(newXp);
    if (newRank.level > oldRank.level) {
      triggerLevelUp(newRank);
    }
  }

  function addXP(amount) {
    const oldXp = getXP();
    let currentXp = oldXp + amount;

    if (currentXp < 0) {
      currentXp = 0;
    }

    setXP(currentXp);

    if (amount > 0) {
      _checkLevelUp(oldXp, currentXp);
    }
    updateUI();
  }

  function triggerLevelUp(rankInfo) {
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
    if (typeof window.confetti === 'function') {
      window.confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    const popup = document.createElement('div');
    popup.className = 'level-popup';
    popup.innerHTML = `
      <div class="level-popup-content">
        <h2>🎉 Новый ранг!</h2>
        <p>Поздравляем! Твой уровень чистоты вырос!</p>
        <div class="level-popup-rank" style="cursor: pointer; border: 1px dashed #2563eb; color: #2563eb; background: #f1f5f9; display: inline-block; padding: 10px 16px; border-radius: 12px; margin-bottom: 24px; font-weight: 700;" title="Посмотреть в профиле">
          ${rankInfo.name} 🔍
        </div>
        <button class="level-popup-btn">Погнали дальше 🚀</button>
      </div>
    `;

    document.body.appendChild(popup);

    popup.querySelector('.level-popup-btn').addEventListener('click', () => {
      popup.remove();
    });

    popup.querySelector('.level-popup-rank').addEventListener('click', () => {
      popup.remove();
      if (typeof window.switchScreen === 'function') {
        window.switchScreen('profile');
      }
    });
  }

  function updateUI() {
    const xp = getXP();
    const info = getRankInfo(xp);

    const headerText = document.getElementById('xp-header-text');
    if (headerText) {
      headerText.textContent = `Lvl ${info.level} • ${xp}/${info.max} XP`;
    }

    const profileRankTitle = document.getElementById('profile-rank-title');
    const profileXpText = document.getElementById('profile-xp-text');
    const profileProgressBar = document.getElementById('profile-progress-bar');
    const profileImg = document.getElementById('profile-rank-img');

    if (profileRankTitle) profileRankTitle.textContent = info.name;
    if (profileXpText) profileXpText.textContent = `${xp} / ${info.max} XP (Всего накоплено)`;

    if (profileProgressBar) {
      const progressPercent = ((xp - info.min) / (info.max - info.min)) * 100;
      profileProgressBar.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
    }

    if (profileImg) {
      profileImg.className = `profile-avatar lvl-${info.level}`;
      profileImg.src = `img/rank-${info.level}.png`;
    }
  }

  window.Gamification = {
    addXP: addXP,
    updateUI: updateUI
  };

  document.addEventListener('DOMContentLoaded', updateUI);

})();