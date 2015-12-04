
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
});