import lame from 'lame';
import fs from 'fs';
import Speaker from 'speaker';
import Volume from 'pcm-volume';

export default class AudioPlayer {
  constructor() {
    //
  }

  public async play(filePath: string) {
    const inputStream = fs.createReadStream(filePath);
    this.playStream(inputStream, {
      loop: false,
      volume: 0.2
    });
  }

  private async playStream(input: fs.ReadStream, options: any) {
    options = options || {};
    const v = new Volume();
    if (options.volume) {
      v.setVolume(options.volume);
    }
    this.decodeAudio(input).then((decodeResult: any) => {
      decodeResult.audio.pipe(v).pipe(decodeResult.speaker);
    });
  }

  private async decodeAudio(input: fs.ReadStream): Promise<any> {
    return new Promise((resolve, reject) => {
      const decoder = lame.Decoder();
      let speaker: any;
      const audio = input.pipe(decoder).on('format', (format: any) => {
        speaker = new Speaker({
          channels: format.channels,
          sampleRate: format.sampleRate
        });
        resolve({ audio, speaker });
      });
    });
  }

  private async start(input: fs.ReadStream, decoder: any, v: Volume) {
    // v.pipe(speaker);
  }

  private setupSpeaker(audioFileFormat: any): any {
    //{raw_encoding: 208, sampleRate: 44100, channels: 1, signed: true, float: false, …}
    const speaker = new Speaker({
      sampleRate: audioFileFormat.sampleRate
    });
    return speaker;
  }
}
