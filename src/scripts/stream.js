let STORE_OVERLAY_COLOR_NAME = 'streamOverlayColor';
let beeDooAudio = new Audio('/assets/beedoo_minions.mp3');
var socket = io();
socket.on('color-effect', effect => {
  const effectName = effect.toLocaleLowerCase();
  if (effectName === 'cop mode') {
    triggerCopModeEffect();
  } else if (effectName === 'subscribe') {
    startSubscribeEffectOverlay();
  } else if (effectName === 'follow') {
    startFollowEffectOverlay();
  }
});

function startFollowEffectOverlay() {
  startOverlayEffect('purple', 'white');
}

function startSubscribeEffectOverlay() {
  startOverlayEffect('purple', 'green');
}

function triggerCopModeEffect() {
  startCopModeAudio();
  startOverlayEffect('cop-red', 'cop-blue');
}

function startOverlayEffect(startColor, endColor) {
  let originalColor = localStorage.getItem(STORE_OVERLAY_COLOR_NAME);
  let counter = 0;
  let effectColor = startColor;
  let overlayEffectInterval = setInterval(() => {
    counter += 1;
    if (counter === 20) {
      setOverlayColor(originalColor);
      clearInterval(overlayEffectInterval);
    } else {
      setOverlayColor(effectColor);
      effectColor = effectColor === startColor ? endColor : startColor;
    }
  }, 500);
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
