$(document).ready(() => {
  $.get('/main/overlay', result => {
    $('#container').append(result.overlayIframe);

    getCurrentBulbColor();
  });
});
