var pjson = require('../package.json');

function crawlRewrite(obj, root) {
  root = root || '';
  if (root.length > 0) {
    root = root + '_';
  }
  for (var elm in obj) {
    if (elm != 'scripts' && elm != 'name' && elm != 'dependencies' && elm != 'version' && elm != 'main' && elm != 'author' && elm != 'license' && elm != 'description') {
      if (typeof(obj[elm]) == 'object') {
        crawlRewrite(obj[elm], root + elm);
      } else {
        var key = pjson.name + '_' + root + elm;
        //console.log("Reading environment variable ", key, "...");
        obj[elm] = typeof(process.env[key]) != 'undefined' ? process.env[key] : obj[elm];
      }
    }
  }
}

crawlRewrite(pjson);

module.exports = pjson;