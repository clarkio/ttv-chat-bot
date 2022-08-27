import EffectsService from './effects-service';
import { inject, injectable } from 'inversify';
import TwitchUser from './twitch-user';
import { TYPES } from './types';

@injectable()
export default class TextToSpeech {
  public constructor(
    @inject(TYPES.EffectsService) private effectsService: EffectsService
  ) {}

  public emitTextToSpeech(
    user: TwitchUser,
    message: string,
    isTrustedUser: boolean
  ) {
    const ttsMessage = isTrustedUser
      ? `${user.username} says ${message}`
      : message;
    // determine voice to use
    // TODO: get rid of this BS you knuckle-headed baboon
    this.effectsService.socketServer.emit('tts', ttsMessage);
  }

  public executeTextToSpeech(username: string, message: string) {
    const ttsMessage = `Message from ${username}: ${message}`;
    this.effectsService.socketServer.emit('tts', ttsMessage);
  }
}
