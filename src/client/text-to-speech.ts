// const synth = window.speechSynthesis;
// const utterance = new SpeechSynthesisUtterance();

// @ts-ignore

// tslint:disable-next-line
const SpeechSDK = window.SpeechSDK;
SpeechSDK.Recognizer.enableTelemetry(false);
let speechConfig: any;
let synthesizer: any;
const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();

const requestOptions = {
  contentType: 'application/json',
  method: 'get',
  url: '/tokens?name=azureSpeechToken'
};
request(requestOptions).done(result => {
  console.log(result);
  speechConfig = SpeechSDK.SpeechConfig.fromSubscription(result, "westus2");
  speechConfig.speechSynthesisVoiceName = 'en-IE-EmilyNeural';
  synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
});

let speechQueue: string[] = [];
let isSpeaking: boolean = false;

setupSpeechToText();

function setupSpeechToText() {
  // utterance.voice = synth.getVoices()[9];
  // utterance.onend = finishUtterance;
  // utterance.onstart = startUtterance;
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
    // utterance.text = speechQueue.shift() as string;
    // synth.speak(utterance);
    synthesizer.speakTextAsync(
        speechQueue.shift() as string,
        (result:any) => {
            if (result) {
                console.log(JSON.stringify(result));
            }
        },
        (error:any) => {
            console.error(error);
            synthesizer.close();
        });
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
  // synth.cancel();
  synthesizer.close();
  synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
  isSpeaking = false;
}

function request(requestOptions: any) {
  return $.ajax(requestOptions)
    .done(result => result)
    .fail(error => {
      captains.error(error);
      return error;
    });
}
