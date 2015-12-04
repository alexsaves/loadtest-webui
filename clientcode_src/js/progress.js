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