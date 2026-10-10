/** 可单独测试的业务逻辑：不依赖 DOM、网络或浏览器存储。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LFCore = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const CATEGORIES = Object.freeze(['校园卡', '钥匙', '电子产品', '雨伞', '水杯', '书籍', '证件', '衣物', '其他']);
  const TYPE_LABEL = Object.freeze({ lost: '寻物', found: '招领' });
  const STATUS_LABEL = Object.freeze({ lost: { active: '寻找中', finished: '已找到' }, found: { active: '待认领', finished: '已归还' } });
  const clean = value => String(value == null ? '' : value).trim();

  function validateDraft(draft, now = new Date()) {
    const errors = {};
    const type = clean(draft.type);
    if (!Object.hasOwn(TYPE_LABEL, type)) errors.type = '请选择信息类型';
    const name = clean(draft.name);
    if (!name) errors.name = '请填写物品名称';
    else if (name.length > 40) errors.name = '物品名称不能超过40个字符';
    if (!CATEGORIES.includes(clean(draft.category))) errors.category = '请选择物品分类';
    const location = clean(draft.location);
    if (!location) errors.location = '请填写遗失或拾取地点';
    else if (location.length > 80) errors.location = '地点不能超过80个字符';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(clean(draft.date))) errors.date = '请选择有效日期';
    if (!/^\d{2}:\d{2}$/.test(clean(draft.time))) errors.time = '请选择有效时间';
    if (!errors.date && !errors.time) {
      const parsed = new Date(`${draft.date}T${draft.time}:00`);
      if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== Number(draft.date.slice(0, 4)) || parsed.getMonth() + 1 !== Number(draft.date.slice(5, 7)) || parsed.getDate() !== Number(draft.date.slice(8, 10))) {
        errors.date = '日期无效';
      } else if (parsed.getTime() > now.getTime()) {
        errors.date = '发生时间不能晚于当前时间';
      }
    }
    const contact = clean(draft.contact);
    if (!contact) errors.contact = '请留下可用的联系方式';
    else if (contact.length > 100) errors.contact = '联系方式不能超过100个字符';
    if (clean(draft.description).length > 500) errors.description = '物品描述不能超过500字';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  function createItem(draft, ownerId, now = new Date(), id = '') {
    const check = validateDraft(draft, now);
    if (!check.valid) return { ok: false, errors: check.errors };
    if (!clean(ownerId)) return { ok: false, errors: { ownerId: '无法确定当前发布者' } };
    return {
      ok: true,
      item: {
        id: id || `item-${now.getTime()}-${Math.random().toString(36).slice(2, 9)}`,
        ownerId: clean(ownerId),
        type: clean(draft.type), name: clean(draft.name), category: clean(draft.category),
        location: clean(draft.location), date: clean(draft.date), time: clean(draft.time),
        description: clean(draft.description), contact: clean(draft.contact),
        photo: clean(draft.photo), status: 'active', createdAt: now.getTime(), isDemo: false
      }
    };
  }

  function searchItems(items, keyword) {
    const q = clean(keyword).toLocaleLowerCase();
    if (!q) return [...items];
    return items.filter(item => [item.name, item.category, item.location, item.description]
      .some(value => clean(value).toLocaleLowerCase().includes(q)));
  }

  function filterItems(items, { type = 'all', category = 'all', activeOnly = false } = {}) {
    return items.filter(item => (type === 'all' || item.type === type)
      && (category === 'all' || item.category === category)
      && (!activeOnly || item.status === 'active'));
  }

  function sortItems(items) {
    return [...items].sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
  }

  function getMyItems(items, ownerId) { return items.filter(item => !item.isDemo && item.ownerId === ownerId); }

  function finishItem(items, itemId, ownerId) {
    const idx = items.findIndex(item => item.id === itemId);
    if (idx < 0) return { ok: false, reason: 'not_found', message: '该信息不存在' };
    const item = items[idx];
    if (item.isDemo || item.ownerId !== ownerId) return { ok: false, reason: 'forbidden', message: '只能修改自己发布的信息' };
    if (item.status === 'finished') return { ok: false, reason: 'already_finished', message: '这条信息已经完成' };
    if (!Object.hasOwn(TYPE_LABEL, item.type)) return { ok: false, reason: 'invalid_type', message: '信息类型无效' };
    return { ok: true, items: items.map((entry, i) => i === idx ? { ...entry, status: 'finished' } : entry) };
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  function statusLabel(item) { return (STATUS_LABEL[item.type] || {})[item.status] || '未知状态'; }
  return { CATEGORIES, TYPE_LABEL, STATUS_LABEL, clean, validateDraft, createItem, searchItems, filterItems, sortItems, getMyItems, finishItem, escapeHTML, statusLabel };
});
