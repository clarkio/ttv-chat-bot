const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance();
let speechQueue: string[] = [];
let isSpeaking: boolean = false;

setupSpeechToText();

function setupSpeechToText() {
  utterance.voice = synth.getVoices()[9];
  utterance.onend = finishUtterance;
  utterance.onstart = startUtterance;
}

socket.on('tts', (textToSpeak: string) => {
  addToSpeakQueue(textToSpeak);
  speak();
});

socket.on('tts-skip', () => {
  stopSpeaking();
  speak();
});

function addToSpeakQueue(textToSpeak: string) {
  speechQueue.push(textToSpeak);
}

function speak() {
  if (speechQueue.length > 0 && !isSpeaking) {
    utterance.text = speechQueue.shift() as string;
    synth.speak(utterance);
  }
}

function finishUtterance(event: Event): any {
  isSpeaking = false;
  speak();
}

function startUtterance(event: Event) {
  isSpeaking = true;
}

function stopSpeaking() {
  synth.cancel();
  isSpeaking = false;
}
