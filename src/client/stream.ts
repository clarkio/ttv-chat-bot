import * as chroma from 'chroma-js';
import * as io from 'socket.io-client';

const captains = console;
const STORE_OVERLAY_COLOR_NAME = 'streamOverlayColor';
const beeDooAudio = new Audio('/assets/sounds/beedoo.mp3');
const audioPath = '/assets/sounds/';
const playNext = new CustomEvent('playNext', {
  bubbles: true
});
let audioQueue: any[] = [];

const audioPlayerElement = document.getElementById('audio-player');

if (audioPlayerElement) {
  audioPlayerElement.addEventListener('playNext', playAudioQueue, false);
}

const socket = io();
socket.on('color-effect', (effectColors: string[]) => {
  startOverlayEffect(effectColors);
});

socket.on('play-audio', addAudioToQueue);

function playAudioQueue() {
  if (audioQueue.length > 0 && audioPlayerElement) {
    const audio = audioQueue.shift();

    audioPlayerElement.appendChild(audio);
    audio.play().catch((error: any) => {
      throw error;
    });
  } else {
    if (!audioPlayerElement) {
      captains.warn(
        'Audio Player HTML element was not found by the expected ID'
      );
      return;
    }
  }
}

function addAudioToQueue(fileName: string) {
  const audio = document.createElement('audio');
  audio.src = `${audioPath}${fileName}.mp3`;
  audio.id = new Date().toLocaleString();
  audio.addEventListener('ended', stopAudioQueue, false);

  if (audioPlayerElement) {
    if (audioPlayerElement.childElementCount > 0) {
      audioQueue.push(audio);
    } else {
      audioPlayerElement.appendChild(audio);
      const playPromise = audio.play().catch(error => {
        throw error;
      });
    }
  }
}

function stopAudioQueue() {
  audioQueue = [];
  if (audioPlayerElement) {
    audioPlayerElement.innerHTML = '';
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
