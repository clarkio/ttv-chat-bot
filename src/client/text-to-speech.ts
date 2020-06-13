const synth = window.speechSynthesis;
const utterance = new SpeechSynthesisUtterance();

socket.on('tts', (textToSpeak: string) => {
  speak(textToSpeak);
});

function speak(textToSpeak: string) {
  utterance.voice = synth.getVoices()[9];
  utterance.text = textToSpeak;
  synth.speak(utterance);
}
