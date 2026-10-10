
/* 数据存储适配器：Chrome file:// 使用 localStorage；受限时使用本次会话内存。 */
window.LFStore = (function () {
  const KEY = 'fzu-campus-lostfound-v1-items';
  const ID_KEY = 'fzu-campus-lostfound-v1-client';
  let fallback = null;
  let clientFallback = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let persistent = true;
  function safeGet(key) { try { return localStorage.getItem(key); } catch (_) { persistent = false; return null; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); return true; } catch (_) { persistent = false; return false; } }
  function clientId() {
    let value = safeGet(ID_KEY);
    if (!value) { value = clientFallback; safeSet(ID_KEY, value); }
    return value;
  }
  function loadOwn() {
    if (fallback) return [...fallback];
    const raw = safeGet(KEY);
    if (!raw) return [];
    try { const list = JSON.parse(raw); return Array.isArray(list) ? list : []; }
    catch (_) { return []; }
  }
  function saveOwn(items) {
    fallback = [...items];
    // 如果写入受限，保持当前会话可用，但不宣称刷新后持久化。
    return safeSet(KEY, JSON.stringify(items));
  }
  function all() { return [...window.LFDemoData, ...loadOwn()]; }
  function isPersistent() { return persistent; }
  return { clientId, loadOwn, saveOwn, all, isPersistent };
})();

