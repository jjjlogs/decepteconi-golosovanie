(function () {
  const root = document.getElementById('categoriesRoot');
  const tabsWrap = document.getElementById('catTabs');
  const toastEl = document.getElementById('toast');

  let state = { categories: [], myVotes: {} };

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
          card.querySelector('.btn-vote').addEventListener('click', () => vote(cat.id, { optionId: opt.id }));
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
              vote(cat.id, { customText: text });
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

  async function loadCategories() {
    const res = await fetch('/api/categories');
    const data = await res.json();
    state.categories = data.categories;
    state.myVotes = data.myVotes;
    renderTabs();
    renderCategories();
    setActiveTabOnScroll();
  }

  async function vote(categoryId, payload) {
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Не удалось проголосовать');
        return;
      }
      state.myVotes = data.myVotes;
      renderTabs();
      renderCategories();
      showToast('Голос учтён');
    } catch (e) {
      showToast('Ошибка сети. Попробуй ещё раз.');
    }
  }

  async function unvote(categoryId) {
    try {
      const res = await fetch('/api/unvote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Не удалось отменить голос');
        return;
      }
      state.myVotes = data.myVotes;
      renderTabs();
      renderCategories();
      showToast('Выбор отменён');
    } catch (e) {
      showToast('Ошибка сети. Попробуй ещё раз.');
    }
  }

  loadCategories();
})();
