var ControlForm = function(el) {
  this.frm = $(el);
  this.els = this.frm.find("input, select, textarea");
  var vals = {},
    passing = true,
    baddies = [];

  this.els.each(function(idx, el) {
    vals[el.id] = $.trim(el.value);
    if (el.type == "number") {
      vals[el.id] = parseFloat(el.value);
    }
    if (el.getAttribute('required') == 'yes') {
      if (vals[el.id].toString().length === 0) {
        passing = false;
        baddies.push((el.getAttribute('aria-describedby') ? $("#" + el.getAttribute('aria-describedby')).html() : el.id));
      }
    }
  });
  if (passing) {
    currentTest = vals;
    $("#messageZone").addClass('hidden');
    Display('progressform');
    $.ajax({
      type: "POST",
      url: '/begin',
      data: vals,
      success: function(obj) {
        if (!obj.success) {
          $("#messagetext").html(obj.msg);
          $("#messageZone").removeClass('hidden');
          Display("controlform");
        } else {

        }
      }
    });
  } else {
    $("#messagetext").html("Some required fields are missing or invalid: " + baddies.join(', '));
    $("#messageZone").removeClass('hidden');
  }
  this.vals = vals;
};
