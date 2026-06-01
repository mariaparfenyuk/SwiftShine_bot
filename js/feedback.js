(function () {
  'use strict';

  const tg = window.Telegram?.WebApp;
  let selectedRating = 0;

  const BACKEND_URL = 'https://decorator-litmus-grouped.ngrok-free.dev/api/feedback';

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
  }

  function bindEvents() {
    dom.stars.forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.getAttribute('data-value'), 10);
        setRating(value);
      });
    });

    dom.textarea?.addEventListener('input', validateForm);

    dom.sendBtn?.addEventListener('click', sendFeedback);

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

    if (value === 5) {
      dom.textarea.placeholder = "Напишите пару добрых слов (необязательно) 🥰";
    } else {
      dom.textarea.placeholder = "Что мы можем улучшить? (необязательно) ✍️";
    }

    dom.sendBtn.disabled = false;
    dom.errorMsg?.classList.add('hidden');
  }

  function validateForm() {
  }

  function validateForm() {
    if (selectedRating === 0) {
      dom.sendBtn.disabled = true;
      return;
    }

    const text = dom.textarea.value.trim();

    if (selectedRating === 5) {
      dom.sendBtn.disabled = false;
      dom.errorMsg?.classList.add('hidden');
    } else {
      if (text.length >= 10) {
        dom.sendBtn.disabled = false;
        dom.errorMsg?.classList.add('hidden');
      } else {
        dom.sendBtn.disabled = true;
        if (text.length > 0) {
          dom.errorMsg?.classList.remove('hidden');
        }
      }
    }
  }

  async function sendFeedback() {
    dom.sendBtn.disabled = true;
    dom.sendBtn.textContent = "Отправка... ⏳";

    const user = tg?.initDataUnsafe?.user || { id: 'Локальный тест', first_name: 'Разработчик', username: 'test_user' };
    const textReview = dom.textarea.value.trim();

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: selectedRating,
          user: user,
          text: textReview
        })
      });

      if (response.ok) {
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        localStorage.setItem('app_feedback_submitted', 'true');

        dom.sendBtn.style.background = '#22c55e';
        dom.sendBtn.textContent = "Спасибо за отзыв! ❤️";

        setTimeout(() => {
          resetForm();
          if (typeof window.switchScreen === 'function') {
            window.switchScreen('main');
          }
          checkExistingFeedback();
        }, 2000);

      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
      alert('Ошибка отправки. Попробуй еще раз! 🤖');
      dom.sendBtn.disabled = false;
      dom.sendBtn.textContent = "Отправить отзыв";
    }
  }

  function resetForm() {
    selectedRating = 0;
    dom.textarea.value = '';
    dom.stars.forEach(star => star.classList.remove('active'));
    dom.formBlock?.classList.remove('show');
    dom.sendBtn.style.background = '#2563eb';
    dom.sendBtn.textContent = "Отправить отзыв";
    dom.sendBtn.disabled = true;
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

  document.addEventListener('DOMContentLoaded', init);

})();