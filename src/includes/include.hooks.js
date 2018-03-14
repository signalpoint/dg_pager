/**
 * Implements hook_pre_process_route_change
 */
function dg_pager_pre_process_route_change(newPath, oldPath) {

  // Pre process initial route change upon application startup...
  if (typeof oldPath === 'undefined') {

  }
  else {

    // Handle all other route changes...

    dg_pager.clearAll();

  }

}