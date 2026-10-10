/**
 * 业务界面控制器（无框架、无需服务器）：七个视图复用 index.html，满足 Chrome file:// 打开。
 * 发布 / 搜索 / 详情 / 联系方式 / 更新状态形成完整闭环。
 */
(function () {
  'use strict';
  const core = window.LFCore;
  const store = window.LFStore;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const esc = core.escapeHTML;
  const clientId = store.clientId();
  const state = {
    page: 'home', stack: [], homeType: 'all', homeCategory: 'all', homeActiveOnly: false,
    resultsCategory: 'all', resultsActiveOnly: false, keyword: '', detailId: null,
    photo: '', toastTimer: null, pendingConfirmId: null
  };
  const icon = {
    photo: '<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="9" r="2"/><path d="m4 18 5-5 4 4 3-3 4 4"/></svg>'
  };

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    clearTimeout(state.toastTimer);
    el.classList.add('show');
    state.toastTimer = setTimeout(() => el.classList.remove('show'), 2700);
  }

  function go(page, { back = false } = {}) {
    if (!$('#page-' + page)) return;
    if (!back && state.page !== page) state.stack.push(state.page);
    state.page = page;
    $$('.page').forEach(view => { view.hidden = view.id !== 'page-' + page; });
    if (page === 'home') renderHome();
    if (page === 'results') renderResults();
    if (page === 'detail') renderDetail();
    if (page === 'my') renderMy();
    if (page === 'search') { $('#search-keyword').value = state.keyword; }
    if (page === 'publish') resetPublishErrors();
    window.scrollTo(0, 0);
  }
  function back() {
    let previous = state.stack.pop() || 'home';
    if (previous === state.page) previous = 'home';
    go(previous, { back: true });
  }

  function makeCard(item) {
    const type = item.type === 'found' ? 'found' : 'lost';
    const status = core.statusLabel(item);
    const doneClass = item.status === 'finished' ? ' is-finished' : '';
    return `<button class="item-card" type="button" data-open-item="${esc(item.id)}" aria-label="查看${esc(item.name)}详情">
      <div class="card-top"><span class="item-type ${type}">${core.TYPE_LABEL[type]}</span><span class="item-name">${esc(item.name)}</span></div>
      <div class="item-meta"><span class="card-location">地点：${esc(item.location)}</span><span>日期：${esc(item.date)}</span><span class="item-status${doneClass}">状态：${status}</span></div>
      <span class="card-chevron" aria-hidden="true">›</span>${item.isDemo ? '<span class="demo-label">演示</span>' : ''}
    </button>`;
  }

  function empty(title, description, action = '', dest = '') {
    return `<div class="empty-state"><div class="empty-illustration" aria-hidden="true">⌕</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${action ? `<button type="button" class="outline-btn" data-nav="${esc(dest)}">${esc(action)}</button>` : ''}</div>`;
  }

  function renderHome() {
    const all = store.all();
    const filtered = core.sortItems(core.filterItems(all, {
      type: state.homeType, category: state.homeCategory, activeOnly: state.homeActiveOnly
    }));
    $('#home-count').textContent = `${filtered.length} 条`;
    $('#home-list').innerHTML = filtered.length ? filtered.map(makeCard).join('') : empty('暂时没有符合条件的信息', '请调整分类或状态筛选条件，或者发布新信息。', '去发布信息', 'publish');
    $$('[data-home-type]').forEach(el => {
      const active = el.dataset.homeType === state.homeType;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-pressed', String(active));
    });
    $('#home-category').value = state.homeCategory;
    $('#home-active-only').checked = state.homeActiveOnly;
  }

  function submitSearch(rawKeyword) {
    state.keyword = core.clean(rawKeyword);
    if (!state.keyword) { toast('请先输入要搜索的物品关键词'); return; }
    state.resultsCategory = 'all';
    state.resultsActiveOnly = false;
    $('#search-keyword').value = state.keyword;
    go('results');
  }
  function renderResults() {
    const all = store.all();
    const filtered = window.LFSearch.find(all, state.keyword, { category: state.resultsCategory, activeOnly: state.resultsActiveOnly });
    $('#results-keyword').textContent = state.keyword;
    $('#results-count').textContent = `找到 ${filtered.length} 条与“${state.keyword}”相关的信息`;
    $('#results-category').value = state.resultsCategory;
    $('#results-active-only').checked = state.resultsActiveOnly;
    $('#results-list').innerHTML = filtered.length ? filtered.map(makeCard).join('') : empty('暂时没有找到相关物品', `没有与“${state.keyword}”匹配的记录，试试其他关键词或取消筛选。`, '重新搜索', 'search');
  }

  function openItem(id) {
    state.detailId = id;
    go('detail');
  }
  function renderDetail() {
    const item = window.LFDetail.byId(store.all(), state.detailId);
    if (!item) {
      $('#detail-root').innerHTML = empty('信息不存在', '这条信息可能已失效，请返回首页查看其他线索。', '返回首页', 'home');
      return;
    }
    const kind = item.type === 'lost' ? '遗失' : '拾取';
    const type = item.type === 'lost' ? 'lost' : 'found';
    const ended = item.status === 'finished';
    const canFinish = window.LFDetail.canFinish(item, clientId);
    const safePhoto = typeof item.photo === 'string' && /^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(item.photo) ? item.photo : '';
    $('#detail-root').innerHTML = `
      <div class="detail-title-line"><h2>${esc(item.name)}</h2><span class="item-type ${type}">${core.TYPE_LABEL[type]}</span><span class="status-pill${ended ? ' is-finished' : ''}">${core.statusLabel(item)}</span></div>
      <div class="item-image-placeholder">${safePhoto ? `<img class="detail-image" src="${safePhoto}" alt="${esc(item.name)}的物品照片">` : `${icon.photo}<span>暂无物品图片</span>`}</div>
      <dl class="detail-info-card">
        <div class="detail-info-row"><dt>${kind}地点</dt><dd>${esc(item.location)}</dd></div>
        <div class="detail-info-row"><dt>${kind}时间</dt><dd>${esc(item.date)} ${esc(item.time || '')}</dd></div>
        <div class="detail-info-row"><dt>物品类别</dt><dd>${esc(item.category)}</dd></div>
        <div class="detail-info-row"><dt>物品描述</dt><dd>${esc(item.description || '发布者暂未填写详细描述')}</dd></div>
        <div class="detail-info-row"><dt>联系方式</dt><dd><div class="contact-row"><span class="contact-text" id="contact-value">${esc(item.contact)}</span><button class="copy-btn" type="button" data-copy-contact="${esc(item.id)}">复制</button></div></dd></div>
      </dl>
      <div class="detail-publisher"><h3>发布者信息</h3><p>发布者：${item.isDemo ? '演示信息' : item.ownerId === clientId ? '我自己（本机发布）' : '校园同学'}　·　类别：${core.TYPE_LABEL[type]}信息</p></div>
      ${item.isDemo ? '<div class="detail-notice">这是课程演示记录，并非真实失物。联系方式仅为占位文本，请发布自己的信息体验完整流程。</div>' : ''}
      ${canFinish ? `<div class="detail-owner-actions"><button class="primary-btn full-btn" type="button" data-finish="${esc(item.id)}">${type === 'lost' ? '物品已找到 · 完成寻物' : '物品已归还 · 完成招领'}</button></div>` : ''}
      ${ended ? '<div class="detail-status-info">✓ 这条信息已经处理完成，感谢校园互助！</div>' : ''}`;
  }

  function renderMy() {
    const list = window.LFMyPosts.list(store.all(), clientId);
    const stats = window.LFMyPosts.statistics(store.all(), clientId);
    $('#stat-total').textContent = stats.total;
    $('#stat-found').textContent = stats.found;
    $('#stat-returned').textContent = stats.returned;
    $('#my-list').innerHTML = list.length ? list.map(item => {
      const type = item.type === 'lost' ? 'lost' : 'found';
      const finish = item.status === 'finished';
      return `<article class="my-card"><div class="my-card-head"><span class="item-type ${type}">${core.TYPE_LABEL[type]}</span><strong>${esc(item.name)}</strong><span class="status-pill${finish ? ' is-finished' : ''}">${core.statusLabel(item)}</span></div>
      <div class="my-card-meta"><span>${esc(item.location)}</span><span>${esc(item.category)}</span></div><div class="my-card-date">日期：${esc(item.date)} ${esc(item.time || '')}</div>
      <div class="my-card-actions"><button type="button" class="outline-btn" data-open-item="${esc(item.id)}">查看详情</button><button type="button" class="${finish ? 'outline-btn finished-button' : 'primary-btn'}" ${finish ? 'disabled' : `data-finish="${esc(item.id)}"`}>${finish ? '✓ 已完成' : type === 'lost' ? '标记已找到' : '标记已归还'}</button></div></article>`;
    }).join('') : empty('还没有发布过信息', '点击下方“发布”按钮，发布第一条寻物或招领信息。', '发布第一条信息', 'publish');
  }

  function resetPublishErrors() {
    $$('[data-error]').forEach(el => el.textContent = '');
    $$('#publish-form .input').forEach(el => el.classList.remove('is-invalid'));
  }
  function fillErrors(errors) {
    resetPublishErrors();
    Object.entries(errors).forEach(([field, message]) => {
      const hint = $(`[data-error="${field}"]`);
      if (hint) hint.textContent = message;
      const input = $(`#publish-${field}`);
      if (input) input.classList.add('is-invalid');
    });
    const first = Object.keys(errors)[0];
    const target = $(`#publish-${first}`) || $(`[data-error="${first}"]`);
    if (target && target.focus) target.focus();
    if (target && target.scrollIntoView) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function publish(e) {
    e.preventDefault();
    const form = $('#publish-form');
    const values = Object.fromEntries(new FormData(form).entries());
    values.photo = state.photo;
    const created = core.createItem(values, clientId);
    if (!created.ok) { fillErrors(created.errors); toast('请检查标红的必填项目'); return; }
    const own = store.loadOwn();
    const saved = store.saveOwn([created.item, ...own]);
    form.reset();
    state.photo = '';
    updatePhotoPreview();
    updateTypePicker();
    $('#publish-date').value = localToday();
    if (!saved) $('#storage-warning').hidden = false;
    go('success');
  }

  function updateTypePicker() {
    const type = $('#publish-form input[name="type"]:checked').value;
    $$('.type-option').forEach(el => el.classList.toggle('is-selected', el.querySelector('input').checked));
    $('#type-help').textContent = type === 'lost' ? '寻找丢失的物品' : '发布捡到的物品，等待失主认领';
    $('#publish-location-label').innerHTML = `${type === 'lost' ? '遗失地点' : '拾取地点'} <span class="required-mark">*</span>`;
  }

  function updatePhotoPreview() {
    $('#photo-preview').innerHTML = state.photo ? `<img src="${state.photo}" alt="待发布的物品照片预览">` : icon.photo;
    $('#remove-photo').hidden = !state.photo;
  }
  function imageUpload(file) {
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) { $('[data-error="photo"]').textContent = '仅支持 JPG、PNG、WebP 图片'; return; }
    if (file.size > 3 * 1024 * 1024) { $('[data-error="photo"]').textContent = '图片不能超过 3MB'; return; }
    $('[data-error="photo"]').textContent = '';
    const reader = new FileReader();
    reader.onerror = () => { $('[data-error="photo"]').textContent = '读取图片失败，请重试'; };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => { $('[data-error="photo"]').textContent = '图片格式无法解析'; };
      img.onload = () => {
        try {
          const longest = Math.max(img.width, img.height);
          const scale = Math.min(1, 900 / longest);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          state.photo = canvas.toDataURL('image/jpeg', .74);
          if (state.photo.length > 1_200_000) { state.photo = ''; throw Error('图片压缩后仍过大，请选择另一张图片'); }
          updatePhotoPreview();
          toast('照片已添加');
        } catch (error) { $('[data-error="photo"]').textContent = error.message || '图片处理失败'; }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function askFinish(id) {
    const item = window.LFDetail.byId(store.all(), id);
    if (!window.LFDetail.canFinish(item, clientId)) { toast('这条信息不能由当前用户修改'); return; }
    state.pendingConfirmId = id;
    $('#confirm-heading').textContent = item.type === 'lost' ? '确认已找到物品？' : '确认物品已归还？';
    $('#confirm-description').textContent = `“${item.name}”将标记为「${item.type === 'lost' ? '已找到' : '已归还'}」，并同步显示在首页、详情和搜索结果中。`;
    $('#confirm-overlay').hidden = false;
    $('#confirm-accept').focus();
  }
  function cancelConfirm() { state.pendingConfirmId = null; $('#confirm-overlay').hidden = true; }
  function acceptConfirm() {
    const id = state.pendingConfirmId;
    cancelConfirm();
    if (!id) return;
    const result = core.finishItem(store.loadOwn(), id, clientId);
    if (!result.ok) { toast(result.message); return; }
    const ok = store.saveOwn(result.items);
    if (!ok) $('#storage-warning').hidden = false;
    if (state.page === 'my') renderMy();
    if (state.page === 'detail') renderDetail();
    toast('状态已更新，感谢你的分享！');
  }

  async function copyContact(itemId) {
    const item = window.LFDetail.byId(store.all(), itemId);
    if (!item) { toast('未找到联系方式'); return; }
    const content = String(item.contact || '');
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw Error('unavailable');
      await navigator.clipboard.writeText(content);
      toast('联系方式已复制');
      return;
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = content;
      area.style.position = 'fixed'; area.style.left = '-9999px';
      document.body.appendChild(area);
      area.focus(); area.select();
      let success = false;
      try { success = document.execCommand('copy'); } catch (_) { success = false; }
      area.remove();
      toast(success ? '联系方式已复制' : '无法自动复制，请手动选择联系方式');
    }
  }

  function localToday() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  }
  function setup() {
    const categories = core.CATEGORIES.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    $('#home-category').insertAdjacentHTML('beforeend', categories);
    $('#results-category').insertAdjacentHTML('beforeend', categories);
    $('#publish-category').insertAdjacentHTML('beforeend', categories);
    $('#publish-date').value = localToday();
    if (!store.isPersistent()) $('#storage-warning').hidden = false;
    $('#publish-form').addEventListener('submit', publish);
    $('#search-form').addEventListener('submit', e => { e.preventDefault(); submitSearch($('#search-keyword').value); });
    $('#home-category').addEventListener('change', e => { state.homeCategory = e.target.value; renderHome(); });
    $('#home-active-only').addEventListener('change', e => { state.homeActiveOnly = e.target.checked; renderHome(); });
    $('#results-category').addEventListener('change', e => { state.resultsCategory = e.target.value; renderResults(); });
    $('#results-active-only').addEventListener('change', e => { state.resultsActiveOnly = e.target.checked; renderResults(); });
    $$('input[name="type"]').forEach(input => input.addEventListener('change', updateTypePicker));
    $('#publish-photo').addEventListener('change', e => { imageUpload(e.target.files[0]); });
    $('#remove-photo').addEventListener('click', () => { state.photo = ''; $('#publish-photo').value = ''; updatePhotoPreview(); });
    $('#confirm-cancel').addEventListener('click', cancelConfirm);
    $('#confirm-accept').addEventListener('click', acceptConfirm);
    $('#confirm-overlay').addEventListener('click', e => { if (e.target.id === 'confirm-overlay') cancelConfirm(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#confirm-overlay').hidden) cancelConfirm(); });
    document.addEventListener('click', e => {
      const nav = e.target.closest('[data-nav]');
      if (nav) { go(nav.dataset.nav); return; }
      if (e.target.closest('[data-back]')) { back(); return; }
      const type = e.target.closest('[data-home-type]');
      if (type) { state.homeType = type.dataset.homeType; renderHome(); return; }
      const hot = e.target.closest('[data-hot]');
      if (hot) { submitSearch(hot.dataset.hot); return; }
      const item = e.target.closest('[data-open-item]');
      if (item) { openItem(item.dataset.openItem); return; }
      const finish = e.target.closest('[data-finish]');
      if (finish) { askFinish(finish.dataset.finish); return; }
      const copy = e.target.closest('[data-copy-contact]');
      if (copy) { copyContact(copy.dataset.copyContact); }
    });
    updateTypePicker();
    updatePhotoPreview();
    renderHome();
  }
  setup();
})();
