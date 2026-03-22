const APP_TEMPLATE = `
  <div class="page">
    <header class="topbar">
      <div class="brand">
        <h1>Baby Food <span>Tracker</span></h1>
        <p>辅食排敏小工具</p>
      </div>
      <div class="top-actions">
        <button class="ghost-btn" id="uploadBtn">☁ 上传云端</button>
        <button class="ghost-btn" id="downloadBtn">🗂️ 下载同步</button>
      </div>
      <input id="importInput" type="file" accept="application/json" hidden />
    </header>

    <section class="section" id="databaseSection">
      <h2>Food Database</h2>
      <div class="subtitle">点击食物方块标记状态：未排敏(灰) -> 安全食物(绿) -> 过敏食物(红)</div>
      <div class="inline-right"><button class="small-ghost" id="addCategoryBtn">+ 新增食物分类</button></div>
      <div id="databaseWrap"></div>
    </section>

    <section class="section" id="plannerSection">
      <h2>Weekly Planner</h2>
      <div class="subtitle">定制本周的排敏计划</div>

      <div class="weekly-grid">
        <div class="planner-top">
          <div>
            <div class="field-title">宝宝月龄</div>
            <select id="ageSelect">
              <option value="7">7月龄 (1-2次/天)</option>
              <option value="8">8月龄 (2次/天)</option>
              <option value="9">9月龄 (2次/天)</option>
              <option value="10">10-12月龄 (2-3次/天)</option>
            </select>
          </div>
          <div class="recommend">
            <div class="recommend-title" id="recommendTitle">💡 建议：泥糊状，1~2次</div>
            <div class="rec-list" id="recommendList"></div>
          </div>
        </div>

        <div class="pickers">
          <div>
            <div class="field-title">本周测试 (新食物)</div>
            <input id="testInput" type="text" placeholder="点击选择或搜索..." list="allFoods" />
          </div>
          <div>
            <div class="field-title">本周搭配 (安全食物)</div>
            <input id="safeInput" type="text" placeholder="点击选择或搜索..." list="safeFoods" />
          </div>
          <div>
            <div class="field-title">自定义添加</div>
            <input id="customInput" type="text" placeholder="如：益生菌" />
          </div>
          <button class="mini-btn" id="addPendingBtn">+</button>
        </div>
      </div>

      <div class="pending">
        <div class="pending-head">
          <h3>待选食材</h3>
          <div>
            <span class="muted" style="margin-right:10px;">选择食材卡片填入网格表</span>
            <button class="small-ghost" id="clearPendingBtn">🗑 清空待选</button>
          </div>
        </div>
        <div class="tag-line">
          <div class="label">本周测试 (新食物)</div>
          <div class="chips" id="pendingTest"></div>
        </div>
        <div class="tag-line">
          <div class="label">本周搭配 (安全食物)</div>
          <div class="chips" id="pendingSafe"></div>
        </div>
        <div class="tag-line">
          <div class="label">自定义添加</div>
          <div class="chips" id="pendingCustom"></div>
        </div>
      </div>

      <div class="board-head">
        <button class="small-ghost" id="mealManageBtn">⚙ 管理餐次</button>
        <button class="small-ghost" id="resetPlanBtn">🔄 重置规划</button>
        <button class="small-ghost" id="exportWeekBtn">🖨 导出本周</button>
      </div>

      <div class="board">
        <table class="calendar" id="calendar"></table>
      </div>
    </section>

    <section class="section" id="reviewSection">
      <h2>Review</h2>
      <div class="subtitle">复盘上周排敏结果，自动同步至第一模块</div>
      <div class="review-list" id="reviewList"></div>
      <div class="line"></div>
      <div class="archive-title">存档</div>
      <div id="archiveList"></div>
    </section>
  </div>

  <datalist id="allFoods"></datalist>
  <datalist id="safeFoods"></datalist>
`;

if (!document.getElementById('databaseWrap')) {
  const root = document.getElementById('app-root');
  if (root) {
    root.outerHTML = APP_TEMPLATE;
  } else {
    document.body.innerHTML = APP_TEMPLATE;
  }
}

const KEY = 'baby-food-tracker-v2';
    const DAYS = [
      { key: 'Mon', cn: '周一' }, { key: 'Tue', cn: '周二' }, { key: 'Wed', cn: '周三' },
      { key: 'Thu', cn: '周四' }, { key: 'Fri', cn: '周五' }, { key: 'Sat', cn: '周六' }, { key: 'Sun', cn: '周日' }
    ];

    const AGE_GUIDE = {
      '7': {
        title: '💡 建议：泥糊状，1~2次',
        items: [
          ['谷物', '米粉20g/天；尝试粥10g米+100ml水 (10倍粥1:10)'],
          ['蔬菜', '菜末25-50g/天，可考虑：丝瓜、冬瓜、番茄、娃娃菜、玉米等'],
          ['肉类', '肉末、鱼末、肝末25g/天，逐渐增加，可考虑：猪肝、鸡肉'],
          ['蛋类', '先不尝试'],
          ['水果', '每天大约10-15g，可考虑：苹果、香蕉、梨、猕猴桃、火龙果']
        ]
      },
      '8': {
        title: '💡 建议：泥末状，2次',
        items: [
          ['谷物', '软烂米饭、面条，逐步增加颗粒感'],
          ['蔬菜', '每日50g左右，尝试颜色不同蔬菜'],
          ['肉类', '肉泥逐渐增加到30g，尝试鱼虾'],
          ['蛋类', '可尝试蛋黄，观察3天'],
          ['水果', '每日15-20g，尽量原味不加糖']
        ]
      },
      '9': {
        title: '💡 建议：碎末状，2次',
        items: [
          ['谷物', '粥饭交替，面食可切碎'],
          ['蔬菜', '每日50-80g，增加叶菜比例'],
          ['肉类', '每日30g+，可混合搭配'],
          ['蛋类', '可尝试全蛋，留意过敏反应'],
          ['水果', '每日20g，搭配安全食物']
        ]
      },
      '10': {
        title: '💡 建议：软固体，2~3次',
        items: [
          ['谷物', '接近家庭饮食，注意软烂'],
          ['蔬菜', '每日80g以上，均衡搭配'],
          ['肉类', '每日40g左右，鱼禽畜轮换'],
          ['蛋类', '蛋类可常规食用，注意观察'],
          ['水果', '每日20-30g，避免果汁替代']
        ]
      }
    };

    const DEFAULT_DB = {
      '蔬菜类': ['菠菜', '生菜', '芹菜', '南瓜', '山药', '油菜', '油麦菜', '苋菜', '红薯', '茄子', '小白菜', '包菜', '土豆', '紫薯', '丝瓜', '大白菜', '紫甘蓝', '胡萝卜', '芋头', '黄瓜', '卷心菜', '西兰花', '白萝卜', '西红柿', '冬瓜', '娃娃菜', '花菜', '玉米', '西葫芦', '莲藕', '莴笋', '荷兰豆', '芦笋', '蚕豆', '秋葵', '豆腐', '四季豆', '甜椒', '豌豆', '紫菜', '毛豆', '洋葱', '青菜'],
      '水果类': ['苹果', '香蕉', '梨', '牛油果', '蓝莓', '木瓜', '橙子', '西梅', '车厘子', '椰子', '葡萄', '桃子', '哈密瓜', '草莓', '奇异果', '柑橘', '柚子', '火龙果'],
      '谷物杂粮': ['大米', '小米', '紫米', '黑米', '薏米', '小麦', '燕麦', '藜麦', '芝麻', '红豆', '绿豆'],
      '肉蛋鱼': ['鸡蛋', '猪肉', '牛肉', '鸡肉', '羊肉', '鸭肉', '猪肝', '鹅肝'],
      '鱼虾类': ['鳕鱼', '三文鱼', '龙利鱼', '鲈鱼', '黄花鱼', '鲳鱼', '武昌鱼', '罗非鱼', '虾'],
      '菌菇类': ['香菇', '平菇', '杏鲍菇', '口蘑'],
      '坚果类': ['红枣', '核桃', '花生', '杏仁', '腰果', '亚麻籽'],
      '乳品类': ['牛奶', '乳酪']
    };

    let state = {
      db: {},
      pending: { test: [], safe: [], custom: [] },
      meals: ['午餐', '午点心'],
      calendar: {},
      reviewDrafts: {},
      archive: []
    };

    const dbWrap = document.getElementById('databaseWrap');
    const ageSelect = document.getElementById('ageSelect');
    const recommendTitle = document.getElementById('recommendTitle');
    const recommendList = document.getElementById('recommendList');
    const testInput = document.getElementById('testInput');
    const safeInput = document.getElementById('safeInput');
    const customInput = document.getElementById('customInput');
    const pendingTest = document.getElementById('pendingTest');
    const pendingSafe = document.getElementById('pendingSafe');
    const pendingCustom = document.getElementById('pendingCustom');
    const allFoods = document.getElementById('allFoods');
    const safeFoods = document.getElementById('safeFoods');
    const calendar = document.getElementById('calendar');
    const reviewList = document.getElementById('reviewList');
    const archiveList = document.getElementById('archiveList');

    let selectedPendingFood = null;

    function todayString() {
      const d = new Date();
      return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    }

    function load() {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        state = { ...state, ...JSON.parse(raw) };
      } else {
        Object.keys(DEFAULT_DB).forEach(cat => {
          state.db[cat] = DEFAULT_DB[cat].map(name => ({ name, status: 'neutral' }));
        });
      }
      if (!Object.keys(state.db).length) {
        Object.keys(DEFAULT_DB).forEach(cat => {
          state.db[cat] = DEFAULT_DB[cat].map(name => ({ name, status: 'neutral' }));
        });
      }
    }

    function save() {
      localStorage.setItem(KEY, JSON.stringify(state));
      buildDatalists();
    }

    function statusLabel(status) {
      if (status === 'safe') return '低敏';
      if (status === 'allergy') return '高敏';
      return '低敏';
    }

    function cycleStatus(foodObj) {
      foodObj.status = foodObj.status === 'neutral' ? 'safe' : foodObj.status === 'safe' ? 'allergy' : 'neutral';
      save();
      renderAll();
    }

    function renderDatabase() {
      dbWrap.innerHTML = '';
      Object.entries(state.db).forEach(([category, foods]) => {
        const row = document.createElement('div');
        row.innerHTML = `
          <div class="line"></div>
          <div class="cat-row">
            <div class="cat-name">${category}</div>
            <div class="chips"></div>
          </div>`;
        const chips = row.querySelector('.chips');

        foods.forEach(food => {
          const btn = document.createElement('button');
          btn.className = `chip ${food.status === 'neutral' ? '' : food.status}`;
          btn.innerHTML = `<span class="chip-name">${food.name}</span><span class="chip-state">${statusLabel(food.status)}</span>`;
          btn.onclick = () => cycleStatus(food);
          chips.appendChild(btn);
        });

        const plus = document.createElement('button');
        plus.className = 'chip plus';
        plus.textContent = '+';
        plus.onclick = () => {
          const name = prompt(`新增 ${category} 食物名称`);
          if (!name) return;
          state.db[category].push({ name: name.trim(), status: 'neutral' });
          save();
          renderAll();
        };
        chips.appendChild(plus);
        dbWrap.appendChild(row);
      });
    }

    function buildDatalists() {
      const foodNames = [];
      const safeNames = [];
      Object.values(state.db).forEach(foods => {
        foods.forEach(food => {
          foodNames.push(food.name);
          if (food.status === 'safe') safeNames.push(food.name);
        });
      });
      allFoods.innerHTML = foodNames.map(n => `<option value="${n}"></option>`).join('');
      safeFoods.innerHTML = safeNames.map(n => `<option value="${n}"></option>`).join('');
    }

    function renderGuide() {
      const guide = AGE_GUIDE[ageSelect.value];
      recommendTitle.textContent = guide.title;
      recommendList.innerHTML = guide.items.map(([k, v]) => `<div class="rec-item"><b>${k}</b>${v}</div>`).join('');
    }

    function addPending(group, value) {
      const text = value.trim();
      if (!text) return;
      if (!state.pending[group].includes(text)) state.pending[group].push(text);
      save();
      renderPending();
    }

    function renderPendingGroup(el, group) {
      el.innerHTML = '';
      state.pending[group].forEach(name => {
        const btn = document.createElement('button');
        btn.className = `chip ${selectedPendingFood === name ? 'safe' : ''}`;
        btn.innerHTML = `<span class="chip-name">${name}</span><span class="chip-state">点击填入</span>`;
        btn.onclick = () => {
          selectedPendingFood = selectedPendingFood === name ? null : name;
          renderPending();
        };
        el.appendChild(btn);
      });
    }

    function renderPending() {
      renderPendingGroup(pendingTest, 'test');
      renderPendingGroup(pendingSafe, 'safe');
      renderPendingGroup(pendingCustom, 'custom');
      renderReview();
    }

    function initCalendarIfNeed() {
      state.meals.forEach(meal => {
        if (!state.calendar[meal]) state.calendar[meal] = {};
        DAYS.forEach(day => {
          if (!Array.isArray(state.calendar[meal][day.key])) state.calendar[meal][day.key] = [];
        });
      });
    }

    function renderCalendar() {
      initCalendarIfNeed();
      const header = `<tr><th>Time</th>${DAYS.map(d => `<th>${d.key}<small>${d.cn}</small></th>`).join('')}</tr>`;
      const rows = state.meals.map(meal => {
        const tds = DAYS.map(d => {
          const items = state.calendar[meal][d.key];
          return `<td class="cell" data-meal="${meal}" data-day="${d.key}">${items.join('<br>')}</td>`;
        }).join('');
        return `<tr><td class="row-title">${meal}</td>${tds}</tr>`;
      }).join('');
      calendar.innerHTML = header + rows;

      calendar.querySelectorAll('.cell').forEach(cell => {
        cell.onclick = () => {
          if (!selectedPendingFood) {
            alert('请先在“待选食材”中点击一个食材');
            return;
          }
          const meal = cell.dataset.meal;
          const day = cell.dataset.day;
          const arr = state.calendar[meal][day];
          if (!arr.includes(selectedPendingFood)) arr.push(selectedPendingFood);
          save();
          renderCalendar();
        };
      });
    }

    function setDbStatus(foodName, status) {
      Object.values(state.db).forEach(foods => {
        foods.forEach(food => {
          if (food.name === foodName) food.status = status;
        });
      });
    }

    function renderReview() {
      const merged = [...state.pending.test, ...state.pending.safe, ...state.pending.custom];
      const uniq = [...new Set(merged)];
      reviewList.innerHTML = uniq.map(food => `
        <div class="item">
          <div class="food-name">${food}</div>
          <input type="text" data-note-food="${food}" placeholder="排敏记录 (如：无异常、起疹子...)" value="${state.reviewDrafts[food] || ''}" />
          <div class="action-btns">
            <button class="state-btn safe" data-act="safe" data-food="${food}">安全</button>
            <button class="state-btn allergy" data-act="allergy" data-food="${food}">过敏</button>
            <button class="state-btn reset" data-act="reset" data-food="${food}">重置</button>
          </div>
        </div>
      `).join('');

      reviewList.querySelectorAll('input[data-note-food]').forEach(input => {
        input.oninput = () => {
          state.reviewDrafts[input.dataset.noteFood] = input.value;
          save();
        };
      });

      reviewList.querySelectorAll('button[data-act]').forEach(btn => {
        btn.onclick = () => applyReview(btn.dataset.food, btn.dataset.act);
      });
    }

    function applyReview(food, act) {
      const status = act === 'safe' ? 'safe' : act === 'allergy' ? 'allergy' : 'neutral';
      setDbStatus(food, status);
      state.archive.unshift({
        date: todayString(),
        food,
        status: act,
        note: state.reviewDrafts[food] || '(无记录)'
      });
      state.archive = state.archive.slice(0, 60);
      save();
      renderAll();
    }

    function renderArchive() {
      archiveList.innerHTML = state.archive.map((item, idx) => `
        <div class="archive-item">
          <div class="muted">${item.date}</div>
          <div><b>${item.food}</b></div>
          <div class="status ${item.status}">${item.status === 'safe' ? '安全' : item.status === 'allergy' ? '过敏' : '重置'}</div>
          <div>${item.note}</div>
          <div class="archive-actions">
            <button class="icon-btn" data-edit="${idx}">✎</button>
            <button class="icon-btn" data-del="${idx}">×</button>
          </div>
        </div>
      `).join('');

      archiveList.querySelectorAll('button[data-del]').forEach(btn => {
        btn.onclick = () => {
          state.archive.splice(Number(btn.dataset.del), 1);
          save();
          renderArchive();
        };
      });

      archiveList.querySelectorAll('button[data-edit]').forEach(btn => {
        btn.onclick = () => {
          const idx = Number(btn.dataset.edit);
          const next = prompt('编辑记录备注', state.archive[idx].note);
          if (next === null) return;
          state.archive[idx].note = next;
          save();
          renderArchive();
        };
      });
    }

    function renderAll() {
      buildDatalists();
      renderDatabase();
      renderGuide();
      renderPending();
      renderCalendar();
      renderArchive();
    }

    document.getElementById('addCategoryBtn').onclick = () => {
      const name = prompt('输入新分类名称');
      if (!name) return;
      if (state.db[name]) {
        alert('该分类已存在');
        return;
      }
      state.db[name] = [];
      save();
      renderDatabase();
    };

    document.getElementById('addPendingBtn').onclick = () => {
      addPending('test', testInput.value);
      addPending('safe', safeInput.value);
      addPending('custom', customInput.value);
      testInput.value = '';
      safeInput.value = '';
      customInput.value = '';
    };

    document.getElementById('clearPendingBtn').onclick = () => {
      state.pending = { test: [], safe: [], custom: [] };
      selectedPendingFood = null;
      save();
      renderAll();
    };

    document.getElementById('mealManageBtn').onclick = () => {
      const input = prompt('请输入餐次，逗号分隔', state.meals.join(','));
      if (!input) return;
      state.meals = input.split(',').map(s => s.trim()).filter(Boolean).slice(0, 4);
      save();
      renderCalendar();
    };

    document.getElementById('resetPlanBtn').onclick = () => {
      if (!confirm('重置本周网格规划？')) return;
      state.calendar = {};
      initCalendarIfNeed();
      save();
      renderCalendar();
    };

    document.getElementById('exportWeekBtn').onclick = () => {
      const data = {
        pending: state.pending,
        meals: state.meals,
        calendar: state.calendar,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'weekly-plan.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };

    document.getElementById('uploadBtn').onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'baby-food-tracker-cloud-backup.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };

    document.getElementById('downloadBtn').onclick = () => {
      document.getElementById('importInput').click();
    };

    document.getElementById('importInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          state = { ...state, ...data };
          save();
          renderAll();
          alert('同步完成');
        } catch {
          alert('文件解析失败，请确认是 JSON 备份文件');
        }
      };
      reader.readAsText(file);
    });

    ageSelect.addEventListener('change', renderGuide);

    load();
    renderAll();
