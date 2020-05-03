$(document).ready(() => {
  const captains = console;
  $('#get-overlay').click(() => {
    const url = String($('#overlay-url').val());
    $('#overlay-frame').attr('src', url);
  });

  $('#increase-hue').click(() => {
    let currentHueValue = Number($('#rotation').val());
    const hueValue = currentHueValue < 361 ? (currentHueValue += 1) : 360;
    applyHue(hueValue);
  });

  $('#decrease-hue').click(() => {
    let currentHueValue = Number($('#rotation').val());
    const hueValue = currentHueValue > 0 ? (currentHueValue -= 1) : 0;
    applyHue(hueValue);
  });

  $('#save-color').click(() => {
    const hueRotateDeg = $('#rotation').val();
    const colorName = $('#color-name').val();
    const data = JSON.stringify({ colorName, hueRotateDeg });
    const requestOptions = {
      url: '/save',
      method: 'POST',
      data,
      contentType: 'application/json'
    };
    request(requestOptions).done(result => captains.log(result));
  });

  $('#update-hue').click(() => {
    const hueRotateDeg = Number($('#rotation').val());
    applyHue(hueRotateDeg);
  });

  function applyHue(hueRotateDeg: number) {
    $('#container').css('filter', `hue-rotate(${hueRotateDeg}deg)`);
  }

  function request(requestOptions: any) {
    return $.ajax(requestOptions)
      .done(result => result)
      .fail(error => {
        captains.error(error);
        return error;
      });
  }
});
