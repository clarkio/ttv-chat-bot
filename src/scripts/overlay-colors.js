$(document).ready(() => {
  const captains = console;
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

  $('#save-color').click(() => {
    const colorName = $('#color-name').val();
    const data = JSON.stringify({ colorName, hueRotateDeg: hueValue });
    const requestOptions = {
      url: '/save',
      method: 'POST',
      data,
      contentType: 'application/json'
    };
    request(requestOptions).done(result => captains.log(result));
  });

  function request(requestOptions) {
    return $.ajax(requestOptions)
      .done(result => result)
      .fail(error => {
        captains.error(error);
        return error;
      });
  }
});
