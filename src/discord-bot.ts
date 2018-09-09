import { WebhookClient } from 'discord.js';
import { discordHookEnabled, discordHookId, discordHookToken } from './config';

export class DiscordBot {
  constructor() {
    //
  }

  public createDiscordHook = (): WebhookClient | undefined => {
    if (discordHookEnabled.toLocaleLowerCase() === 'true') {
      return new WebhookClient(discordHookId, discordHookToken);
    }
    return;
  };
}
