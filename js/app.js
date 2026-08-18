(function () {
  // ============================================================
  // НАСТРОЙКА: вставь сюда URL твоего Google Apps Script Web App
  // (получишь его после деплоя скрипта — см. README.md)
  // ============================================================
  const GOOGLE_SCRIPT_URL = 'ВСТАВЬ_СЮДА_URL_СКРИПТА';

  const root = document.getElementById('categoriesRoot');
  const tabsWrap = document.getElementById('catTabs');
  const toastEl = document.getElementById('toast');

  const STORAGE_KEY = 'decepticon_awards_votes_v1';
  const VOTER_KEY = 'decepticon_awards_voter_id_v1';

  let state = { categories: NOMINEES_DATA, myVotes: loadMyVotes() };

  // ---------- localStorage ----------
  function loadMyVotes() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveMyVotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.myVotes));
  }
  function getVoterId() {
    let id = localStorage.getItem(VOTER_KEY);
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(VOTER_KEY, id);
    }
    return id;
  }

  // ---------- Отправка голоса в Google Таблицу ----------
  function sendToGoogleSheet(payload) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.indexOf('ВСТАВЬ_СЮДА') !== -1) {
      console.warn('GOOGLE_SCRIPT_URL не настроен — голос сохранён только локально.');
      return;
    }
    // Отправляем как text/plain, чтобы не было CORS-preflight (Apps Script его не поддерживает).
    fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch((e) => {
      console.error('Не удалось отправить голос в таблицу:', e);
    });
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  function renderTabs() {
    tabsWrap.innerHTML = '';
    state.categories.forEach((cat) => {
      const tab = document.createElement('a');
      tab.href = '#cat-' + cat.id;
      tab.className = 'cat-tab';
      tab.dataset.cat = cat.id;
      tab.innerHTML = cat.title + (state.myVotes[cat.id] ? '<span class="done-dot"></span>' : '');
      tabsWrap.appendChild(tab);
    });
  }

  function voteLabel(vote) {
    if (!vote) return '';
    return vote.type === 'custom' ? vote.text : vote.label;
  }

  function renderCategories() {
    root.innerHTML = '';
    state.categories.forEach((cat) => {
      const section = document.createElement('section');
      section.className = 'category-section';
      section.id = 'cat-' + cat.id;

      const myVote = state.myVotes[cat.id];

      section.innerHTML = `
        <div class="cat-header">
          <h2 class="cat-title">${cat.title}</h2>
          ${cat.subtitle ? `<p class="cat-subtitle">${cat.subtitle}</p>` : ''}
        </div>
        ${
          myVote
            ? `<div class="cat-selected-banner">
                 <span class="cat-selected-text">Твой выбор: <b>${escapeHtml(voteLabel(myVote))}</b></span>
                 <button class="btn-cancel" type="button">Отменить выбор</button>
               </div>`
            : ''
        }
        <div class="nominee-grid"></div>
      `;

      if (myVote) {
        section.querySelector('.btn-cancel').addEventListener('click', () => unvote(cat.id));
      }

      const grid = section.querySelector('.nominee-grid');

      cat.options.forEach((opt) => {
        const isMine = myVote && myVote.type === 'option' && myVote.optionId === opt.id;
        const locked = !!myVote && !isMine;

        const card = document.createElement('div');
        card.className = 'nominee-card' + (isMine ? ' voted-for' : '') + (locked ? ' is-locked' : '');
        card.innerHTML = `
          <div class="nominee-name">${escapeHtml(opt.label)}</div>
          <button class="btn-vote" ${myVote ? 'disabled' : ''}>
            ${isMine ? 'Твой выбор' : 'Голосовать'}
          </button>
        `;
        if (!myVote) {
          card.querySelector('.btn-vote').addEventListener('click', () => vote(cat, { optionId: opt.id, label: opt.label }));
        }
        grid.appendChild(card);
      });

      if (cat.allowCustom) {
        const isCustomMine = myVote && myVote.type === 'custom';
        const locked = !!myVote && !isCustomMine;

        const card = document.createElement('div');
        card.className =
          'nominee-card custom-card' + (isCustomMine ? ' voted-for' : '') + (locked ? ' is-locked' : '');

        if (isCustomMine) {
          card.innerHTML = `
            <div class="nominee-name">Свой вариант</div>
            <button class="btn-vote" disabled>Твой выбор</button>
          `;
        } else {
          card.innerHTML = `
            <div class="nominee-name">Свой вариант</div>
            <div class="custom-input-row">
              <input type="text" class="custom-input" placeholder="Впиши свой ответ…" maxlength="200" ${myVote ? 'disabled' : ''} />
              <button class="btn-vote" ${myVote ? 'disabled' : ''}>Отправить</button>
            </div>
          `;
          if (!myVote) {
            const input = card.querySelector('.custom-input');
            const btn = card.querySelector('.btn-vote');
            const submit = () => {
              const text = input.value.trim();
              if (!text) {
                input.focus();
                return;
              }
              vote(cat, { customText: text });
            };
            btn.addEventListener('click', submit);
            input.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') submit();
            });
          }
        }
        grid.appendChild(card);
      }

      root.appendChild(section);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setActiveTabOnScroll() {
    const sections = state.categories.map((c) => document.getElementById('cat-' + c.id));
    const tabs = [...tabsWrap.querySelectorAll('.cat-tab')];
    function onScroll() {
      let currentId = null;
      const scrollPos = window.scrollY + 180;
      sections.forEach((sec) => {
        if (sec && sec.offsetTop <= scrollPos) currentId = sec.id.replace('cat-', '');
      });
      tabs.forEach((t) => t.classList.toggle('active', t.dataset.cat === currentId));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function vote(cat, payload) {
    if (state.myVotes[cat.id]) {
      showToast('Вы уже голосовали в этой номинации');
      return;
    }

    let myVote;
    if (payload.customText) {
      const text = String(payload.customText).trim().slice(0, 200);
      if (!text) return;
      myVote = { type: 'custom', text };
    } else {
      myVote = { type: 'option', optionId: payload.optionId, label: payload.label };
    }

    state.myVotes[cat.id] = myVote;
    saveMyVotes();

    sendToGoogleSheet({
      voterId: getVoterId(),
      categoryId: cat.id,
      categoryTitle: cat.title,
      type: myVote.type,
      optionId: myVote.optionId || '',
      answer: voteLabel(myVote),
      action: 'vote',
      ts: new Date().toISOString(),
    });

    renderTabs();
    renderCategories();
    showToast('Голос учтён');
  }

  function unvote(categoryId) {
    const cat = state.categories.find((c) => c.id === categoryId);
    const existing = state.myVotes[categoryId];
    if (!existing) return;

    delete state.myVotes[categoryId];
    saveMyVotes();

    sendToGoogleSheet({
      voterId: getVoterId(),
      categoryId: categoryId,
      categoryTitle: cat ? cat.title : '',
      type: existing.type,
      optionId: existing.optionId || '',
      answer: voteLabel(existing),
      action: 'unvote',
      ts: new Date().toISOString(),
    });

    renderTabs();
    renderCategories();
    showToast('Выбор отменён');
  }

  function init() {
    renderTabs();
    renderCategories();
    setActiveTabOnScroll();
  }

  init();
})();
