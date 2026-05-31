(function () {
  'use strict';

  const tg = window.Telegram?.WebApp;
  let activeRoomId = 'kitchen';

  const roomMapping = {
    'hallway': { week: 1, name: 'Прихожая и Коридор' },
    'kitchen': { week: 2, name: 'Кухня' },
    'bathroom': { week: 3, name: 'Ванная и Туалет' },
    'bedroom': { week: 4, name: 'Спальня и Гостиная' },
    'living_room': { week: 4, name: 'Спальня и Гостиная' },
    'balcony': { week: 5, name: 'Балкон и Хобби-зоны (Уютные хвостики месяца)' }
  };

  const dom = {
    roomGroups: document.querySelectorAll('.room-group'),
    roomPaths: document.querySelectorAll('.room-path'),
    roomNameHeader: document.getElementById('selected-room-name'),
    checklistContainer: document.getElementById('checklist-container')
  };

  function init() {
    bindEvents();
    checkAllRooms24HoursTTL();
    updateMapHighlights();
    selectRoom(activeRoomId);
  }

  function bindEvents() {
    dom.roomGroups.forEach(group => {
      group.addEventListener('click', () => {
        const roomId = group.getAttribute('data-room');
        if (roomId) {
          triggerHaptic('light');
          selectRoom(roomId);
        }
      });
    });

    document.getElementById('btn-go-map')?.addEventListener('click', () => {
      checkAllRooms24HoursTTL();
      updateMapHighlights();
      selectRoom(activeRoomId);
    });
  }

  function checkRoomTTL(roomId) {
    const timestampKey = `map_timestamp_${roomId}`;
    const stateKey = `map_state_${roomId}`;
    const savedTimestamp = localStorage.getItem(timestampKey);

    if (!savedTimestamp) return;

    const diffInMs = Date.now() - parseInt(savedTimestamp, 10);
    const hoursPassed = diffInMs / (1000 * 60 * 60);

    if (hoursPassed >= 24) {
      localStorage.removeItem(timestampKey);
      localStorage.removeItem(stateKey);
    }
  }

  function checkAllRooms24HoursTTL() {
    const rooms = ['kitchen', 'bathroom', 'bedroom', 'hallway', 'living_room', 'balcony'];
    rooms.forEach(room => checkRoomTTL(room));
  }

  async function selectRoom(roomId) {
    activeRoomId = roomId;

    dom.roomPaths.forEach(path => path.classList.remove('active-room'));
    const currentPath = document.getElementById(`room-${roomId}`);
    if (currentPath) currentPath.classList.add('active-room');

    const config = roomMapping[roomId];
    if (!config) return;

    dom.roomNameHeader.textContent = `Загрузка задач для: ${config.name}...`;

    try {
      const response = await fetch('/monthTasks.json');
      if (!response.ok) throw new Error('Не удалось загрузить задачи');

      const monthTasks = await response.json();

      const weekData = monthTasks.find(item => item.week === config.week);

      if (!weekData || !weekData.tasks) {
        dom.roomNameHeader.textContent = "Задачи не найдены";
        dom.checklistContainer.innerHTML = `<p style="text-align:center; padding-top:50px; color:#94a3b8;">Нет текущих задач</p>`;
        return;
      }

      dom.roomNameHeader.textContent = `${weekData.emoji} ${weekData.zone}`;
      renderChecklist(roomId, weekData.tasks);

    } catch (error) {
      console.error(error);
      dom.roomNameHeader.textContent = "Ошибка загрузки";
      dom.checklistContainer.innerHTML = `<p style="text-align:center; padding-top:50px; color:#ef4444;">Не удалось загрузить monthTasks.json</p>`;
    }
  }

  function renderChecklist(roomId, tasks) {
    dom.checklistContainer.innerHTML = '';

    const savedState = JSON.parse(localStorage.getItem(`map_state_${roomId}`) || '{}');

    tasks.forEach((taskText, index) => {
      const isChecked = !!savedState[index];

      const taskItem = document.createElement('div');
      taskItem.className = `task-item ${isChecked ? 'checked' : ''}`;
      taskItem.setAttribute('data-index', index);

      taskItem.innerHTML = `
        <input type="checkbox" ${isChecked ? 'checked' : ''}>
        <span class="task-text">${taskText}</span>
      `;

      taskItem.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const checkbox = taskItem.querySelector('input[type="checkbox"]');
          checkbox.checked = !checkbox.checked;
        }
        toggleTask(roomId, index, taskItem, tasks.length);
      });

      dom.checklistContainer.appendChild(taskItem);
    });
  }

  function toggleTask(roomId, taskIndex, taskItemElement, totalTasksCount) {
    const checkbox = taskItemElement.querySelector('input[type="checkbox"]');
    const isChecked = checkbox.checked;

    if (isChecked) {
      taskItemElement.classList.add('checked');
      triggerHaptic('light');
    } else {
      taskItemElement.classList.remove('checked');
      triggerHaptic('medium');
    }

    const stateKey = `map_state_${roomId}`;
    const timestampKey = `map_timestamp_${roomId}`;

    const savedState = JSON.parse(localStorage.getItem(stateKey) || '{}');
    const isFirstCheck = Object.keys(savedState).length === 0 && isChecked;

    if (isChecked) {
      savedState[taskIndex] = true;
    } else {
      delete savedState[taskIndex];
    }

    localStorage.setItem(stateKey, JSON.stringify(savedState));

    if (isFirstCheck) {
      localStorage.setItem(timestampKey, Date.now().toString());
    }

    if (Object.keys(savedState).length === 0) {
      localStorage.removeItem(timestampKey);
    }

    updateMapHighlights(totalTasksCount);

    if (Object.keys(savedState).length === totalTasksCount && totalTasksCount > 0) {
      triggerHaptic('success');
      fireConfetti();
    }
  }

  function updateMapHighlights(currentRoomTotalCount = 0) {
    Object.keys(roomMapping).forEach(roomId => {
      const path = document.getElementById(`room-${roomId}`);
      if (!path) return;

      const savedState = JSON.parse(localStorage.getItem(`map_state_${roomId}`) || '{}');
      const checkedCount = Object.keys(savedState).length;

      path.classList.remove('status-progress', 'status-clean');

      const totalCount = (roomId === activeRoomId && currentRoomTotalCount > 0) ? currentRoomTotalCount : 7;

      if (checkedCount > 0 && checkedCount < totalCount) {
        path.classList.add('status-progress');
      } else if (checkedCount === totalCount) {
        path.classList.add('status-clean');
      }
    });
  }

  function fireConfetti() {
    if (typeof window.confetti !== 'function') return;
    window.confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.75 }
    });
  }

  function triggerHaptic(type) {
    if (!tg?.HapticFeedback) return;
    if (type === 'light') tg.HapticFeedback.impactOccurred('light');
    if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
  }

  document.addEventListener('DOMContentLoaded', init);

})();