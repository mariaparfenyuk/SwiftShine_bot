/**
 * ARCHITECTURE: Slot Machine (Roulette) Module with XP Integration
 * Handles: Reels Spinning, Daily Reroll Limits & XP Rewards
 */

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

  // Ищем элементы по классам и по ID, чтобы точно найти их в твоей верстке
  const reels = document.querySelectorAll('.reel');
  const spinBtn = document.getElementById('spin-btn') || document.querySelector('.go-btn') || document.querySelector('.main-btn');
  const spinsCounter = document.getElementById('spins-left-counter') || document.querySelector('.counter');

  function init() {
    updateCounterUI();
    if (spinBtn) {
      // На всякий случай очищаем старые обработчики и вешаем один чистый
      spinBtn.onclick = spin;
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

    if (spinBtn) spinBtn.disabled = true;
    triggerHaptic('medium');

    // ГЕЙМИФИКАЦИЯ
    if (window.Gamification) {
      window.Gamification.addXP(10);
    }

    // Запуск анимации
    reels.forEach(reel => {
      reel.classList.remove('blur-off');
      reel.classList.add('spinning');
      const txt = reel.querySelector('.text-container');
      if (txt) txt.textContent = "🎲 ...";
    });

    // Поочередная остановка
    reels.forEach((reel, index) => {
      setTimeout(() => {
        reel.classList.remove('spinning');
        reel.classList.add('blur-off');

        const randomTask = SLOT_TASKS[Math.floor(Math.random() * SLOT_TASKS.length)];
        const txt = reel.querySelector('.text-container');
        if (txt) txt.textContent = randomTask;
        triggerHaptic('light');

        // Финал анимации
        if (index === reels.length - 1) {
          if (spinBtn) {
            spinBtn.disabled = dailySpinsLeft <= 0;
          }
        }
      }, (index + 1) * 800);
    });
  }

  function updateCounterUI() {
    if (spinsCounter) {
      // Обновляем текст, сохраняя структуру (цифру)
      if (spinsCounter.textContent.includes('попыт')) {
        spinsCounter.textContent = `Осталось попыток: ${dailySpinsLeft}`;
      } else {
        spinsCounter.textContent = dailySpinsLeft;
      }
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