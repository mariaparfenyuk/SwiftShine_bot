(function () {
  'use strict';

  const tg = window.Telegram?.WebApp;

  const SLOT_TASKS = [
    "Протереть зеркало в ванной",
    "Выкинуть мусор",
    "Помыть кошачью миску",
    "Протереть подоконник",
    "Сложить вещи на стуле",
    "Помыть 5 тарелок",
    "Пропылесосить коврик",
    "Полить один цветок",
    "Протереть экран ТВ",
    "Убрать обувь в шкаф"
  ];

  let dailySpinsLeft = 3;
  const reels = [
    document.getElementById('reel-1'),
    document.getElementById('reel-2'),
    document.getElementById('reel-3')
  ];
  const spinBtn = document.getElementById('spin-btn');
  const spinsCounter = document.getElementById('spins-left-counter');

  function init() {
    updateCounterUI();
    if (spinBtn) {
      spinBtn.addEventListener('click', spin);
    }
  }

  function spin() {
    if (dailySpinsLeft <= 0) {
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
      alert("Попытки на сегодня закончились! Возвращайся завтра ⏳");
      return;
    }

    dailySpinsLeft--;
    updateCounterUI();

    spinBtn.disabled = true;
    triggerHaptic('medium');

    if (window.Gamification) {
      window.Gamification.addXP(10);
    }

    reels.forEach(reel => {
      reel.classList.remove('blur-off');
      reel.classList.add('spinning');
      reel.querySelector('.text-container').textContent = "🎲 ...";
    });

    reels.forEach((reel, index) => {
      setTimeout(() => {
        reel.classList.remove('spinning');
        reel.classList.add('blur-off');

        const randomTask = SLOT_TASKS[Math.floor(Math.random() * SLOT_TASKS.length)];
        reel.querySelector('.text-container').textContent = randomTask;
        triggerHaptic('light');

        if (index === reels.length - 1) {
          spinBtn.disabled = dailySpinsLeft <= 0;
        }
      }, (index + 1) * 800);
    });
  }

  function updateCounterUI() {
    if (spinsCounter) {
      spinsCounter.textContent = dailySpinsLeft;
    }
    if (spinBtn && dailySpinsLeft <= 0) {
      spinBtn.disabled = true;
      spinBtn.style.opacity = '0.5';
      spinBtn.textContent = "Завтра новые попытки 🔒";
    }
  }

  function triggerHaptic(type) {
    if (!tg?.HapticFeedback) return;
    if (type === 'light') tg.HapticFeedback.impactOccurred('light');
    if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
  }

  document.addEventListener('DOMContentLoaded', init);

})();