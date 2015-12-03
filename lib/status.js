var cluster = require('cluster');

/**
 * A status monitor class
 */
var status = function(environ) {
  this.connectionsMade = 0;
  this.startTime = new Date();
  this.environ = environ;
  this.totalCPUs = require('os').cpus().length;
};

/**
 * Pretty print the elapsed time
 * @param ms
 * @returns {string}
 */
status.prototype.formatElapsedTime = function (ms) {
  ms = ms || 0;
  ms = ms / 1000;
  if (ms <= 60) {
    return Math.round(ms) + " seconds";
  } else {
    ms /= 60;
    if (ms <= 60 * 2) {
      return Math.round(ms) + " minutes";
    } else {
      ms /= 60;
      if (ms <= 24) {
        return Math.round(ms) + " hours";
      } else {
        ms /= 24;
        return Math.round(ms) + " days";
      }
    }
  }
};

/**
 * Get the status page as a string
 */
status.prototype.getStatusPage = function() {
  var res = [];
  res.push("<html><head>");
  res.push("<title>" + this.environ.name + " - Status</title>");
  res.push("</head>");
  res.push("<body>");
  res.push("<h1>" + this.environ.name + " - Status</h1><hr />");
  var inf = {
    "ProductName": this.environ.name,
    "Version": this.environ.version,
    "Worker": cluster.worker.id + '/' + this.totalCPUs + ' CPUs',
    "UpTime": this.formatElapsedTime(new Date() - this.startTime)
  };
  for (var infel in inf) {
    res.push("<p><b>" + infel + "</b>: " + inf[infel] + "</p>");
  }
  res.push("</body></html>");
  return res.join('\n');
};

// Spit it out
module.exports = status;