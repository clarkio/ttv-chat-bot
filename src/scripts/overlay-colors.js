$(document).ready(() => {
  $('#get-overlay').click(() => {
    const url = $('#overlay-url').val();
    $('#overlay-frame').attr('src', url);
  });
});
