/**
 * Global requires.
 * (Note, NewRelic should be 1st in this list.)
 */
var pjson = require('./lib/environ'),
  status = require('./lib/status'),
  teststate = require('./lib/teststate'),
  express = require('express'),
  cluster = require('cluster'),
  bodyParser = require('body-parser'),
  timeout = require('connect-timeout'),
  url = require('url');

// Set the time zone
process.env.TZ = pjson.setts.timeZone;

// Will hold the definitions source
var defSrc;

// Code to run if we're in the master process
if (cluster.isMaster) {

  // Count the machine's CPUs
  var cpuCount = require('os').cpus().length;

  // The loadtest
  var loadtest = require('loadtest'),
    latesttest = null,
    testinfo = {};

  // Set up the state
  var thestate = new teststate();

  // Tell the world
  console.log("Starting " + pjson.name + " " + pjson.version + " on " + cpuCount + " CPUs - Connection timeout set to " + pjson.setts.timeout + "..");

  // Fork the server
  var masterStatus = {
    status: 'idle',
    zone: 'controlform'
  };
  var workers = [];
  for (var i = 0; i < cpuCount; i += 1) {
    var worker = cluster.fork();
    workers.push(worker);
    // Receive messages from this worker and handle them in the master process.
    worker.on('message', function (msgobj) {
      //console.log("Recieved loadtest instructions from worker: ", msgobj);
      if (msgobj.command == 'begin') {
        var rps = parseInt(msgobj.rps),
          secs = parseInt(msgobj.secs);
        var targ = url.parse(msgobj.url);
        //console.log("Targeting ", targ);

        testinfo = msgobj;

        function statusCallback(latency, result) {

          masterStatus.testResults = latency;
          masterStatus.testInfo = testinfo;

          //console.log('Current latency %j, result %j', latency, result);
        }

        var options = {
          url: msgobj.url,
          requestsPerSecond: rps,
          maxSeconds: secs,
          statusCallback: statusCallback
        };

        masterStatus.status = 'loadtesting';
        masterStatus.zone = 'progressform';

        //console.log("Starting test with options ", options);

        latesttest = loadtest.loadTest(options, function (error) {
          if (error) {
            return console.error('Got an error: %s', error);
          }
          //console.log('Tests run successfully');
          masterStatus.status = 'complete';
          masterStatus.zone = 'testreportform';
          latesttest = null;
        });

      } else if (msgobj.command == 'reset') {
        if (latesttest) {
          latesttest.stop();
          latesttest = null;
        }

        masterStatus.status = 'idle';
        masterStatus.zone = 'controlform';
        if (masterStatus.testResults) {
          delete masterStatus.testResults;
        }
      }
    });

    // Continually update the message
    setInterval(function () {
      for (var i = 0; i < workers.length; i++) {
        workers[i].send(masterStatus);
      }
    }, 1000);
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
    statusHandler = new status(pjson),
    masterstatus = {
      lastMsg: {
        status: "initializing",
        zone: "initializingarea"
      }
    };

  // Receive messages from the master process.
  process.on('message', function (msg) {
    masterstatus.lastMsg = msg;
  });

  /**
   * Set a size limit
   */
  app.use(bodyParser.json({limit: '500mb'}));

  /**
   * Accept url encoded
   */
  app.use(bodyParser.urlencoded({extended: false}));

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
   * Get job status
   */
  app.get('/jobstatus',
    timeout(pjson.setts.timeout, timeoutProps),
    function (req, res, next) {
      req.on('timeout', function () {
        res.send("Error");
      });
      res.contentType('application/json');
      masterstatus.lastMsg.ver = pjson.version;
      masterstatus.lastMsg.name = pjson.name;
      res.send(JSON.stringify(masterstatus.lastMsg));
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
   * Cancel test
   */
  app.post('/startover',
    timeout(pjson.setts.timeout, timeoutProps),
    function (req, res, next) {
      req.on('timeout', function () {
        res.send(JSON.stringify({msg: "Timeout"}));
      });

      res.contentType('application/json');
      res.send(JSON.stringify({success: true}));

      process.send({command: 'reset'});
    });

  /**
   * Begin test
   */
  app.post('/begin',
    timeout(pjson.setts.timeout, timeoutProps),
    function (req, res, next) {
      req.on('timeout', function () {
        res.send(JSON.stringify({msg: "Timeout"}));
      });

      res.contentType('application/json');

      if (!req.body.pw || req.body.pw != pjson.setts.pw) {
        // Respond
        res.send(JSON.stringify({
          success: false,
          msg: "Wrong password."
        }));
      } else if (url.parse(req.body.url).protocol == null) {
        res.send(JSON.stringify({
          success: false,
          msg: "Unable to parse URL."
        }));
      } else {
        // Send it
        req.body.command = 'begin';

        process.send(req.body);

        // Respond
        res.send(JSON.stringify({
          success: true
        }));
      }
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


