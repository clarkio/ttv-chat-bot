import { LiveChat } from 'youtube-chat';
import { CommentItem } from 'youtube-chat/dist/parser';
import { twitchChat as constants } from './constants';
import EffectsManager from './effects-manager';
import { log } from './log';

const captains = console;

export class YouTubeChat {
  private liveChat: LiveChat;
  private lightControlCommands: string[] = [
    constants.defaultLightControlCommand
  ];
  private lightCommandUsed: string = '';

  constructor(private effectsManager: EffectsManager) {
    this.liveChat = new LiveChat(
      { channelId: 'UCID02LhTNYYhWbok3zyggOw' },
      250
    );
    // Emit at start of observation chat.
    this.liveChat.on('start', (liveId: string) => {
      captains.log('Started listening to YT Live Chat');
    });

    // Emit at end of observation chat.
    // this.liveChat.on('end', (reason: string) => {});

    // Emit at receive chat.
    this.liveChat.on('comment', (comment: CommentItem) => {
      const message = comment.message
        .map((m: any) => m.text + '\n')
        .toLocaleString()
        .trim();
      captains.log(`${comment.author.name}: ${message}`);
      if (message) {
        this.parseChat(message, comment.author.name);
      }
    });
    // Emit when an error occurs
    this.liveChat.on('error', (err: Error) => {
      captains.error(err);
    });
  }

  public startListening(): Promise<boolean> {
    return this.liveChat.start();
  }

  /**
   * Check if the message is a light control command
   */
  private isLightControlCommand = (message: string) =>
    this.lightControlCommands.some((command: string): boolean => {
      const comparison = message.startsWith(command.toLowerCase());
      this.lightCommandUsed = comparison ? command : '';
      return comparison;
    });

  private parseChat = (message: string, userName: string) => {
    if (this.isLightControlCommand(message)) {
      // viewer attempting to control the overlay/lights
      const commandMessage = message.slice(this.lightCommandUsed.length).trim();

      return this.startColorChange(commandMessage, userName);
    }

    return Promise.resolve(constants.logs.nothingToParseMessage);
  };

  /**
   * Change the color in multiple places if needed
   *
   * @param commandMessage message to send to the bot
   * @param userName who sent the message
   */
  private startColorChange = (commandMessage: string, userName: string) => {
    // TODO Convert color names to hex code before sending to the bot?
    this.effectsManager.updateOverlay(commandMessage);

    // TODO update so that effects manager handles azure bot related workload
    if (this.effectsManager.azureBot) {
      return this.effectsManager.azureBot
        .sendCommand(commandMessage, userName)
        .then((result: any) => {
          log('info', `Successfully sent the command from ${userName}`);
          return result;
        })
        .catch((error: any) => {
          log('error', error);
          return error;
        });
    }
  };
}
