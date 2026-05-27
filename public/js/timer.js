// Логика Таймера, адаптированная под SPA
(function () {
  const tg = window.Telegram?.WebApp;

  const MOTIVATORS = [
    { timeFromStart: 0, text: "Погнали! Ставь таймер и не думай о масштабах катастрофы. 🚀" },
    { timeFromStart: 60, text: "Первая минута позади. Главное — просто продолжать двигаться! 💪" },
    { timeFromStart: 180, text: "Прошло 3 минуты. Где-то в мире грустит один носок без пары, найди его! 🧦" },
    { timeFromStart: 450, text: "Половина пути! Ты убираешься круче, чем профессиональный клининг! ✨" },
    { timeFromStart: 600, text: "Осталось 5 минут. Ты двигаешься быстрее, чем Ferrari! 🏎️" },
    { timeFromStart: 840, text: "Финальная прямая! Осталась всего минута. Поднажми! 🔥" }
  ];

  class CleaningTimer {
    constructor(defaultDuration = 15 * 60) {
      this.defaultDuration = defaultDuration;
      this.timeLeft = defaultDuration;
      this.isRunning = false;
      this.timerInterval = null;
      this.wakeLock = null;
      this.onTick = null;
      this.onStateChange = null;
      this.onFinish = null;

      this.initPersistence();
    }

    initPersistence() {
      const savedTimeLeft = localStorage.getItem('timer_time_left');
      const savedIsRunning = localStorage.getItem('timer_is_running');
      const savedTimestamp = localStorage.getItem('timer_timestamp');

      if (savedTimeLeft && savedIsRunning && savedTimestamp) {
        const deltaSeconds = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
        const remaining = parseInt(savedTimeLeft, 10);
        const isTimerActive = savedIsRunning === 'true';

        if (isTimerActive) {
          if (remaining - deltaSeconds > 0) {
            this.timeLeft = remaining - deltaSeconds;
            this.start();
          } else {
            this.timeLeft = 0;
            setTimeout(() => { if (this.onFinish) this.onFinish(); }, 500);
          }
        } else {
          this.timeLeft = remaining;
        }
      }
    }

    saveState() {
      localStorage.setItem('timer_time_left', this.timeLeft);
      localStorage.setItem('timer_is_running', this.isRunning);
      localStorage.setItem('timer_timestamp', Date.now());
    }

    clearPersistence() {
      localStorage.removeItem('timer_time_left');
      localStorage.removeItem('timer_is_running');
      localStorage.removeItem('timer_timestamp');
    }

    start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.requestWakeLock();

      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        this.saveState();

        if (this.onTick) this.onTick(this.timeLeft);

        if (this.timeLeft <= 0) {
          this.stop();
          this.clearPersistence();
          if (this.onFinish) this.onFinish();
        }
      }, 1000);

      if (this.onStateChange) this.onStateChange(this.isRunning);
      this.saveState();
    }

    pause() {
      if (!this.isRunning) return;
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this.releaseWakeLock();

      if (this.onStateChange) this.onStateChange(this.isRunning);
      this.saveState();
    }

    stop() {
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this.releaseWakeLock();
    }

    reset() {
      this.pause();
      this.timeLeft = this.defaultDuration;
      this.clearPersistence();
      if (this.onTick) this.onTick(this.timeLeft);
    }

    get timePassed() {
      return this.defaultDuration - this.timeLeft;
    }

    async requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          this.wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.warn(`Wake Lock Error: ${err.message}`);
        }
      }
    }

    releaseWakeLock() {
      if (this.wakeLock) {
        this.wakeLock.release().then(() => { this.wakeLock = null; });
      }
    }
  }

  // Привязка к DOM элементам (id совпадают с новым index.html)
  const timerDisplay = document.getElementById('timer-display');
  const motivatorText = document.getElementById('motivator-text');
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  const successSound = document.getElementById('success-sound');

  const timer = new CleaningTimer(15 * 60);

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  let currentMotivatorIndex = -1;
  function updateMotivator(timePassed) {
    const target = MOTIVATORS.reduce((prev, curr) => {
      return (timePassed >= curr.timeFromStart) ? curr : prev;
    }, MOTIVATORS[0]);

    const targetIndex = MOTIVATORS.indexOf(target);

    if (targetIndex !== currentMotivatorIndex) {
      currentMotivatorIndex = targetIndex;

      motivatorText.classList.add('fade-out');
      setTimeout(() => {
        motivatorText.textContent = target.text;
        motivatorText.classList.remove('fade-out');
      }, 400);
    }
  }

  timer.onTick = (timeLeft) => {
    if (timerDisplay) timerDisplay.textContent = formatTime(timeLeft);
    updateMotivator(timer.timePassed);
  };

  timer.onStateChange = (isRunning) => {
    if (isRunning) {
      btnStart.classList.add('hidden');
      btnPause.classList.remove('hidden');
    } else {
      btnStart.classList.remove('hidden');
      btnPause.classList.add('hidden');
    }
  };

  timer.onFinish = () => {
    if (timerDisplay) timerDisplay.textContent = "00:00";

    if (successSound) {
      successSound.play().catch(e => console.log("Аудио заблокировано политикой браузера:", e));
    }

    const duration = 4 * 1000;
    const end = Date.now() + duration;

    // Вызов confetti (скрипт подключен глобально в index.html)
    if (typeof confetti === 'function') {
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0, y: 0.8 } });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1, y: 0.8 } });
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }

    if (motivatorText) motivatorText.textContent = "Ура! Чистота и порядок! Ты легенда! 🏆";
    btnStart.classList.remove('hidden');
    btnPause.classList.add('hidden');

    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
  };

  btnStart.addEventListener('click', () => timer.start());
  btnPause.addEventListener('click', () => timer.pause());
  btnReset.addEventListener('click', () => {
    if (confirm("Сбросить таймер? Время обнулится.")) {
      timer.reset();
    }
  });

  if (timerDisplay) timerDisplay.textContent = formatTime(timer.timeLeft);
  updateMotivator(timer.timePassed);

  if (timerDisplay) timerDisplay.textContent = formatTime(timer.timeLeft);
  updateMotivator(timer.timePassed);

  if (timer.isRunning) {
    if (btnStart) btnStart.classList.add('hidden');
    if (btnPause) btnPause.classList.remove('hidden');
  }
})();