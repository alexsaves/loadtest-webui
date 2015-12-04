/**
 * Display
 * @param zone
 * @constructor
 */
var Display = function(zone) {
  $(".zonearea").each(function(idx, el) {
    if (el.id == zone) {
      $(el).removeClass('hidden');
    } else {
      $(el).addClass('hidden');
    }
  });
};