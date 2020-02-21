const captains = console;
const STORE_OVERLAY_COLOR_NAME = 'streamOverlayColor';
const beeDooAudio = new Audio('/assets/sounds/beedoo.mp3');
const audioPath = '/assets/sounds/';
const playNext = new CustomEvent('playNext', {
  bubbles: true
});
let audioQueue: HTMLAudioElement[] = [];
// let audioPlayer = null;

const socket = io();
socket.on('color-effect', (effectColors: string[]) => {
  startOverlayEffect(effectColors);
});

socket.on('play-audio', (fileName: string) => {
  addAudioToQueue(fileName);
});

socket.on('stop-current-audio', () => {
  stopCurrentAudio();
  playAudioQueue();
});

socket.on('stop-all-audio', () => {
  stopAllAudio();
});

function playAudioQueue() {
  if (audioQueue.length > 0) {
    const audioPlayer = audioQueue[0];
    audioPlayer.addEventListener('ended', () => {
      captains.log('audio playback finished');
      audioQueue.shift();
      playAudioQueue();
    });
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
      playPromise
        .then(_ => {
          captains.log('audio playback started');
        })
        .catch((error: any) => {
          throw error;
        });
    }
  }
}

function stopAllAudio() {
  // !stop
  // !stopall
  stopCurrentAudio();
  audioQueue = [];
}

function stopCurrentAudio() {
  if (audioQueue.length > 0) {
    const currentAudio = audioQueue.shift();
    currentAudio!.pause();
  }
}

function addAudioToQueue(fileName: string) {
  const audioFile = `${audioPath}${fileName}`;
  const audioPlayer = new Audio(audioFile);
  audioPlayer.id = audioFile;

  if (audioQueue.length === 0) {
    audioQueue.push(audioPlayer);
    playAudioQueue();
  } else {
    audioQueue.push(audioPlayer);
  }
}

function triggerCopModeEffect() {
  startCopModeAudio();
}

function startOverlayEffect(colors: string[]) {
  const originalColor = String(localStorage.getItem(STORE_OVERLAY_COLOR_NAME));
  let counter = 0;
  let colorIndex = 0;
  let effectColor = colors[colorIndex];
  const overlayEffectInterval = setInterval(() => {
    counter += 1;
    if (counter === 10) {
      setOverlayColor(originalColor);
      clearInterval(overlayEffectInterval);
    } else {
      setOverlayColor(effectColor);
      colorIndex = colorIndex === colors.length - 1 ? 0 : ++colorIndex;
      effectColor = colors[colorIndex];
    }
  }, 1000);
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

  const hexColor = chroma(color).hex();
  const hslColor = chroma(hexColor).hsl();
  let [degRotation] = hslColor;
  const [, saturation, lightness] = hslColor;

  degRotation = Number.isNaN(degRotation) ? 0 : degRotation;
  const correctedLightness = lightness * 2;

  $('#container').css(
    '-webkit-filter',
    `hue-rotate(${degRotation}deg) saturate(${saturation}) brightness(${correctedLightness})`
  );
}

function getCurrentBulbColor() {
  $.get('/bulb/color', (result: any) => {
    captains.log(result);
    const bulbColor = result.color;
    setOverlayColor(bulbColor);
  });
}

getCurrentBulbColor();
