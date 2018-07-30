$(document).ready(() => {
  $.get('/main/greenscreen/overlay', result => {
    $('#container').append(result.overlayIframe);

    getCurrentBulbColor();
  });
});
