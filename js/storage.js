import {
  initDB,
  getById,
  add,
  update,
  getAll,
  exportAllData,
  importAllData,
  clearStore,
} from './db.js';
import { uid } from './utils.js';

const ENTITY_ID = 'trackerState';
const SETTINGS_ID = 'uiPrefs';

const DEFAULT_STATE = {
  profile: { age: '6-7' },
  foods: {
    蔬菜类: ['南瓜', '胡萝卜', '西兰花', '土豆', '红薯', '青菜'],
    水果类: ['苹果', '香蕉', '梨', '牛油果'],
    谷物杂粮: ['大米', '小米', '燕麦'],
    肉蛋鱼: ['鸡肉', '猪肉', '鸡蛋', '鳕鱼'],
  },
  foodStatus: {},
  pending: { test: [], safe: [], custom: [] },
  meals: ['午餐', '午点心'],
  calendar: {},
};

export async function initializeStorage() {
  await initDB();

  const exists = await getById('entities', ENTITY_ID);
  if (!exists) {
    const state = buildInitialState();
    await add('entities', { id: ENTITY_ID, ...state });
  }

  const prefs = await getById('settings', SETTINGS_ID);
  if (!prefs) {
    await add('settings', { id: SETTINGS_ID, darkMode: false, lastFilter: '' });
  }
}

function buildInitialState() {
  const foodStatus = {};
  Object.values(DEFAULT_STATE.foods).flat().forEach((food) => {
    foodStatus[food] = 'neutral';
  });

  return {
    ...DEFAULT_STATE,
    foodStatus,
    pending: {
      test: ['小米', '鸡蛋'],
      safe: ['南瓜'],
      custom: [],
    },
    createdAt: Date.now(),
  };
}

export async function loadState() {
  const state = await getById('entities', ENTITY_ID);
  return state;
}

export async function saveState(state) {
  await update('entities', { ...state, id: ENTITY_ID, updatedAt: Date.now() });
}

export async function getUIPrefs() {
  return (await getById('settings', SETTINGS_ID)) || { id: SETTINGS_ID, darkMode: false, lastFilter: '' };
}

export async function saveUIPrefs(nextPrefs) {
  await update('settings', { id: SETTINGS_ID, ...nextPrefs });
  localStorage.setItem('uiPrefsCache', JSON.stringify(nextPrefs));
}

export async function addReviewRecord(record) {
  return add('records', { ...record, createdAt: Date.now(), clientId: uid('rec') });
}

export async function getReviewRecords() {
  const rows = await getAll('records');
  return rows.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteReviewRecord(id) {
  const { remove } = await import('./db.js');
  await remove('records', id);
}

export async function backupAll() {
  return exportAllData();
}

export async function restoreAll(payload) {
  await importAllData(payload);
}

export async function wipeAllData() {
  await clearStore('entities');
  await clearStore('records');
  await clearStore('settings');
  await initializeStorage();
}
