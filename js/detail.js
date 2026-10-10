
window.LFDetail = {
  byId(items, id) { return items.find(item => item.id === id) || null; },
  canFinish(item, clientId) { return !!item && !item.isDemo && item.ownerId === clientId && item.status !== 'finished'; }
};

