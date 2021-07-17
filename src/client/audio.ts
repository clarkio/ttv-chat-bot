import socket from './sockets';
import { captains } from './stream';

const audioPath = '/assets/sounds/';
const playNext = new CustomEvent('playNext', {
  bubbles: true,
});
let currentlyPlayingAudio: HTMLAudioElement[] = [];

socket.on('play-audio', (fileName: string) => {
  playAudio(fileName);
});

socket.on('stop-current-audio', () => {
  stopCurrentAudio();
});

socket.on('stop-all-audio', () => {
  stopAllAudio();
});

function stopAllAudio() {
  stopCurrentAudio();
}

function stopCurrentAudio() {
  currentlyPlayingAudio.forEach((audio) => audio.pause());
  currentlyPlayingAudio = [];
}

function playAudio(fileName: string) {
  const audioFile = `${audioPath}${fileName}`;
  const audioPlayer = new Audio(audioFile);
  audioPlayer.id = audioFile;

  audioPlayer.addEventListener('ended', () => {
    captains.log('audio playback finished and emitting to socket');
    socket.emit('audio-finished');
  });

  currentlyPlayingAudio.push(audioPlayer);
  const playPromise = audioPlayer.play();

  if (playPromise !== undefined) {
    playPromise
      .then((_) => {
        captains.log('audio playback started');
      })
      .catch((error: any) => {
        throw error;
      });
  }
}
