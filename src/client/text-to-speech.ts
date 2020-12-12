// @ts-ignore

const SpeechSDK = window.SpeechSDK;
import { SpeechSynthesisResult } from 'microsoft-cognitiveservices-speech-sdk';
SpeechSDK.Recognizer.enableTelemetry(false);
let speechConfig: any;
let synthesizer: any;
let azureSpeechToken = '';

const requestOptions = {
  contentType: 'application/json',
  method: 'get',
  url: '/tokens?name=azureSpeechToken'
};
request(requestOptions).done(result => {
  console.log(result);
  azureSpeechToken = result;
});

let speechQueue: string[] = [];
let isSpeaking: boolean = false;

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

function finishUtterance(): any {
  isSpeaking = false;
  speak();
}

function startUtterance() {
  isSpeaking = true;
}

function speak() {
  if (speechQueue.length > 0 && !isSpeaking) {
    startUtterance();
    let speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureSpeechToken, "westus2");
    speechConfig.speechSynthesisVoiceName = 'en-IE-EmilyNeural';
    synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    const textToSpeak = speechQueue.shift() as String;
    synthesizer.speakTextAsync(textToSpeak, synthesizerCompleted.bind(null, textToSpeak) as any, synthesizerFailed);
  }
}

function synthesizerCompleted (textToSpeak: String, result: SpeechSynthesisResult) {
  let logMessage = 'Speaking has completed: '
  if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
    logMessage += "synthesis finished for [" + textToSpeak + "].\n";
    resetSpeaking();
  } else if (result.reason === SpeechSDK.ResultReason.Canceled) {
    logMessage += "synthesis failed. Error detail: " + result.errorDetails + "\n";
    resetSpeaking();
  }
  console.log(logMessage);
}

function synthesizerFailed (error: any) {
  console.error(error);
  resetSpeaking();
}

function stopSpeaking() {
  synthesizer.close();
  synthesizer = undefined;
  isSpeaking = false;
}

function resetSpeaking() {
  synthesizer.close();
  synthesizer = undefined;
  finishUtterance();
}

function request(requestOptions: any) {
  return $.ajax(requestOptions)
    .done(result => result)
    .fail(error => {
      captains.error(error);
      return error;
    });
}
