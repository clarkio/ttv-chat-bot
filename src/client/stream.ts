const captains = console;
const STORE_OVERLAY_COLOR_NAME = 'streamOverlayColor';
const beeDooAudio = new Audio('/assets/beedoo_minions.mp3');
// @ts-ignore
const socket = io();
socket.on('color-effect', (effect: string) => {
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
  // startCopModeAudio();
  startOverlayEffect('cop-red', 'cop-blue');
}

function startOverlayEffect(startColor: string, endColor: string) {
  const originalColor = String(localStorage.getItem(STORE_OVERLAY_COLOR_NAME));
  let counter = 0;
  let effectColor = startColor;
  const overlayEffectInterval = setInterval(() => {
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
  const minionDiv = $('#minion-bee-doo');
  minionDiv.toggleClass('copmode');
  beeDooAudio.loop = true;
  beeDooAudio.play();

  window.setTimeout(() => {
    minionDiv.toggleClass('copmode');
    beeDooAudio.pause();
  }, 10000);
}

socket.on('color-change', (color: string) => {
  captains.log(`Changing color to ${color}`);
  setOverlayColor(color);
});

function setOverlayColor(color: string) {
  localStorage.setItem(STORE_OVERLAY_COLOR_NAME, color);
  $('#container').removeClass();
  $('#container').addClass(color);
}

function getCurrentBulbColor() {
  $.get('/bulb/color', (result: any) => {
    captains.log(result);
    const bulbColor = result.color;
    setOverlayColor(bulbColor);
  });
}

getCurrentBulbColor();
