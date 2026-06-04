(function () {
  'use strict';

  const tg = window.Telegram?.WebApp;
  let selectedRating = 0;

  const dom = {
    stars: document.querySelectorAll('#rating-stars-container .star'),
    formBlock: document.getElementById('feedback-form-block'),
    textarea: document.getElementById('feedback-text'),
    errorMsg: document.getElementById('feedback-error'),
    sendBtn: document.getElementById('btn-feedback-send'),
    backBtn: document.getElementById('btn-feedback-back')
  };

  function init() {
    bindEvents();
    checkExistingFeedback();
    // Расширяем WebApp на весь экран, чтобы кнопка была видна красиво
    if (tg) tg.expand();
  }

  function bindEvents() {
    dom.stars.forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.getAttribute('data-value'), 10);
        setRating(value);
      });
    });

    dom.textarea?.addEventListener('input', validateForm);
    dom.sendBtn?.addEventListener('click', sendFeedbackToTelegram);

    dom.backBtn?.addEventListener('click', () => {
      if (typeof window.switchScreen === 'function') {
        window.switchScreen('main');
      }
    });
  }

  function setRating(value) {
    selectedRating = value;
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    dom.stars.forEach(star => {
      const starValue = parseInt(star.getAttribute('data-value'), 10);
      if (starValue <= value) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });

    dom.formBlock?.classList.add('show');

    if (dom.textarea) {
      if (value === 5) {
        dom.textarea.placeholder = "Напишите пару добрых слов (необязательно) 🥰";
      } else {
        dom.textarea.placeholder = "Что мы можем улучшить? (необязательно) ✍️";
      }
    }

    if (dom.sendBtn) dom.sendBtn.disabled = false;
    dom.errorMsg?.classList.add('hidden');
  }

  function validateForm() {
    if (selectedRating === 0) {
      if (dom.sendBtn) dom.sendBtn.disabled = true;
      return;
    }

    const text = dom.textarea ? dom.textarea.value.trim() : '';

    if (selectedRating === 5) {
      if (dom.sendBtn) dom.sendBtn.disabled = false;
      dom.errorMsg?.classList.add('hidden');
    } else {
      if (text.length >= 10) {
        if (dom.sendBtn) dom.sendBtn.disabled = false;
        dom.errorMsg?.classList.add('hidden');
      } else {
        if (dom.sendBtn) dom.sendBtn.disabled = true;
        if (text.length > 0) {
          dom.errorMsg?.classList.remove('hidden');
        }
      }
    }
  }

  function sendFeedbackToTelegram() {
    if (!dom.sendBtn) return;

    dom.sendBtn.disabled = true;
    dom.sendBtn.textContent = "Отправка... ⏳";

    const textReview = dom.textarea ? dom.textarea.value.trim() : '';

    // Формируем объект отзыва
    const feedbackData = {
      action: 'user_feedback', // Маркер для бэкенда, чтобы он понял, что это отзыв
      rating: selectedRating,
      text: textReview
    };

    if (tg) {
      if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
      localStorage.setItem('app_feedback_submitted', 'true');

      dom.sendBtn.style.background = '#22c55e';
      dom.sendBtn.textContent = "Спасибо! Отправляем... ❤️";

      // МАГИЯ ТУТ: Отправляем данные напрямую в чат боту и закрываем окно!
      setTimeout(() => {
        tg.sendData(JSON.stringify(feedbackData));
      }, 1000);

    } else {
      // Заглушка, если тестируешь просто в браузере на ПК без Телеграма
      alert('В обычном браузере отправка невозможна, запустите внутри Telegram!');
      dom.sendBtn.disabled = false;
      dom.sendBtn.textContent = "Отправить отзыв";
    }
  }

  function checkExistingFeedback() {
    const isSubmitted = localStorage.getItem('app_feedback_submitted') === 'true';
    const menuBtn = document.getElementById('menu-btn-feedback');

    if (menuBtn) {
      if (isSubmitted) {
        menuBtn.innerHTML = "✏️ Изменить отзыв";
      } else {
        menuBtn.innerHTML = "⭐ Оценить нас";
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();