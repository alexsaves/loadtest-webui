function serializeFormToMemory(el) {
  var els = $(el).find("input, select, textarea");
  els.each(function(idx, el) {
    el = $(el);
    localStorage.setItem(el.attr('id'), el.val());
  });
}

function restoreFormToMemory(el) {
  var els = $(el).find("input, select, textarea");
  els.each(function(idx, el) {
    el = $(el);
    var oldval = localStorage.getItem(el.attr('id'));
    if (oldval) {
      el.val(oldval);
    }
  });
}