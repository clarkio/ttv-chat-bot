let STORE_OVERLAY_COLOR_NAME = 'streamOverlayColor';
let beeDooAudio = new Audio('/assets/beedoo_minions.mp3');
var socket = io();
socket.on('color-effect', effect => {
  if (effect.toLocaleLowerCase() === 'cop mode') {
    triggerCopModeEffect();
  }
});
function triggerCopModeEffect() {
  startCopModeAudio();
  startCopModeOverlay();
}

function startCopModeAudio() {
  let minionDiv = $('#minion-bee-doo');
  minionDiv.toggleClass('copmode');
  beeDooAudio.loop = true;
  beeDooAudio.play();

  window.setTimeout(() => {
    minionDiv.toggleClass('copmode');
    beeDooAudio.pause();
  }, 10000);
}

function startCopModeOverlay() {
  let originalColor = localStorage.getItem(STORE_OVERLAY_COLOR_NAME);
  let counter = 0;
  let copModeColor = 'red';
  let overlayCopModeInterval = setInterval(() => {
    counter += 1;
    if (counter === 20) {
      setOverlayColor(originalColor);
      clearInterval(overlayCopModeInterval);
    } else {
      setOverlayColor(copModeColor);
      copModeColor = copModeColor === 'red' ? 'blue' : 'red';
    }
  }, 500);
}

socket.on('color-change', color => {
  console.log(`Changing color to ${color}`);
  setOverlayColor(color);
});

function setOverlayColor(color) {
  localStorage.setItem(STORE_OVERLAY_COLOR_NAME, color);
  $('#container').removeClass();
  $('#container').addClass(color);
}

function getCurrentBulbColor() {
  $.get('/bulb/color', result => {
    console.log(result);
    let bulbColor = result.color;
    setOverlayColor(bulbColor);
  });
}
