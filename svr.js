/**
 * Global requires.
 * (Note, NewRelic should be 1st in this list.)
 */
var pjson = require('./lib/environ'),
  status = require('./lib/status'),
  express = require('express'),
  cluster = require('cluster'),
  bodyParser = require('body-parser'),
  timeout = require('connect-timeout');

// Set the time zone
process.env.TZ = pjson.setts.timeZone;

// Will hold the definitions source
var defSrc;

// Code to run if we're in the master process
if (cluster.isMaster) {

  // Count the machine's CPUs
  var cpuCount = require('os').cpus().length;

  // Tell the world
  console.log("Starting " + pjson.name + " " + pjson.version + " on " + cpuCount + " CPUs - Connection timeout set to " + pjson.setts.timeout + "..");

  // Fork the server
  for (var i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

// Code to run if we're in a worker process
} else {

  /**
   * Set up connection pool, recorder, and express server
   */
  var app = express(),
    serverStartTime = new Date(),
    timeoutProps = {
      respond: false
    },
    statusHandler = new status(pjson);

  /**
   * Set a size limit
   */
  app.use(bodyParser.json({limit: '500mb'}));

  /**
   * Set the port to use the AWS port or 3000
   */
  app.set('port', process.env.PORT || 3000);

  /**
   * XHR headers
   */
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  /**
   * Assets
   */
  app.use(express.static('dist'));

  /**
   * Root
   */
  app.get('/',
    timeout(pjson.setts.timeout, timeoutProps),
    function (req, res, next) {
      req.on('timeout', function () {
        res.send("Error");
      });
      res.redirect('/index.html');
    });

  /**
   * Status page (same as root)
   */
  app.get('/status',
    timeout(pjson.setts.timeout, timeoutProps),
    function (req, res, next) {
      req.on('timeout', function () {
        res.send("Error");
      });
      res.send(statusHandler.getStatusPage());
    });

  /**
   * Cross domain xml (flash)
   */
  app.get('/crossdomain.xml',
    function (req, res, next) {
      res.send("<?xml version=\"1.0\"?>\n<!DOCTYPE cross-domain-policy SYSTEM \"http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd\">\n<cross-domain-policy>\n<allow-access-from domain=\"*\" secure=\"false\"/>\n</cross-domain-policy>");
    });

  /**
   * Start up the server
   */
  app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
  });
}


