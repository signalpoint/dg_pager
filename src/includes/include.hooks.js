/**
 * Implements hook_pre_process_route_change
 */
function dg_pager_pre_process_route_change(newPath, oldPath) {
  if (typeof oldPath !== 'undefined') {
    // @TODO maybe we need to call this when it's implemented?
    dg_pager.clearAll();
  }
}
