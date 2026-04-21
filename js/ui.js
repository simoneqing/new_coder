import { AGE_GUIDE, nextStatus } from './utils.js';

export function renderApp(state, records, prefs) {
  document.body.classList.toggle('dark', !!prefs.darkMode);

  renderAgeGuide(state.profile.age);
  renderFoodDatabase(state);
  renderPending(state.pending);
  renderCalendar(state);
  renderRecords(records);
}

function renderAgeGuide(ageKey) {
  const guide = AGE_GUIDE[ageKey] || '';
  const el = document.getElementById('ageGuide');
  if (el) el.textContent = guide;
}

function chipClass(status) {
  if (status === 'safe') return 'chip safe';
  if (status === 'allergy') return 'chip allergy';
  return 'chip';
}

function renderFoodDatabase(state) {
  const wrap = document.getElementById('foodDatabase');
  wrap.innerHTML = Object.entries(state.foods)
    .map(([cat, list]) => {
      const chips = list
        .map((food) => {
          const status = state.foodStatus[food] || 'neutral';
          const label = status === 'safe' ? '安全' : status === 'allergy' ? '过敏' : '未排敏';
          return `<button class="${chipClass(status)}" data-action="cycle-food" data-food="${food}"><span>${food}</span><small>${label}</small></button>`;
        })
        .join('');

      return `<section class="cat"><h3>${cat}</h3><div class="chip-grid">${chips}<button class="chip plus" data-action="add-food" data-category="${cat}">+</button></div></section>`;
    })
    .join('');
}

function renderPending(pending) {
  const groups = [
    ['pendingTest', pending.test],
    ['pendingSafe', pending.safe],
    ['pendingCustom', pending.custom],
  ];

  groups.forEach(([id, list]) => {
    const el = document.getElementById(id);
    el.innerHTML = list.map((name) => `<button class="chip mini" data-action="select-food" data-food="${name}">${name}</button>`).join('');
  });
}

function renderCalendar(state) {
  const table = document.getElementById('calendar');
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const head = `<tr><th>餐次</th>${days.map((d) => `<th>${d}</th>`).join('')}</tr>`;
  const rows = state.meals
    .map((meal) => {
      if (!state.calendar[meal]) state.calendar[meal] = {};
      const cells = days
        .map((day) => {
          const items = state.calendar[meal][day] || [];
          return `<td data-action="fill-cell" data-meal="${meal}" data-day="${day}">${items.join('<br>')}</td>`;
        })
        .join('');
      return `<tr><th>${meal}</th>${cells}</tr>`;
    })
    .join('');

  table.innerHTML = head + rows;
}

function renderRecords(records) {
  const wrap = document.getElementById('recordList');
  if (!records.length) {
    wrap.innerHTML = '<p class="muted">暂无复盘记录</p>';
    return;
  }

  wrap.innerHTML = records
    .map((r) => {
      const date = new Date(r.createdAt).toLocaleDateString('zh-CN');
      return `<div class="record-row"><span>${date}</span><b>${r.food}</b><em class="tag ${r.result}">${r.result === 'safe' ? '安全' : '过敏'}</em><p>${r.note || '(无记录)'}</p><button data-action="delete-record" data-id="${r.id}">删除</button></div>`;
    })
    .join('');
}

export function bindEvents(handlers) {
  const root = document.getElementById('app');

  root.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    handlers.onAction(target.dataset.action, target.dataset, event);
  });

  root.addEventListener('change', (event) => {
    const target = event.target;
    if (target.matches('#ageSelect')) handlers.onAgeChange(target.value);
    if (target.matches('#importInput') && target.files[0]) handlers.onImportFile(target.files[0]);
    if (target.matches('#darkModeToggle')) handlers.onDarkMode(target.checked);
  });

  document.getElementById('addPendingForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    handlers.onAddPending(form.get('bucket'), form.get('foodName'));
    event.currentTarget.reset();
  });

  document.getElementById('reviewForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    handlers.onAddReview({
      food: form.get('food'),
      result: form.get('result'),
      note: form.get('note'),
    });
    event.currentTarget.reset();
  });
}

export { nextStatus };
