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
          $("#vertop").html(dmsg.ver);
        }
      });
    }
  };
  this.checkTimer = setInterval(docheck, 2000);
  docheck();
};