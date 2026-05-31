(function () {
  'use strict';

  const tg = window.Telegram?.WebApp;
  let activeRoomId = 'kitchen';

  const MONTH_TASKS_DATA = [
    {
      "week": 1,
      "zone": "Прихожая и Коридор",
      "emoji": "🚪",
      "tasks": [
        "Разобрать сезонную обувь и спрятать неактуальные пары",
        "Проверить вешалки и убрать лишнюю верхнюю одежду в шкаф",
        "Протереть зеркало, выключатели и дверные ручки",
        "Разобрать визуальный шум на полке для ключей, чеки и спам",
        "Почистить коврик у двери и протереть пол под ним",
        "Провести ревизию в сумках и рюкзаках, выбросить мусор",
        "Протереть межкомнатные двери и плинтусы от пыли"
      ]
    },
    {
      "week": 2,
      "zone": "Кухня",
      "emoji": "🍳",
      "tasks": [
        "Натереть раковину до блеска и очистить зону вокруг нее",
        "Провести ревизию в холодильнике, выкинув просрочку и соусы",
        "Очистить микроволновку изнутри и протереть чайник",
        "Разобрать один ящик со столовыми приборами или кружками",
        "Проверить сроки годности у круп, специй и макарон",
        "Протереть кухонные фасады в местах захвата руками",
        "Сменить прихватки и отправить кухонные полотенца в стирку"
      ]
    },
    {
      "week": 3,
      "zone": "Ванная и Туалет",
      "emoji": "🧼",
      "tasks": [
        "Очистить краны и смесители от известкового налета",
        "Навести порядок на полочке у зеркала, выкинув пустые тюбики",
        "Протереть унитаз, бачок и кнопку смыва с дезинфектором",
        "Разобрать аптечку или запасы бытовой химии под раковиной",
        "Протереть стиральную машину, очистить лоток и манжету",
        "Постирать коврик для ванной и освежить шторку",
        "Очистить стаканчик для щеток и вентиляционную решетку"
      ]
    },
    {
      "week": 4,
      "zone": "Спальня и Гостиная",
      "emoji": "🛌",
      "tasks": [
        "Расхламить «стул-вешалку» или кресло с вещами",
        "Протереть пыль на телевизоре, мониторах и подоконниках",
        "Навести порядок в одном ящике с комода (носки, белье или декор)",
        "Разобрать журнальный столик или прикроватную тумбочку",
        "Взбить диванные подушки, постирать плед или покрывало",
        "Провести ревизию домашней одежды или украшений в шкатулке",
        "Собрать по комнате и безжалостно выбросить 27 элементов хлама"
      ]
    },
    {
      "week": 5,
      "zone": "Балкон и Хобби-зоны",
      "emoji": "📦",
      "tasks": [
        "Разобрать «горячую точку» на балконе или лоджии",
        "Проверить полки с настольными играми, книгами или наборами",
        "Очистить память телефона или компьютера от скриншотов",
        "Протереть подоконники и полить все комнатные растения",
        "Собрать макулатуру, старые журналы и коробки на выброс",
        "Убрать вещи, которые ждут мелкого ремонта (пуговицы, замки)",
        "Устроить свидание с собой: зажечь свечу и 15 минут посидеть"
      ]
    }
  ];

  const roomMapping = {
    'hallway': { week: 1 },
    'kitchen': { week: 2 },
    'bathroom': { week: 3 },
    'bedroom': { week: 4 },
    'living_room': { week: 4 },
    'balcony': { week: 5 }
  };

  const dom = {
    roomGroups: document.querySelectorAll('.room-group'),
    roomPaths: document.querySelectorAll('.room-path'),
    roomNameHeader: document.getElementById('selected-room-name'),
    checklistContainer: document.getElementById('checklist-container')
  };

  function init() {
    bindEvents();
    checkAllRoomsMonthTTL();
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
      checkAllRoomsMonthTTL();
      updateMapHighlights();
      selectRoom(activeRoomId);
    });
  }

  function checkRoomMonthTTL(roomId) {
    const timestampKey = `map_timestamp_${roomId}`;
    const stateKey = `map_state_${roomId}`;
    const savedTimestamp = localStorage.getItem(timestampKey);

    if (!savedTimestamp) return;

    const savedDate = new Date(parseInt(savedTimestamp, 10));
    const currentDate = new Date();

    if (savedDate.getFullYear() !== currentDate.getFullYear() || savedDate.getMonth() !== currentDate.getMonth()) {
      localStorage.removeItem(timestampKey);
      localStorage.removeItem(stateKey);
    }
  }

  function checkAllRoomsMonthTTL() {
    Object.keys(roomMapping).forEach(room => checkRoomMonthTTL(room));
  }

  function selectRoom(roomId) {
    activeRoomId = roomId;

    dom.roomPaths.forEach(path => path.classList.remove('active-room'));
    const currentPath = document.getElementById(`room-${roomId}`);
    if (currentPath) currentPath.classList.add('active-room');

    const config = roomMapping[roomId];
    if (!config) return;

    const weekData = MONTH_TASKS_DATA.find(item => item.week === config.week);

    if (!weekData) {
      dom.roomNameHeader.textContent = "Задачи не найдены";
      dom.checklistContainer.innerHTML = '';
      return;
    }

    dom.roomNameHeader.textContent = `${weekData.emoji} ${weekData.zone}`;
    renderChecklist(roomId, weekData.tasks);
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

    updateMapHighlights();

    if (Object.keys(savedState).length === totalTasksCount && totalTasksCount > 0) {
      triggerHaptic('success');
      fireConfetti();
    }
  }

  function updateMapHighlights() {
    Object.keys(roomMapping).forEach(roomId => {
      const path = document.getElementById(`room-${roomId}`);
      if (!path) return;

      const config = roomMapping[roomId];
      const weekData = MONTH_TASKS_DATA.find(item => item.week === config.week);

      const totalCount = weekData ? weekData.tasks.length : 7;

      const savedState = JSON.parse(localStorage.getItem(`map_state_${roomId}`) || '{}');
      const checkedCount = Object.keys(savedState).length;

      path.classList.remove('status-progress', 'status-clean');

      if (checkedCount > 0 && checkedCount < totalCount) {
        path.classList.add('status-progress');
      } else if (checkedCount === totalCount && totalCount > 0 && checkedCount > 0) {
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