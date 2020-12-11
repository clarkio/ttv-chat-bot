// const synth = window.speechSynthesis;
// const utterance = new SpeechSynthesisUtterance();

// @ts-ignore

// tslint:disable-next-line
const SpeechSDK = window.SpeechSDK;
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
    let speechConfig = SpeechSDK.SpeechConfig.fromSubscription(azureSpeechToken, "westus2");
    startUtterance();
    speechConfig.speechSynthesisVoiceName = 'en-IE-EmilyNeural';
    synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
    synthesizer.speakTextAsync(
        speechQueue.shift() as string,
        (result:any) => {
            if (result) {
                console.log(JSON.stringify(result));
            }
            synthesizer.close();
            synthesizer = undefined;
        },
        (error:any) => {
            console.error(error);
            synthesizer.close();
            synthesizer = undefined;
        });
  }
}

function stopSpeaking() {
  synthesizer.close();
  synthesizer = undefined;
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
