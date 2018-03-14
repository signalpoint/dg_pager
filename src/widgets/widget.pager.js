dg.theme_pager = function(variables) {
  var id = variables._attributes.id;
  var pager = dg_pager.load('id');
  if (!pager) { pager = new Pager(id, variables); }
  setTimeout(function() { pager.render(); }, 1);
  return pager.html();
};
