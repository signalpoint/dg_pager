dg_pager.load = function(id) {
  return dg._pagers[id] ? dg._pagers[id] : null;
};

dg_pager.clearAll = function() {
  for (var id in dg._pagers) {
    if (!dg._pagers.hasOwnProperty(id)) { continue; }
    var pager = dg._pagers[id];

    // Remove events from infinite scroll pagers.
    if (pager.isInfinite()) { pager.removeEvents(); }
  }
};

dg_pager.onclickHandler = function(id, which) {
  var pager = dg_pager.load(id);
  var currentPage = pager.getPage();
  pager.setPage(which == 'next' ? currentPage + 1 : currentPage - 1);
  pager.render().then(function() { dg.qs('#' + pager.id()).scrollIntoView(); });
};

dg_pager.infiniteScrollEventListeners = function() {
  return ['DOMContentLoaded', 'load', 'scroll', 'resize'];
};

dg_pager.infiniteScrollEvents = function() {
  return ['onDOMContentLoaded', 'onload', 'onscroll', 'onresize'];
};

/**
 * @see https://stackoverflow.com/a/7557433/763010
 * @param el
 * @returns {boolean}
 */
dg_pager.isElementInViewport = function(el) {
  if (!el) { return; }
  var rect = el.getBoundingClientRect();

  var height = (window.innerHeight || document.documentElement.clientHeight);
  var width = (window.innerWidth || document.documentElement.clientWidth);

  var inViewPort = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= height &&
      rect.right <= width
  );

  //if (inViewPort) {
  //  console.log('inViewPort', rect);
  //  console.log(height, width);
  //}

  return inViewPort;
};
