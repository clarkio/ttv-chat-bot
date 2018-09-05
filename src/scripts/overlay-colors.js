$(document).ready(() => {
  let hueValue = 0;
  $('#get-overlay').click(() => {
    const url = $('#overlay-url').val();
    $('#overlay-frame').attr('src', url);
  });

  $('#increase-hue').click(() => {
    hueValue = hueValue < 361 ? (hueValue += 1) : 360;
    $('#container').css('filter', `hue-rotate(${hueValue}deg)`);
  });

  $('#decrease-hue').click(() => {
    hueValue = hueValue > 0 ? (hueValue -= 1) : 0;
    $('#container').css('filter', `hue-rotate(${hueValue}deg)`);
  });
});
