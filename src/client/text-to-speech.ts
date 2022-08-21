// @ts-ignore
const SpeechSDK = window.SpeechSDK;
// @ts-ignore
const axios = window.axios;
SpeechSDK.Recognizer.enableTelemetry(false);
let speechConfig: any;
let synthesizer: any;
let azureSpeechToken = '';
let azureSpeechApiAccessToken = '';
const azureSpeechTokenUrl =
  'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken';
const azureTextToSpeechUrl =
  'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';

let audioCtx = new AudioContext({
  sampleRate: 48000,
});
let queue: AudioBuffer[] = [];
let currentAudio: AudioBufferSourceNode;
let isPlaying: boolean = false;
let speechQueue: string[] = [];
let isSpeaking: boolean = false;
const resetTokenTimeInMinutes = 9;
let resetTokenInterval;

axios
  .get('/tokens?name=azureSpeechToken')
  .then((result: any) => {
    azureSpeechToken = result.data;
    getAzureSpeechApiToken();
  })
  .catch((error: any) => {
    console.error(error);
  });

function getAzureSpeechApiToken() {
  // Token is only valid for 10 minutes:
  // https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/rest-text-to-speech#how-to-use-an-access-token

  axios
    .post(
      azureSpeechTokenUrl,
      {},
      {
        headers: {
          'Ocp-Apim-Subscription-Key': azureSpeechToken,
        },
      }
    )
    .then((result: any) => {
      azureSpeechApiAccessToken = result.data;
      resetTokenInterval = setInterval(
        getAzureSpeechApiToken,
        resetTokenTimeInMinutes * 60 * 1000
      );
    })
    .catch((error: any) => {
      console.error(error);
    });
}

socket.on('tts', (textToSpeakData: any) => {
  addToSpeakQueue(textToSpeakData);
  loadText();
});

socket.on('tts-skip', () => {
  stopSpeaking();
  loadText();
});

function addToSpeakQueue(textToSpeakData: any): void {
  speechQueue.push(textToSpeakData);
}

function finishSpeaking(textToSpeakItem: any): void {
  isSpeaking = false;
  loadText();
  socket.emit('tts-complete', textToSpeakItem);
}

// TODO: restructure to the following
//  function speak()
//    calls async loadText
//    calls async playText from loadText result

function loadText() {
  if (speechQueue.length > 0 && !isSpeaking) {
    isSpeaking = true;
    const textToSpeakItem = speechQueue.shift() as any;

    // Note: Standard voices will no longer be supported for new speech resources
    // https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/language-support#standard-voices
    const body = `
    <speak version='1.0' xml:lang='en-US'>
      <voice xml:lang='en-US' xml:gender='Female' name='en-US-AriaNeural'>
        ${textToSpeakItem.message}
      </voice>
    </speak>`;

    axios
      .post(azureTextToSpeechUrl, body, {
        headers: {
          Authorization: `Bearer ${azureSpeechApiAccessToken}`,
          'X-Microsoft-OutputFormat': 'audio-16khz-64kbitrate-mono-mp3',
          'Content-Type': 'application/ssml+xml',
        },
        responseType: 'arraybuffer',
      })
      .then(async (result: any) => {
        const audioBuffer = await audioCtx.decodeAudioData(result.data);
        const audioSource = audioCtx.createBufferSource();
        audioSource.buffer = audioBuffer;
        audioSource.connect(audioCtx.destination);
        currentAudio = audioSource;
        audioSource.start(0);
        audioSource.onended = function finishedPlayingAudio(ev: Event) {
          finishSpeaking(textToSpeakItem);
        };
      })
      .catch((error: any) => {
        console.error(error);
        isSpeaking = false;
      });
  }
}

function stopSpeaking() {
  currentAudio.stop();
  isSpeaking = false;
}
