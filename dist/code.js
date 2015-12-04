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
/**
 * Display
 * @param zone
 * @constructor
 */
var Display = function(zone) {
  $(".zonearea").each(function(idx, el) {
    if (el.id == zone) {
      $(el).removeClass('hidden');
    } else {
      $(el).addClass('hidden');
    }
  });
};

$(document).ready(function() {

  /**
   * Submit button
   */
  $("#starttestbutton").click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    var cform = new ControlForm($("#controlfrm")[0]);
  });

  /**
   * Prevent form submit
   */
  $("#controlfrm").on("submit", function(event) {
    event.preventDefault();
    e.stopPropagation();
    var cform = new ControlForm(this);
  });

  /**
   * Start over button
   */
  $("#startoverbutton, #cancelbutton").click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    $.ajax({
      type: "POST",
      url: '/startover',
      success: function(dmsg) {

      }
    });
  });

  // Fire up the status checker
  var checker = new statusChecker();

  // Fire up the progressor
  var prog = new progressor();
});
/**
 * Tracks progress
 */
var progressor = function() {
  var ctx = this;
  this._progTimer = setInterval(function() {
    ctx.update();
  }, 500);
};

/**
 * Update
 */
progressor.prototype.update = function() {
  if (currentTest.results && currentTest.results.testResults) {
    var totalSecs = parseInt(currentTest.results.testInfo.secs);
    var actualSecs = currentTest.results.testResults.totalTimeSeconds;
    var tr = currentTest.results.testResults;
    this.setProg(actualSecs / totalSecs);
    var str = [];
    str.push("Requests: " + tr.totalRequests);
    str.push("Errors: " + tr.totalErrors);
    str.push("Avg latency: " + (Math.round(tr.meanLatencyMs / 100) / 10) + "s");
    str.push("Max latency: " + (Math.round(tr.maxLatencyMs / 100) / 10) + "s");
    $("#currentResults").html(str.join(', '));


    var turl = currentTest.results.testInfo.url;
    if (turl.length > 100) {
      turl = turl.substr(0, 100) + "...";
    }

    var rph = Math.round((tr.totalRequests / actualSecs) * (60 * 60));

    var finalTable = [];
    finalTable.push("<table class=\"table table-condensed\"><tr><th width=\"30%\">Property</th><th>Result</th></tr>");
    finalTable.push("<tr class='info'><td>URL</td><td>" + turl + "</td></tr>");
    finalTable.push("<tr class='success'><td>Requests</td><td>" + numeral(tr.totalRequests).format('0,0') + "</td></tr>");
    finalTable.push("<tr class=\"danger\"><td>Errors</td><td>" + numeral(tr.totalErrors).format('0,0') + "</td></tr>");
    finalTable.push("<tr class='info'><td>Est. Requests per hour</td><td>" + numeral(rph).format('0,0') + " requests</td></tr>");
    finalTable.push("<tr><td>Test Duration</td><td>" + numeral(actualSecs).format('0,0') + "s</td></tr>");
    finalTable.push("<tr><td>Avg response latency</td><td>" + (Math.round(tr.meanLatencyMs / 10) / 100) + "s</td></tr>");
    finalTable.push("<tr><td>Max response latency</td><td>" + (Math.round(tr.maxLatencyMs / 10) / 100) + "s</td></tr>");
    finalTable.push("</table>");
    $("#testResults").html(finalTable.join(''));

  } else {
    this.setProg(0);
  }
};

/**
 * Set the progress
 * @param prog
 */
progressor.prototype.setProg = function(prog) {
  prog = Math.max(0, Math.min(prog, 1));
  $("#proggy").css({
    width: (prog * 100) + '%'
  });
};
var currentTest = {};

var statusChecker = function() {
  this.status = '';
  this.checking = false;
  var ctx = this;
  var docheck = function() {
    if (!ctx.checking) {
      ctx.checking = true;
      $.ajax({
        type: "GET",
        url: '/jobstatus',
        success: function(dmsg) {
          if (dmsg.status != ctx.status) {
            ctx.status = dmsg.status;
            Display(dmsg.zone);
          }
          currentTest.results = dmsg;
          ctx.checking = false;
          $("#ver").html(dmsg.name + ' ' + dmsg.ver);
        }
      });
    }
  };
  this.checkTimer = setInterval(docheck, 2000);
  docheck();
};
