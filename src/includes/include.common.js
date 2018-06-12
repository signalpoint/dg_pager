dg_pager.load = function(id) {
  return dg._pagers[id] ? dg._pagers[id] : null;
};

dg_pager.clearAll = function() {
  for (var id in dg._pagers) {
    if (!dg._pagers.hasOwnProperty(id)) { continue; }
    var pager = dg._pagers[id];
    //console.log(pager);

    // Disconnect the first and last intersection observers, if any.
    if (pager._firstObserver) {
      //console.log('disconnecting ' + pager.id() + ' first');
      pager._firstObserver.disconnect();
    }
    if (pager._lastObserver) {
      //console.log('disconnecting ' + pager.id() + ' last');
      pager._lastObserver.disconnect();
    }
  }
};

dg_pager.onclickHandler = function(id, which) {
  var pager = dg_pager.load(id);
  var currentPage = pager.getPage();
  pager.setPage(which == 'next' ? currentPage + 1 : currentPage - 1);
  pager.render().then(function() { dg.qs('#' + pager.id()).scrollIntoView(); });
};
