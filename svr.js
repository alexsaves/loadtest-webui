/**
 * Global requires.
 * (Note, NewRelic should be 1st in this list.)
 */
var pjson = require('./lib/environ'),
  status = require('./lib/status'),
  teststate = require('./lib/teststate'),
  express = require('express'),
  bodyParser = require('body-parser'),
  timeout = require('connect-timeout'),
  url = require('url'),
  fs = require('fs');

// Log a message
var logMessage = function (msg) {
  if (typeof msg == 'object') {
    msg = JSON.stringify(msg);
  }
  //fs.appendFileSync('./log.txt', msg + '\n');
};
logMessage('Setting up.');
logMessage(pjson.name + ' ' + pjson.version);

// Set the time zone
process.env.TZ = pjson.setts.timeZone;

// Will hold the definitions source
var defSrc;

// Count the machine's CPUs
var cpuCount = require('os').cpus().length;

// The loadtest
var loadtest = require('loadtest'),
  latesttest = null,
  testinfo = {};

// Set up the state
var thestate = new teststate();

// Tell the world
console.log("Starting " + pjson.name + " " + pjson.version + " on 1 CPU - Connection timeout set to " + pjson.setts.timeout + "..");

// Fork the server
var masterStatus = {
  status: 'idle',
  zone: 'controlform'
};

/**
 * Run the test
 * @param msgobj
 */
var runtestfunction = function (msgobj) {
  // console.log("Recieved loadtest instructions from worker: ", msgobj);
  logMessage(msgobj);
  if (msgobj.command == 'begin') {
    var rps = parseInt(msgobj.rps),
      secs = parseInt(msgobj.secs),
      targ = url.parse(msgobj.url),
      verb = msgobj.selectedVerb,
      postBody = msgobj.formbody,
      headers = msgobj.headers,
      contentType = "text/html";

    try {
      headers = JSON.parse(headers);
    } catch (e) {
      console.log("Headers were not valid JSON.");
      headers = {};
    }
    var hkeys = Object.keys(headers);
    for (var p = 0; p < hkeys.length; p++) {
      if (hkeys[p].toLowerCase() == 'content-type') {
        contentType = headers[hkeys[p]];
        delete headers[hkeys[p]];
      }
    }
    testinfo = msgobj;

    function statusCallback(latency, result) {
      masterStatus.testResults = latency;
      masterStatus.testInfo = testinfo;
    }

    var options = {
      url: msgobj.url,
      requestsPerSecond: Math.min(300, rps),
      maxSeconds: secs,
      timeout: 120000,
      concurrency: 8,
      method: verb || 'GET',
      contentType: contentType,
      headers: headers || {},
      statusCallback: statusCallback
    };
    if (postBody) {
      options.body = postBody;
    }
    logMessage(options);

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
};

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
    console.log("HI");
    logMessage('Serving root. Redirecting to index.');
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
    masterStatus.ver = pjson.version;
    masterStatus.name = pjson.name;
    res.send(JSON.stringify(masterStatus));
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

    runtestfunction({command: 'reset'});
  });

/**
 * Begin test
 */
app.post('/begin',
  timeout(pjson.setts.timeout, timeoutProps),
  function (req, res, next) {

    logMessage("Received a message to begin.");

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

      // Respond
      res.send(JSON.stringify({
        success: true,
        body: req.body
      }));

      runtestfunction(req.body);
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
  logMessage('Express server listening on port ' + app.get('port'));
});



