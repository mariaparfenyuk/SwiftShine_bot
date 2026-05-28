(function () {
  'use strict';

  const tasksData = window.TASKS_DATA || [];
  const tg = window.Telegram?.WebApp;

  let attemptsLeft = 3;
  let isSpinning = false;

  const dom = {
    spinBtn: document.getElementById('spin-btn'),
    goBtn: document.getElementById('go-btn'),
    rerollBtn: document.getElementById('reroll-btn'),
    actionBlock: document.getElementById('action-block'),
    counter: document.getElementById('attempts-counter'),
    reels: [
      document.getElementById('reel-action'),
      document.getElementById('reel-quantity'),
      document.getElementById('reel-zone')
    ],
    texts: {
      action: document.getElementById('text-action'),
      quantity: document.getElementById('text-quantity'),
      zone: document.getElementById('text-zone')
    }
  };

  function triggerHaptic(type) {
    if (!tg?.HapticFeedback) return;
    switch (type) {
      case 'light': tg.HapticFeedback.impactOccurred('light'); break;
      case 'medium': tg.HapticFeedback.impactOccurred('medium'); break;
      case 'success': tg.HapticFeedback.notificationOccurred('success'); break;
      case 'warning': tg.HapticFeedback.notificationOccurred('error'); break;
    }
  }

  function checkLimits() {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem('slot_spin_date');
    const savedAttempts = localStorage.getItem('slot_spin_attempts');

    if (savedDate !== today) {
      localStorage.setItem('slot_spin_date', today);
      localStorage.setItem('slot_spin_attempts', '3');
      attemptsLeft = 3;
    } else if (savedAttempts !== null) {
      attemptsLeft = parseInt(savedAttempts, 10);
    } else {
      attemptsLeft = 3;
      localStorage.setItem('slot_spin_attempts', '3');
    }

    renderCounter();
  }

  function renderCounter() {
    if (dom.counter) {
      dom.counter.textContent = `Осталось попыток: ${attemptsLeft}`;
    }
    if (attemptsLeft <= 0 && dom.rerollBtn) {
      dom.rerollBtn.disabled = true;
    }
  }

  function startSpin() {
    if (isSpinning) return;

    if (tasksData.length === 0) {
      triggerHaptic('warning');
      alert('Ошибка: Данные задач не загружены.');
      return;
    }

    if (attemptsLeft <= 0) {
      triggerHaptic('warning');
      alert('3 задачи в день! Маленькие шажки, чтобы не перегореть.');
      return;
    }

    isSpinning = true;

    attemptsLeft--;
    localStorage.setItem('slot_spin_attempts', attemptsLeft.toString());
    renderCounter();

    if (dom.spinBtn) {
      dom.spinBtn.textContent = 'Удача решает...';
      dom.spinBtn.disabled = true;
    }
    if (dom.actionBlock) {
      dom.actionBlock.classList.add('hidden');
    }

    dom.reels.forEach(reel => {
      if (reel) {
        reel.classList.remove('blur-off');
        reel.classList.add('spinning');
      }
    });
    triggerHaptic('medium');

    const randomZone = tasksData[Math.floor(Math.random() * tasksData.length)];
    const randomTask = randomZone.tasks[Math.floor(Math.random() * randomZone.tasks.length)];
    const randomQuantity = randomTask.quantity_options[Math.floor(Math.random() * randomTask.quantity_options.length)];

    const delays = [1000, 1500, 2000];

    delays.forEach((delay, index) => {
      setTimeout(() => {
        const reel = dom.reels[index];
        if (reel) {
          reel.classList.remove('spinning');
          reel.classList.add('blur-off');
        }
        triggerHaptic('light');

        if (index === 0 && dom.texts.action) dom.texts.action.textContent = randomTask.action_with_object;
        if (index === 1 && dom.texts.quantity) dom.texts.quantity.textContent = randomQuantity;
        if (index === 2 && dom.texts.zone) dom.texts.zone.textContent = randomZone.name;

        if (index === 2) {
          isSpinning = false;
          triggerHaptic('success');

          if (dom.spinBtn) dom.spinBtn.classList.add('hidden');
          if (dom.actionBlock) dom.actionBlock.classList.remove('hidden');
          if (attemptsLeft <= 0 && dom.rerollBtn) dom.rerollBtn.disabled = true;
        }
      }, delay);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    checkLimits();

    dom.spinBtn?.addEventListener('click', startSpin);
    dom.rerollBtn?.addEventListener('click', startSpin);

    dom.goBtn?.addEventListener('click', () => {
      triggerHaptic('light');
      if (typeof window.switchScreen === 'function') {
        window.switchScreen('timer');
      }
    });
  });

})();