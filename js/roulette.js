(function () {
  const tg = window.Telegram?.WebApp;

  let tasksData = [
    {
      "name": "Кухня",
      "tasks": [
        {
          "action_with_object": "Протри раковину и смеситель",
          "quantity_options": ["1 раз", "до блеска", "за 2 минуты"]
        },
        {
          "action_with_object": "Протри кухонные фасады",
          "quantity_options": ["3 шт", "верхний ряд", "вокруг ручек"]
        },
        {
          "action_with_object": "Наведи порядок в специях или крупах",
          "quantity_options": ["1 полка", "5 баночек", "быстро"]
        }
      ]
    },
    {
      "name": "Ванная и туалет",
      "tasks": [
        {
          "action_with_object": "Почисти зеркало",
          "quantity_options": ["1 раз", "главное", "быстро"]
        },
        {
          "action_with_object": "Протри полочки с косметикой",
          "quantity_options": ["1 полка", "все тюбики", "сверху"]
        }
      ]
    },
    {
      "name": "Жилая комната",
      "tasks": [
        {
          "action_with_object": "Разложи вещи по местам",
          "quantity_options": ["5 штук", "10 штук", "стул/диван"]
        },
        {
          "action_with_object": "Протри пыль на видимых поверхностях",
          "quantity_options": ["1 комод", "телевизор и тумба", "подоконник"]
        }
      ]
    }
  ];

  let isSpinning = false;
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
      if (tasksData && tasksData.length > 0) {
        const randomZone = tasksData[Math.floor(Math.random() * tasksData.length)];
        const randomTask = randomZone.tasks[Math.floor(Math.random() * randomZone.tasks.length)];
        const randomQuantity = randomTask.quantity_options[Math.floor(Math.random() * randomTask.quantity_options.length)];

        if (texts.action) texts.action.textContent = randomTask.action_with_object;
        if (texts.quantity) texts.quantity.textContent = randomQuantity;
        if (texts.zone) texts.zone.textContent = randomZone.name;
      }
    } catch (e) {
      console.error("Ошибка инициализации: ", e);
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
    if (attemptsLeft <= 0 && rerollBtn) rerollBtn.disabled = true;
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
  }

  function startSpin() {
    if (isSpinning) return;

    if (!tasksData || tasksData.length === 0) {
      triggerHaptic('warning');
      stopReelsWithError();
      return;
    }

    if (attemptsLeft <= 0) {
      triggerHaptic('warning');
      alert('3 задачи в день! Маленькие шажки, чтобы не перегореть');
      return;
    }

    isSpinning = true;

    attemptsLeft = Math.max(0, attemptsLeft - 1);
    localStorage.setItem('slot_spin_attempts', attemptsLeft.toString());
    if (counterEl) counterEl.textContent = `Осталось попыток: ${attemptsLeft}`;

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
          if (attemptsLeft <= 0 && rerollBtn) rerollBtn.disabled = true;
        }
      }, delay);
    });
  }

  if (spinBtn) spinBtn.addEventListener('click', startSpin);

  if (rerollBtn) {
    rerollBtn.addEventListener('click', () => {
      if (attemptsLeft <= 0) {
        triggerHaptic('warning');
        alert('3 задачи в день! Маленькие шажки, чтобы не перегореть');
        return;
      }
      if (actionBlock) actionBlock.classList.add('hidden');
      if (spinBtn) spinBtn.remove('hidden');
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