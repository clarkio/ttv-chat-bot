import { injectable } from 'inversify';
import { Userstate } from 'tmi.js';
import { log } from './log';

@injectable()
export default class TwitchUser {
  public username!: string;
  public userId?: string;
  public isBroadcaster: boolean = false;
  public isMod: boolean = false;
  public isSubscriber: boolean = false;
  public isVIP: boolean = false;
  public isFounder: boolean = false;
  public userColor?: string;
  public badges: any = {};

  public init (userstate: Userstate, channel: string, mainUserName: string) {
    try {
      this.username =
        userstate['display-name'] || userstate.username || mainUserName;
      this.isBroadcaster = '#' + userstate.username === channel;
      this.isMod = userstate.mod || false;
      // @ts-ignore
      this.isFounder = userstate.badges && userstate.badges.founder === '0';
      this.isSubscriber =
        this.isFounder ||
        (userstate.badges &&
          typeof userstate.badges.subscriber !== 'undefined') ||
        userstate.subscriber ||
        false;
      // @ts-ignore
      this.isVIP = (userstate.badges && userstate.badges.vip === '1') || false;
      this.userId = userstate['user-id'];
      this.badges = userstate.badges;
      this.userColor = userstate.color;
    } catch (error) {
      log('error', error);
    }
  }
}
