var forever = require('forever-monitor');

var child = new (forever.Monitor)('svr.js', {
  'silent': false,
  'options': [],
  'killTree': true
});

child.on('exit', function () {
  console.log('svr.js has exited after undermined restarts');
});

child.on('watch:restart', function (info) {
  console.error('Restarting script because ' + info.file + ' changed');
});

child.on('restart', function () {
  console.error('Forever restarting script for ' + child.times + ' time');
});

child.on('exit:code', function (code) {
  console.error('Forever detected script exited with code ' + code);
});

child.start();
