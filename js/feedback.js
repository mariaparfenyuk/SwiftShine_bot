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

    // Собираем данные в объект (проверь, чтобы названия полей совпадали с тем, что ждет бэкенд!)
    const feedbackData = {
      rating: selectedRating, // убедись, что глобальная переменнаяselectedRating доступна в файле
      user: user,
      text: textReview
    };

    try {
      // Чистый await запрос к бэкенду
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true' // Пробиваем заглушку ngrok 🚀
        },
        body: JSON.stringify(feedbackData)
      });

      // Если сервер вернул ошибку (например, 400 или 500)
      if (!response.ok) {
        throw new Error('Ошибка сервера');
      }

      // Если всё успешно, парсим JSON (если бэкенд что-то возвращает)
      const data = await response.json();

      // Логика успешного выполнения
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

    } catch (error) {
      console.error('Ошибка при отправке:', error);
      if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
      alert('Ошибка отправки. Попробуй еще раз! 🤖');
      dom.sendBtn.disabled = false;
      dom.sendBtn.textContent = "Отправить отзыв";
    }
  }
})();