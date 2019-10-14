import { WebhookClient } from 'discord.js';
import { discordHookId, discordHookToken } from './config';

export class DiscordBot {
  public createDiscordHook = (): WebhookClient =>
    new WebhookClient(discordHookId, discordHookToken);
}
