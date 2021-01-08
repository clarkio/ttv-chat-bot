import EffectsManager from './effects-manager';
import { inject, injectable } from 'inversify';
import TwitchUser from './twitch-user';
import { TYPES } from './types';

@injectable()
export default class TextToSpeech {
  public constructor(
      @inject(TYPES.EffectsManager) private effectsManager: EffectsManager
  ) {}

  public emitTextToSpeech(user: TwitchUser, message: string, isTrustedUser: boolean)
  {
    const ttsMessage = isTrustedUser
          ? `${user.username} says ${message}`
          : message;
        // determine voice to use
        // TODO: get rid of this BS you knuckle-headed baboon
        this.effectsManager.appServer.io.emit('tts', ttsMessage);
  }
}
