
$(document).ready(function() {

  /**
   * Submit button
   */
  $("#starttestbutton").click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    serializeFormToMemory($("#controlfrm"));
    var cform = new ControlForm($("#controlfrm")[0]);
  });

  /**
   * Prevent form submit
   */
  $("#controlfrm").on( "submit", function( event ) {
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

  /**
   * Select a verb
   * @param verb
   */
  var selectHTTPVerb = function(verb) {
    verb = (verb || 'get').toUpperCase();
    $("#selectedVerbLabel").html(verb);
    $("#selectedVerb").val(verb);
    if (verb.toUpperCase() == 'POST') {
      $("#formBodyArea").css({display: "block"});
    } else {
      $("#formBodyArea").css({display: "none"});
    }
  };
  restoreFormToMemory($("#controlfrm"));
  selectHTTPVerb($("#selectedVerb").val());
  $("#verbSelector a").mousedown(function(){
    selectHTTPVerb(this.innerHTML);
  });
});