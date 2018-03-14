function onVisibilityChange(el, callback) {
  var old_visible;
  return function () {
    var visible = dg_pager.isElementInViewport(el);
    if (visible != old_visible) {
      old_visible = visible;
      if (typeof callback == 'function') {
        callback(visible);
      }
    }
  }
}
