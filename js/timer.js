const { MOTIVATORS } = require('./motivators');

(function () {
  'use strict';
  const tg = window.Telegram?.WebApp;
  const DEFAULT_DURATION = 15 * 60;

  const STORAGE_KEYS = {
    TIME_LEFT: 'timer_time_left',
    IS_RUNNING: 'timer_is_running',
    TIMESTAMP: 'timer_timestamp'
  };

  class CleaningTimer {
    constructor(duration = DEFAULT_DURATION) {
      this.duration = duration;
      this.timeLeft = duration;
      this.isRunning = false;
      this.timerInterval = null;
      this.wakeLock = null;
      this.onTick = null;
      this.onStateChange = null;
      this.onFinish = null;

      this._loadPersistedState();
    }

    _loadPersistedState() {
      const savedTime = localStorage.getItem(STORAGE_KEYS.TIME_LEFT);
      const savedRunning = localStorage.getItem(STORAGE_KEYS.IS_RUNNING);
      const savedTimestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);

      if (!savedTime || !savedRunning || !savedTimestamp) return;

      const deltaSeconds = Math.floor((Date.now() - parseInt(savedTimestamp, 10)) / 1000);
      const remaining = parseInt(savedTime, 10);
      const wasActive = savedRunning === 'true';

      if (wasActive) {
        if (remaining - deltaSeconds > 0) {
          this.timeLeft = remaining - deltaSeconds;
          setTimeout(() => this.start(), 0);
        } else {
          this.timeLeft = 0;
          this._clearPersistence();
          setTimeout(() => this._triggerEvent(this.onFinish), 100);
        }
      } else {
        this.timeLeft = remaining;
      }
    }

    _saveState() {
      localStorage.setItem(STORAGE_KEYS.TIME_LEFT, this.timeLeft);
      localStorage.setItem(STORAGE_KEYS.IS_RUNNING, this.isRunning);
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now());
    }

    _clearPersistence() {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    }

    _triggerEvent(callback, ...args) {
      if (typeof callback === 'function') {
        callback(...args);
      }
    }

    get timePassed() {
      return this.duration - this.timeLeft;
    }

    start() {
      if (this.isRunning) return;

      clearInterval(this.timerInterval);

      this.isRunning = true;
      this._requestWakeLock();
      this._triggerEvent(this.onStateChange, this.isRunning);

      this.timerInterval = setInterval(() => {
        this.timeLeft--;
        this._saveState();
        this._triggerEvent(this.onTick, this.timeLeft);

        if (this.timeLeft <= 0) {
          this.stop();
          this._clearPersistence();
          this._triggerEvent(this.onFinish);
        }
      }, 1000);

      this._saveState();
    }

    pause() {
      if (!this.isRunning) return;

      this.isRunning = false;
      clearInterval(this.timerInterval);
      this._releaseWakeLock();

      this._saveState();
      this._triggerEvent(this.onStateChange, this.isRunning);
    }

    stop() {
      this.isRunning = false;
      clearInterval(this.timerInterval);
      this._releaseWakeLock();
    }

    reset() {
      this.stop();
      this.timeLeft = this.duration;
      this._clearPersistence();
      this._triggerEvent(this.onTick, this.timeLeft);
      this._triggerEvent(this.onStateChange, this.isRunning);
    }

    async _requestWakeLock() {
      if (!('wakeLock' in navigator)) return;
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn(`Wake Lock Error: ${err.message}`);
      }
    }

    _releaseWakeLock() {
      if (this.wakeLock) {
        this.wakeLock.release().then(() => { this.wakeLock = null; });
      }
    }
  }

  class TimerInterface {
    constructor(timerInstance) {
      this.timer = timerInstance;
      this.currentMotivatorIndex = -1;

      this.dom = {
        display: document.getElementById('timer-display'),
        motivator: document.getElementById('motivator-text'),
        btnStart: document.getElementById('btn-start'),
        btnPause: document.getElementById('btn-pause'),
        btnReset: document.getElementById('btn-reset'),
        sound: document.getElementById('success-sound')
      };

      this.init();
    }

    init() {
      this.bindEvents();
      this.renderTime(this.timer.timeLeft);
      this.updateMotivatorText(this.timer.timePassed);
      this.syncControls(this.timer.isRunning);
    }

    bindEvents() {
      this.timer.onTick = (timeLeft) => {
        this.renderTime(timeLeft);
        this.updateMotivatorText(this.timer.timePassed);
      };

      this.timer.onStateChange = (isRunning) => this.syncControls(isRunning);
      this.timer.onFinish = () => this.handleTimerFinish();

      this.dom.btnStart?.addEventListener('click', () => this.timer.start());
      this.dom.btnPause?.addEventListener('click', () => this.timer.pause());
      this.dom.btnReset?.addEventListener('click', () => this.timer.reset());
    }

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      return `${mins}:${secs}`;
    }

    renderTime(seconds) {
      if (this.dom.display) {
        this.dom.display.textContent = this.formatTime(seconds);
      }
    }

    syncControls(isRunning) {
      if (isRunning) {
        this.dom.btnStart?.classList.add('hidden');
        this.dom.btnPause?.classList.remove('hidden');
      } else {
        this.dom.btnStart?.classList.remove('hidden');
        this.dom.btnPause?.classList.add('hidden');
      }
    }

    updateMotivatorText(timePassed) {
      if (!this.dom.motivator) return;
      const activeMotivator = MOTIVATORS.reduce((prev, curr) => {
        return (timePassed >= curr.timeFromStart) ? curr : prev;
      }, MOTIVATORS[0]);
      const targetIndex = MOTIVATORS.indexOf(activeMotivator);
      if (targetIndex !== this.currentMotivatorIndex) {
        this.currentMotivatorIndex = targetIndex;

        this.dom.motivator.classList.add('fade-out');
        setTimeout(() => {
          this.dom.motivator.textContent = activeMotivator.text;
          this.dom.motivator.classList.remove('fade-out');
        }, 300);
      }
    }

    handleTimerFinish() {
      this.renderTime(0);
      this.syncControls(false);

      if (this.dom.motivator) {
        this.dom.motivator.textContent = "Ура! Чистота и порядок! Ты легенда! 🏆";
      }

      if (this.dom.sound) {
        this.dom.sound.play().catch(e => console.log("Audio playback blocked:", e));
      }

      this.triggerConfetti();

      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    }

    triggerConfetti() {
      if (typeof confetti !== 'function') return;

      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;

      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.85 } });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.85 } });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      }());
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const timerCore = new CleaningTimer(DEFAULT_DURATION);
    new TimerInterface(timerCore);
  });

})();