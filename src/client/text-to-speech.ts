// @ts-ignore
const SpeechSDK = window.SpeechSDK;
// @ts-ignore
const axios = window.axios;
// import { SpeechSynthesisResult } from 'microsoft-cognitiveservices-speech-sdk';
SpeechSDK.Recognizer.enableTelemetry(false);
let speechConfig: any;
let synthesizer: any;
let azureSpeechToken = '';
let azureSpeechApiAccessToken = '';
const azureSpeechTokenUrl = 'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken';
const azureTextToSpeechUrl = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';

let audioCtx = new AudioContext({
  sampleRate: 48000,
});
let queue: AudioBuffer[] = [];
let currentAudio = null;
let isPlaying: boolean = false;
let speechQueue: string[] = [];
let isSpeaking: boolean = false;

axios.get('/tokens?name=azureSpeechToken')
  .then((result:any) => {
    console.log(result);
    azureSpeechToken = result.data;
    getAzureSpeechApiToken();
  })
  .catch((error:any) => {
    console.error(error);
  })

function getAzureSpeechApiToken() {
  // TODO: get a new token after 9 minutes
  // Token is only valid for 10 minutes:
  // https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#how-to-use-an-access-token

  axios.post(azureSpeechTokenUrl, {}, {
    headers: {
      'Ocp-Apim-Subscription-Key': azureSpeechToken
    }
  })
  .then((result:any) => {
    console.log(result);
    azureSpeechApiAccessToken = result.data;
  })
  .catch((error: any) => {
    console.error(error);
  });
}

socket.on('tts', (textToSpeak: string) => {
  addToSpeakQueue(textToSpeak);
  loadText();
});

socket.on('tts-skip', () => {
  stopSpeaking();
  loadText();
});

function addToSpeakQueue(textToSpeak: string): void {
  speechQueue.push(textToSpeak);
}

function finishUtterance(): void {
  isSpeaking = false;
  loadText();
}

function startUtterance(): void {
  isSpeaking = true;
}

//  function speak()
//    calls async loadText
//    calls async playText from loadText result

function loadText() {
  const textToSpeak = speechQueue.shift() as string;

  const body = `
  <speak version='1.0' xml:lang='en-US'>
    <voice xml:lang='en-US' xml:gender='Female' name='en-US-AriaRUS'>
      ${textToSpeak}
    </voice>
  </speak>`;

  axios.post(azureTextToSpeechUrl, body, {
    headers: {
      'Authorization': `Bearer ${azureSpeechApiAccessToken}`,
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'Content-Type': 'application/ssml+xml'
    }
  })
  .then(async (result: any) => {
    isSpeaking = true;
    console.log(result);

    const view = new TextEncoder().encode(result.data).buffer as ArrayBuffer;
    const audioBuffer = await audioCtx.decodeAudioData(view);
    const audioSource = audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(audioCtx.destination);
    currentAudio = audioSource;
    audioSource.start(audioCtx.currentTime);
    audioSource.onended = () => {
      currentAudio = null;
      isSpeaking = false;
      return;
    }
  })
  .catch((error:any) => {
    console.error(error);
  });
}

function stopSpeaking() {
  synthesizer.close();
  synthesizer = undefined;
  isSpeaking = false;
}

/*
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
*/
