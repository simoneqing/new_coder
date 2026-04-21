import {
  initializeStorage,
  loadState,
  saveState,
  getUIPrefs,
  saveUIPrefs,
  addReviewRecord,
  getReviewRecords,
  deleteReviewRecord,
  backupAll,
  restoreAll,
  wipeAllData,
} from './storage.js';
import { bindEvents, renderApp, nextStatus } from './ui.js';
import { downloadJSON, readFileAsJSON } from './utils.js';

const TEMPLATE = `
  <main id="app" class="container">
    <header class="topbar">
      <h1>Baby Food <span>Tracker</span></h1>
      <div class="top-actions">
        <label class="switch"><input id="darkModeToggle" type="checkbox" /> 深色</label>
        <button data-action="export-all">导出数据</button>
        <button data-action="open-import">导入数据</button>
        <button data-action="clear-all" class="danger">清空数据</button>
      </div>
      <input id="importInput" type="file" accept="application/json" hidden />
    </header>

    <section class="card">
      <h2>Food Database</h2>
      <p class="muted">点击食材切换状态：未排敏 → 安全 → 过敏</p>
      <div id="foodDatabase"></div>
      <button data-action="add-category" class="ghost">+ 新增分类</button>
    </section>

    <section class="card">
      <h2>Weekly Planner</h2>
      <div class="row">
        <label>宝宝月龄
          <select id="ageSelect">
            <option value="6-7">6-7 月</option>
            <option value="8-9">8-9 月</option>
            <option value="10-12">10-12 月</option>
          </select>
        </label>
        <p id="ageGuide" class="guide"></p>
      </div>

      <form id="addPendingForm" class="row">
        <select name="bucket">
          <option value="test">本周测试</option>
          <option value="safe">本周搭配</option>
          <option value="custom">自定义</option>
        </select>
        <input name="foodName" placeholder="输入食材" required />
        <button type="submit">加入待选</button>
      </form>

      <div class="pending-grid">
        <div><h4>本周测试</h4><div id="pendingTest"></div></div>
        <div><h4>本周搭配</h4><div id="pendingSafe"></div></div>
        <div><h4>自定义</h4><div id="pendingCustom"></div></div>
      </div>

      <table id="calendar" class="calendar"></table>
    </section>

    <section class="card">
      <h2>Review</h2>
      <form id="reviewForm" class="row">
        <input name="food" placeholder="食材名" required />
        <select name="result">
          <option value="safe">安全</option>
          <option value="allergy">过敏</option>
        </select>
        <input name="note" placeholder="记录备注" />
        <button type="submit">保存复盘</button>
      </form>
      <div id="recordList"></div>
    </section>
  </main>
`;

const appRoot = document.getElementById('app-root');
appRoot.innerHTML = TEMPLATE;

const state = {
  data: null,
  records: [],
  ui: { darkMode: false, lastFilter: '' },
  selectedFood: null,
};

function pickForCell(list) {
  if (state.selectedFood) return state.selectedFood;
  return list[0] || null;
}

async function refresh() {
  state.data = await loadState();
  state.records = await getReviewRecords();
  state.ui = await getUIPrefs();

  renderApp(state.data, state.records, state.ui);
  document.getElementById('ageSelect').value = state.data.profile.age;
  document.getElementById('darkModeToggle').checked = !!state.ui.darkMode;
}

async function onAction(action, dataset) {
  if (action === 'cycle-food') {
    const food = dataset.food;
    state.data.foodStatus[food] = nextStatus(state.data.foodStatus[food] || 'neutral');
    await saveState(state.data);
    return refresh();
  }

  if (action === 'add-food') {
    const name = prompt(`新增 ${dataset.category} 食材`);
    if (!name) return;
    state.data.foods[dataset.category].push(name.trim());
    state.data.foodStatus[name.trim()] = 'neutral';
    await saveState(state.data);
    return refresh();
  }

  if (action === 'add-category') {
    const name = prompt('新增分类名');
    if (!name) return;
    if (!state.data.foods[name]) state.data.foods[name] = [];
    await saveState(state.data);
    return refresh();
  }

  if (action === 'select-food') {
    state.selectedFood = dataset.food;
    return;
  }

  if (action === 'fill-cell') {
    const food = pickForCell([...state.data.pending.test, ...state.data.pending.safe, ...state.data.pending.custom]);
    if (!food) return alert('请先添加待选食材');
    const { meal, day } = dataset;
    if (!state.data.calendar[meal]) state.data.calendar[meal] = {};
    if (!state.data.calendar[meal][day]) state.data.calendar[meal][day] = [];
    if (!state.data.calendar[meal][day].includes(food)) state.data.calendar[meal][day].push(food);
    await saveState(state.data);
    return refresh();
  }

  if (action === 'delete-record') {
    await deleteReviewRecord(Number(dataset.id));
    return refresh();
  }

  if (action === 'export-all') {
    const data = await backupAll();
    return downloadJSON('appLocalDB-backup.json', data);
  }

  if (action === 'open-import') {
    return document.getElementById('importInput').click();
  }

  if (action === 'clear-all') {
    if (!confirm('确认清空所有本地数据？')) return;
    await wipeAllData();
    return refresh();
  }
}

async function onAgeChange(age) {
  state.data.profile.age = age;
  await saveState(state.data);
  refresh();
}

async function onAddPending(bucket, foodName) {
  const food = String(foodName || '').trim();
  if (!food) return;
  if (!state.data.pending[bucket].includes(food)) state.data.pending[bucket].push(food);
  await saveState(state.data);
  refresh();
}

async function onAddReview(payload) {
  if (!payload.food) return;

  await addReviewRecord(payload);
  state.data.foodStatus[payload.food] = payload.result;
  await saveState(state.data);
  refresh();
}

async function onImportFile(file) {
  try {
    const data = await readFileAsJSON(file);
    await restoreAll(data);
    await refresh();
    alert('导入完成');
  } catch {
    alert('导入失败：JSON 文件格式不正确');
  }
}

async function onDarkMode(checked) {
  await saveUIPrefs({ ...state.ui, darkMode: checked });
  refresh();
}

async function bootstrap() {
  await initializeStorage();
  bindEvents({
    onAction,
    onAgeChange,
    onAddPending,
    onAddReview,
    onImportFile,
    onDarkMode,
  });
  await refresh();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

bootstrap();
