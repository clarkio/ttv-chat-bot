$(document).ready(() => {
  $.get('/main/guest/overlay', result => {
    console.log(result);
    $('#container').append(result.overlayIframe);

    getCurrentBulbColor();
  });
});
