import * as config from './config';
import { log } from './log';

export enum RoleLevel {
  viewer = 0,
  follower = 1,
  moderator = 2,
  broadcaster = 5
}

/**
 * The purpose of this class is to provide capabilities for checking roles and permissions on requested actions to execute.
 */
export default class PermissionManager {
  constructor (private moderators: string[]) {
    // Load/set permissions from configuration
  }

  public async hasPermission(requestedAction: string, requestorRole: string): Promise<boolean> {
    try {
      const requiredRoleLevelForAction = await this.getRequiredMinimumRoleForAction(requestedAction);
      // return resolve(requestorRole >== requiredRoleForAction));
      return true;
    } catch(error) {
      log('error', error);
      return false;
    }
  }

  public async isMod(username: string) {
    return this.moderators.some((moderator: string) => moderator.toLocaleLowerCase() === username.toLocaleLowerCase());
  }

  private async getRequiredMinimumRoleForAction(requestedAction: string) : Promise<RoleLevel> {
    // TODO: read action requirements from configuration/settings file?
    /* Example: action requires moderator role (level 2) so return enum RoleLevel.moderator
     */
    try {
      return RoleLevel.moderator;
    } catch(error) {
      log('error', error);
      throw error;
    }
  }
}

/**
 * Roles:
 * 
 */