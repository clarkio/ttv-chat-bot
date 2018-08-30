$(document).ready(() => {
  $.get('/main/guest2/overlay', result => {
    console.log(result);
    $('#container').append(result.overlayIframe);

    getCurrentBulbColor();
  });
});
