
window.LFMyPosts = {
  list(items, clientId) { return window.LFCore.sortItems(window.LFCore.getMyItems(items, clientId)); },
  statistics(items, clientId) {
    const own = window.LFCore.getMyItems(items, clientId);
    return { total: own.length, found: own.filter(x => x.type === 'lost' && x.status === 'finished').length, returned: own.filter(x => x.type === 'found' && x.status === 'finished').length };
  }
};

