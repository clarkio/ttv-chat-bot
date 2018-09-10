import { WebhookClient } from 'discord.js';
import { discordHookEnabled, discordHookId, discordHookToken } from './config';

export class DiscordBot {
  constructor() {
    //
  }

  public createDiscordHook = (): WebhookClient =>
    new WebhookClient(discordHookId, discordHookToken);
}
