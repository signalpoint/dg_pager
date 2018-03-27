/**
 * We declare the onVisibilityChange event handler here to accept an element and the developer's callback function to
 * handle the event on their element.
 * @param el
 * @param callback
 * @returns {Function}
 */
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
