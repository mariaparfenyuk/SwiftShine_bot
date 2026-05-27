(function () {
  const tg = window.Telegram?.WebApp;

  let tasksData = [];
  let isSpinning = false;
  let hasSpun = false;
  let attemptsLeft = 3;

  const spinBtn = document.getElementById('spin-btn');
  const actionBlock = document.getElementById('action-block');
  const goBtn = document.getElementById('go-btn');
  const rerollBtn = document.getElementById('reroll-btn');
  const counterEl = document.getElementById('attempts-counter');

  const reels = [
    document.getElementById('reel-action'),
    document.getElementById('reel-quantity'),
    document.getElementById('reel-zone')
  ];
  const texts = {
    action: document.getElementById('text-action'),
    quantity: document.getElementById('text-quantity'),
    zone: document.getElementById('text-zone')
  };

  function triggerHaptic(type) {
    if (tg && tg.HapticFeedback) {
      try {
        if (type === 'light') tg.HapticFeedback.impactOccurred('light');
        if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        if (type === 'warning') tg.HapticFeedback.notificationOccurred('warning');
      } catch (e) {
        console.log('Haptic error ignored');
      }
    }
  }

  async function loadTasks() {
    try {
      // ИСПРАВЛЕНО: Теперь ищем файл rouletteTasks.json в папке roulette/ в корне проекта
      const response = await fetch(`${window.location.origin}/roulette/rouletteTasks.json`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      tasksData = await response.json();

      if (tasksData && tasksData.length > 0) {
        const randomZone = tasksData[Math.floor(Math.random() * tasksData.length)];
        const randomTask = randomZone.tasks[Math.floor(Math.random() * randomZone.tasks.length)];
        const randomQuantity = randomTask.quantity_options[Math.floor(Math.random() * randomTask.quantity_options.length)];

        if (texts.action) texts.action.textContent = randomTask.action_with_object;
        if (texts.quantity) texts.quantity.textContent = randomQuantity;
        if (texts.zone) texts.zone.textContent = randomZone.name;
      }
    } catch (e) {
      console.error("Ошибка fetch/JSON: ", e);
      if (texts.action) texts.action.textContent = "Ошибка";
      if (texts.quantity) texts.quantity.textContent = "загрузки";
      if (texts.zone) texts.zone.textContent = "данных";
      tasksData = [];
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
    }
    if (counterEl) counterEl.textContent = `Осталось попыток: ${attemptsLeft}`;
  }

  function stopReelsWithError() {
    isSpinning = false;
    reels.forEach(reel => {
      if (reel) {
        reel.classList.remove('spinning');
        reel.classList.add('blur-off');
      }
    });
    if (spinBtn) {
      spinBtn.textContent = 'Крутить рулетку';
      spinBtn.disabled = false;
    }
    if (texts.action) texts.action.textContent = "Попробуйте";
    if (texts.quantity) texts.quantity.textContent = "еще";
    if (texts.zone) texts.zone.textContent = "раз";
  }

  function startSpin() {
    if (isSpinning) return;

    // Защита: если данные задач по какой-то причине не загрузились, не даем крутить вечно
    if (!tasksData || tasksData.length === 0) {
      triggerHaptic('warning');
      stopReelsWithError();
      return;
    }

    if (hasSpun && attemptsLeft <= 0) {
      triggerHaptic('warning');
      alert('3 задачи в день! Маленькие шажки, чтобы не перегореть');
      return;
    }

    isSpinning = true;
    if (spinBtn) {
      spinBtn.textContent = 'Удача решает...';
      spinBtn.disabled = true;
    }

    reels.forEach(reel => {
      if (reel) {
        reel.classList.remove('blur-off');
        reel.classList.add('spinning');
      }
    });
    triggerHaptic('medium');

    const randomZone = tasksData[Math.floor(Math.random() * tasksData.length)];
    const randomTask = randomZone.tasks[Math.floor(Math.random() * randomZone.tasks.length)];
    const randomQuantity = randomTask.quantity_options[Math.floor(Math.random() * randomTask.quantity_options.length)];

    const delays = [1200, 1700, 2200];
    delays.forEach((delay, index) => {
      setTimeout(() => {
        if (reels[index]) {
          reels[index].classList.remove('spinning');
          reels[index].classList.add('blur-off');
        }
        triggerHaptic('light');

        if (index === 0 && texts.action) texts.action.textContent = randomTask.action_with_object;
        if (index === 1 && texts.quantity) texts.quantity.textContent = randomQuantity;
        if (index === 2 && texts.zone) texts.zone.textContent = randomZone.name;

        if (index === 2) {
          isSpinning = false;
          triggerHaptic('success');
          if (spinBtn) spinBtn.classList.add('hidden');
          if (actionBlock) actionBlock.classList.remove('hidden');

          if (hasSpun) {
            attemptsLeft = Math.max(0, attemptsLeft - 1);
            localStorage.setItem('slot_spin_attempts', attemptsLeft.toString());
            if (counterEl) counterEl.textContent = `Осталось попыток: ${attemptsLeft}`;
          }
          hasSpun = true;
          if (attemptsLeft <= 0 && rerollBtn) rerollBtn.disabled = true;
        }
      }, delay);
    });
  }

  if (spinBtn) spinBtn.addEventListener('click', startSpin);

  if (rerollBtn) {
    rerollBtn.addEventListener('click', () => {
      if (actionBlock) actionBlock.classList.add('hidden');
      if (spinBtn) spinBtn.classList.remove('hidden');
      startSpin();
    });
  }

  if (goBtn) {
    goBtn.addEventListener('click', () => {
      alert('Задание принято! Переходим к таймеру.');
      if (typeof window.switchScreen === 'function') {
        window.switchScreen('timer');
      }
    });
  }

  loadTasks().finally(() => {
    checkLimits();
  });
})();