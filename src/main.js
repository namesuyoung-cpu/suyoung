const STORAGE_KEY = 'simple-todo-items';

const form = document.querySelector('#todoForm');
const input = document.querySelector('#todoInput');
const list = document.querySelector('#todoList');
const taskCount = document.querySelector('#taskCount');
const focusText = document.querySelector('#focusText');
const installButton = document.querySelector('#installButton');

let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.error('Service worker registration failed:', error);
    });
  });
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  if (installButton) {
    installButton.hidden = false;
  }
});

installButton?.addEventListener('click', async () => {
  if (!deferredPrompt) {
    return;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    console.log('앱 설치가 승인되었습니다.');
  } else {
    console.log('앱 설치가 거절되었습니다.');
  }

  deferredPrompt = null;
  installButton.hidden = true;
});

const focusItems = [
  '개발 작업 진행',
  '디자인 정리',
  '리서치 마무리',
  '기획 점검',
  '오늘의 발전',
];

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const readTasks = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const saveTasks = (tasks) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
};

let tasks = readTasks();

if (!tasks.length) {
  tasks = [
    { id: Date.now(), text: '오늘의 핵심 목표를 정리해보세요', done: false },
    { id: Date.now() + 1, text: '작업 마무리를 체크하세요', done: true },
  ];
  saveTasks(tasks);
}

const updateFocus = () => {
  const remaining = tasks.filter((task) => !task.done).length;
  const label = remaining > 0 ? focusItems[remaining % focusItems.length] : '모두 완료';
  focusText.textContent = label;
};

const updateCount = () => {
  const remaining = tasks.filter((task) => !task.done).length;
  taskCount.textContent = `${remaining}개 남음`;
};

const render = () => {
  list.innerHTML = '';

  if (!tasks.length) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty';
    emptyItem.textContent = '할 일이 없습니다';
    list.appendChild(emptyItem);
    updateCount();
    updateFocus();
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `todo-item ${task.done ? 'done' : ''}`;

    item.innerHTML = `
      <label class="todo-check">
        <input type="checkbox" ${task.done ? 'checked' : ''} />
        <span>${escapeHtml(task.text)}</span>
      </label>
      <button type="button" class="delete-btn" aria-label="${escapeHtml(task.text)} 삭제">
        삭제
      </button>
    `;

    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', () => {
      task.done = checkbox.checked;
      saveTasks(tasks);
      render();
    });

    const deleteButton = item.querySelector('.delete-btn');
    deleteButton.addEventListener('click', () => {
      tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
      saveTasks(tasks);
      render();
    });

    list.appendChild(item);
  });

  updateCount();
  updateFocus();
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    input.focus();
    return;
  }

  tasks.unshift({
    id: Date.now(),
    text,
    done: false,
  });

  saveTasks(tasks);
  input.value = '';
  render();
  input.focus();
});

render();
