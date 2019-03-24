import * as config from './config';

/**
 * The purpose of this class is to provide capabilities for checking roles and permissions on requested actions to execute.
 */
export default class PermissionManager {
  constructor () {
    // Load/set permissions from configuration
  }

  public async hasPermission(requestedAction: string, requestorRole: string): Promise<boolean> {
    try {
      const requiredRoleForAction = await this.getRequiredRoleForAction(requestedAction);
      // return resolve(requestorRole >== requiredRoleForAction));
      return true;
    } catch(error) {
      console.error(error);
      return false;
    }
  }

  public async isMod(user: any) {
    throw new Error('Method not implemented.');
  }

  private async getRequiredRoleForAction(requestedAction: string) {
    throw new Error('Method not implemented.');
  }
}

/**
 * Roles:
 * 
 */