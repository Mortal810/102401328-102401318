window.LFSearch = {
  find(items, keyword, filters = {}) {
    return window.LFCore.sortItems(window.LFCore.filterItems(window.LFCore.searchItems(items, keyword), filters));
  }
};
